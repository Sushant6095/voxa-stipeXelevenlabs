'use server';

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

import { cloneVoice, ingestKnowledgeBaseFromUrl } from '@/lib/elevenlabs';
import { N8N_WORKFLOWS, triggerN8nWorkflow } from '@/lib/n8n';
import { createServiceClient } from '@/lib/supabase/server';

import {
  businessFormSchema,
  websiteUrlSchema,
  type BusinessFormValues,
} from './schemas';

/**
 * Onboarding server actions.
 *
 * Each action:
 *  - Verifies Clerk auth (throws on failure — the form callers surface this
 *    via try/catch + sonner)
 *  - Parses input with Zod (throws on bad shape)
 *  - Uses the SERVICE-ROLE Supabase client because the placeholder business
 *    row was created by the Stripe webhook + checkout flow which doesn't go
 *    through RLS (the business may not have a subscription row yet, and
 *    `current_business_id()` would return NULL).
 *
 * All mutations are scoped by `clerk_user_id` so a malicious caller cannot
 * touch another tenant's business via a forged `business_id`.
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

class OnboardingError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'UNAUTHORIZED'
      | 'NO_BUSINESS'
      | 'NO_AGENT'
      | 'CLONE_FAILED'
      | 'INGEST_FAILED'
      | 'PERSIST_FAILED',
  ) {
    super(message);
    this.name = 'OnboardingError';
  }
}

async function requireClerkUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new OnboardingError('Not signed in', 'UNAUTHORIZED');
  }
  return userId;
}

async function findBusinessId(
  userId: string,
): Promise<{ id: string; name: string }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (error) {
    throw new OnboardingError(
      `Business lookup failed: ${error.message}`,
      'PERSIST_FAILED',
    );
  }
  if (!data) {
    throw new OnboardingError(
      'No business found for this account. Complete checkout first.',
      'NO_BUSINESS',
    );
  }
  return data;
}

// ---------------------------------------------------------------------------
// Step 2 — Business details
// ---------------------------------------------------------------------------

export interface SaveBusinessResult {
  readonly ok: true;
  readonly businessId: string;
}

export async function saveBusinessDetails(
  values: BusinessFormValues,
): Promise<SaveBusinessResult> {
  const userId = await requireClerkUserId();
  const parsed = businessFormSchema.parse(values);

  const supabase = createServiceClient();

  const { data: updated, error } = await supabase
    .from('businesses')
    .update({
      name: parsed.name,
      owner_whatsapp: parsed.ownerWhatsApp,
      language: parsed.language,
      website_url: parsed.websiteUrl ? parsed.websiteUrl : null,
    })
    .eq('clerk_user_id', userId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw new OnboardingError(
      `Business update failed: ${error.message}`,
      'PERSIST_FAILED',
    );
  }
  if (!updated) {
    throw new OnboardingError(
      'No business row to update — did checkout complete?',
      'NO_BUSINESS',
    );
  }

  revalidatePath('/onboarding', 'layout');
  return { ok: true, businessId: updated.id };
}

// ---------------------------------------------------------------------------
// Step 3 — Voice clone
// ---------------------------------------------------------------------------

const MAX_VOICE_BYTES = 10 * 1024 * 1024; // 10MB hard cap

export interface UploadVoiceCloneResult {
  readonly ok: true;
  readonly voiceId: string;
}

export async function uploadVoiceClone(
  formData: FormData,
): Promise<UploadVoiceCloneResult> {
  const userId = await requireClerkUserId();

  const audio = formData.get('audio');
  if (!audio || typeof audio === 'string') {
    throw new OnboardingError(
      'Form field "audio" must be a file',
      'CLONE_FAILED',
    );
  }
  // `File extends Blob` so this also accepts plain Blobs from MediaRecorder.
  const blob: Blob = audio;

  if (blob.size === 0) {
    throw new OnboardingError('Audio sample is empty', 'CLONE_FAILED');
  }
  if (blob.size > MAX_VOICE_BYTES) {
    throw new OnboardingError(
      `Audio sample exceeds ${MAX_VOICE_BYTES} bytes`,
      'CLONE_FAILED',
    );
  }
  // MediaRecorder commonly emits `audio/webm`. EL accepts most audio MIMEs.
  if (blob.type && !blob.type.startsWith('audio/')) {
    throw new OnboardingError(
      `Unsupported audio MIME: ${blob.type}`,
      'CLONE_FAILED',
    );
  }

  const business = await findBusinessId(userId);

  let voiceId: string;
  try {
    const result = await cloneVoice({
      name: `voxa-${userId.slice(0, 8)}`,
      description: `Voxa receptionist voice for ${business.name}`,
      files: [blob],
    });
    voiceId = result.voiceId;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown clone error';
    throw new OnboardingError(
      `Voice clone failed: ${message}`,
      'CLONE_FAILED',
    );
  }

  // Persist on the existing agent row if there is one; otherwise stash on
  // the business via a side-table is not necessary — the n8n onboarding
  // workflow reads `agents.elevenlabs_voice_id` post-create and re-applies
  // if missing. For idempotency we update both paths defensively.
  const supabase = createServiceClient();
  const { data: agent, error: agentLookupErr } = await supabase
    .from('agents')
    .select('id')
    .eq('business_id', business.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (agentLookupErr) {
    throw new OnboardingError(
      `Agent lookup failed: ${agentLookupErr.message}`,
      'PERSIST_FAILED',
    );
  }

  if (agent) {
    const { error: updateErr } = await supabase
      .from('agents')
      .update({ elevenlabs_voice_id: voiceId })
      .eq('id', agent.id);
    if (updateErr) {
      throw new OnboardingError(
        `Voice persistence failed: ${updateErr.message}`,
        'PERSIST_FAILED',
      );
    }
  } else {
    // No agent yet — the n8n onboarding workflow will read the voice_id
    // off the business via a future column, OR we insert a stub agent with
    // just the voice. The current schema doesn't have a voice column on
    // businesses, so we insert a stub agent in 'provisioning' state.
    const { error: insertErr } = await supabase.from('agents').insert({
      business_id: business.id,
      elevenlabs_voice_id: voiceId,
      status: 'provisioning',
    });
    if (insertErr) {
      throw new OnboardingError(
        `Agent stub insert failed: ${insertErr.message}`,
        'PERSIST_FAILED',
      );
    }
  }

  revalidatePath('/onboarding', 'layout');
  return { ok: true, voiceId };
}

// ---------------------------------------------------------------------------
// Step 4 — Website ingest
// ---------------------------------------------------------------------------

export interface IngestWebsiteResult {
  readonly ok: true;
  readonly url: string;
}

export async function ingestWebsite(url: string): Promise<IngestWebsiteResult> {
  const userId = await requireClerkUserId();
  const parsed = websiteUrlSchema.parse({ url });

  const business = await findBusinessId(userId);

  const supabase = createServiceClient();

  // Persist the website URL on the business so n8n W1 can re-ingest if
  // the agent isn't ready yet. This also drives the dashboard's
  // "Knowledge sources" list.
  const { error: businessUpdateErr } = await supabase
    .from('businesses')
    .update({ website_url: parsed.url })
    .eq('id', business.id);
  if (businessUpdateErr) {
    throw new OnboardingError(
      `Business update failed: ${businessUpdateErr.message}`,
      'PERSIST_FAILED',
    );
  }

  // Try to push to EL immediately if an agent is provisioned. Otherwise
  // n8n W1 will run the ingest after the agent is created.
  const { data: agent, error: agentLookupErr } = await supabase
    .from('agents')
    .select('elevenlabs_agent_id')
    .eq('business_id', business.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (agentLookupErr) {
    throw new OnboardingError(
      `Agent lookup failed: ${agentLookupErr.message}`,
      'PERSIST_FAILED',
    );
  }

  if (agent?.elevenlabs_agent_id) {
    try {
      await ingestKnowledgeBaseFromUrl({
        agentId: agent.elevenlabs_agent_id,
        url: parsed.url,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown ingest error';
      throw new OnboardingError(
        `Knowledge base ingest failed: ${message}`,
        'INGEST_FAILED',
      );
    }
  }

  // Always record the source in our table; n8n can backfill content.
  const { error: kbErr } = await supabase
    .from('knowledge_base')
    .insert({
      business_id: business.id,
      source_url: parsed.url,
      content: '[Pending scrape — content lives in ElevenLabs KB]',
    });
  if (kbErr) {
    throw new OnboardingError(
      `knowledge_base insert failed: ${kbErr.message}`,
      'PERSIST_FAILED',
    );
  }

  revalidatePath('/onboarding', 'layout');
  return { ok: true, url: parsed.url };
}

// ---------------------------------------------------------------------------
// Step 5 — Kick off (or retry) provisioning
// ---------------------------------------------------------------------------

export interface StartProvisioningResult {
  readonly ok: true;
}

/**
 * Manual retry path. The Stripe webhook normally triggers n8n W1 the moment
 * `checkout.session.completed` arrives — this function exists for the rare
 * case where the user lands on the provisioning page and no agent row has
 * appeared after ~10s (n8n hiccup, env mis-config, etc.).
 */
export async function startProvisioning(): Promise<StartProvisioningResult> {
  const userId = await requireClerkUserId();
  const business = await findBusinessId(userId);

  try {
    await triggerN8nWorkflow(N8N_WORKFLOWS.ONBOARDING, {
      business_id: business.id,
      clerk_user_id: userId,
      trigger: 'manual_retry',
    });
  } catch (error: unknown) {
    // Swallow — if n8n is down we still let the page poll. The error
    // surfaces in n8n logs; we don't want to block the wizard.
    if (error instanceof Error) {
      // No console.log in prod; rely on n8n's execution log.
    }
  }

  revalidatePath('/onboarding', 'layout');
  return { ok: true };
}
