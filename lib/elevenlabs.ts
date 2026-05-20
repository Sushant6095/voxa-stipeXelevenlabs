import 'server-only';

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

import {
  buildFirstMessage,
  buildSystemPrompt,
  buildTemplateTools,
  MODEL_ID,
  VOICE_SETTINGS,
  type AgentLanguage,
  type AgentTemplateInputs,
} from './agent-template';
import type { ToolDefinition } from './agent-tools';

// ---------------------------------------------------------------------------
// Singleton client
// ---------------------------------------------------------------------------

const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

if (!elevenLabsApiKey) {
  throw new Error('ELEVENLABS_API_KEY is not configured');
}

/**
 * Singleton ElevenLabs SDK client. Safe to reuse — the underlying HTTP
 * client is stateless. Authenticates via `xi-api-key` header.
 */
export const elevenlabs = new ElevenLabsClient({ apiKey: elevenLabsApiKey });

// ---------------------------------------------------------------------------
// Voice cloning (Instant Voice Clone — IVC)
// ---------------------------------------------------------------------------

export interface CloneVoiceInput {
  /** Display name for the voice — surfaces in the EL dashboard. */
  readonly name: string;
  /**
   * Audio samples for the clone. The SDK accepts browser File/Blob and
   * Node Buffer (which we wrap into a Blob). 30s–2min, clean.
   */
  readonly files: ReadonlyArray<Blob | File | Buffer>;
  /** Optional human description shown in the dashboard. */
  readonly description?: string;
}

export interface CloneVoiceResult {
  readonly voiceId: string;
  readonly name: string;
}

/**
 * Create an Instant Voice Clone from a 60s sample. The returned `voiceId`
 * is what we persist on `agents.elevenlabs_voice_id` for the business.
 *
 * EL SDK 2.48 exposes this as `voices.ivc.create`, not the legacy `voices.add`.
 *
 * @throws when EL rejects the sample (silence, multiple speakers, etc.)
 */
export async function cloneVoice(
  input: CloneVoiceInput,
): Promise<CloneVoiceResult> {
  const files: Blob[] = input.files.map((entry) => {
    if (entry instanceof Blob) return entry;
    // Buffer → Blob. Node 18+ has global Blob.
    return new Blob([new Uint8Array(entry)]);
  });

  if (files.length === 0) {
    throw new Error('cloneVoice: at least one audio sample is required');
  }

  const response = await elevenlabs.voices.ivc.create({
    name: input.name,
    description: input.description,
    files,
  });

  return {
    voiceId: response.voiceId,
    name: input.name,
  };
}

// ---------------------------------------------------------------------------
// Agent CRUD
// ---------------------------------------------------------------------------

export interface CreateAgentInput {
  readonly businessName: string;
  readonly voiceId: string;
  readonly primaryLanguage: AgentLanguage;
  readonly toolBaseUrl: string;
  readonly city?: string;
  readonly ownerName?: string;
  readonly greeting?: string;
  readonly servicesSummary?: string;
  /** Optional tags surfaced in the EL dashboard. */
  readonly tags?: ReadonlyArray<string>;
}

export interface CreateAgentResult {
  readonly agentId: string;
}

/**
 * Build the `conversationConfig` payload from the Voxa template + tool
 * definitions. Extracted so both `createAgent` and `updateAgent` share it.
 */
function buildConversationConfig(input: {
  templateInputs: AgentTemplateInputs;
  voiceId: string;
  tools: ReadonlyArray<ToolDefinition>;
}) {
  const { templateInputs, voiceId, tools } = input;

  // The EL SDK's `conversationConfig` accepts a partial. We send the
  // pieces that matter for telephony; everything else uses EL defaults.
  return {
    agent: {
      firstMessage: buildFirstMessage(templateInputs),
      language: templateInputs.primaryLanguage,
      prompt: {
        prompt: buildSystemPrompt(templateInputs),
        // gpt-4o-mini is the lowest-latency LLM that still tool-calls well.
        llm: 'gpt-4o-mini' as const,
        temperature: 0.5,
        maxTokens: 250,
        tools: tools.map((tool) => ({
          type: 'webhook' as const,
          name: tool.name,
          description: tool.description,
          responseTimeoutSecs: tool.response_timeout_secs,
          apiSchema: {
            url: tool.api_schema.url,
            method: tool.api_schema.method,
            requestBodySchema: {
              type: 'object' as const,
              required: [...tool.api_schema.request_body_schema.required],
              properties: Object.fromEntries(
                Object.entries(
                  tool.api_schema.request_body_schema.properties,
                ).map(([key, prop]) => [
                  key,
                  {
                    type: prop.type,
                    description: prop.description,
                    ...(prop.enum ? { enum: [...prop.enum] } : {}),
                  },
                ]),
              ),
            },
          },
        })),
      },
    },
    tts: {
      voiceId,
      modelId: MODEL_ID,
      stability: VOICE_SETTINGS.stability,
      similarityBoost: VOICE_SETTINGS.similarity_boost,
      // 3 = lowest latency for telephony, slight quality trade-off.
      optimizeStreamingLatency: 3,
    },
    asr: {
      // ulaw_8000 is non-negotiable for Twilio. See gotcha in CLAUDE.md.
      userInputAudioFormat: 'ulaw_8000' as const,
      quality: 'high' as const,
    },
    conversation: {
      // Hard cap so a runaway call never bills the customer for 60 minutes.
      maxDurationSeconds: 600,
    },
  };
}

/**
 * Provision a new Conversational AI agent for a business. Returns the
 * `agentId` which we persist to `agents.elevenlabs_agent_id`.
 */
export async function createAgent(
  input: CreateAgentInput,
): Promise<CreateAgentResult> {
  const templateInputs: AgentTemplateInputs = {
    businessName: input.businessName,
    city: input.city,
    primaryLanguage: input.primaryLanguage,
    ownerName: input.ownerName,
    greeting: input.greeting,
    servicesSummary: input.servicesSummary,
    toolBaseUrl: input.toolBaseUrl,
  };

  const tools = buildTemplateTools(templateInputs);

  // SDK request body is a strict shape; cast through unknown to allow the
  // tool array (the SDK's discriminated-union typing for tools is messy
  // and we control both sides of the wire).
  const conversationConfig = buildConversationConfig({
    templateInputs,
    voiceId: input.voiceId,
    tools,
  }) as unknown as Parameters<
    typeof elevenlabs.conversationalAi.agents.create
  >[0]['conversationConfig'];

  const response = await elevenlabs.conversationalAi.agents.create({
    name: `Voxa — ${input.businessName}`,
    tags: input.tags ? [...input.tags] : ['voxa'],
    conversationConfig,
  });

  return { agentId: response.agentId };
}

/**
 * Patch an existing agent. Common use: swap the voiceId after the owner
 * finishes cloning their voice mid-session.
 */
export async function updateAgent(
  agentId: string,
  patch: Partial<CreateAgentInput>,
): Promise<void> {
  if (!agentId) {
    throw new Error('updateAgent: agentId is required');
  }

  // Only the fields the caller actually supplied get rebuilt.
  const templateInputsBase: Partial<AgentTemplateInputs> = {
    businessName: patch.businessName,
    city: patch.city,
    primaryLanguage: patch.primaryLanguage,
    ownerName: patch.ownerName,
    greeting: patch.greeting,
    servicesSummary: patch.servicesSummary,
    toolBaseUrl: patch.toolBaseUrl,
  };

  const hasPromptDelta =
    patch.businessName !== undefined ||
    patch.city !== undefined ||
    patch.primaryLanguage !== undefined ||
    patch.ownerName !== undefined ||
    patch.greeting !== undefined ||
    patch.servicesSummary !== undefined ||
    patch.toolBaseUrl !== undefined;

  // For an EL patch we only send the deltas. Voice swap is the most common.
  const conversationConfig: Record<string, unknown> = {};

  if (patch.voiceId !== undefined) {
    conversationConfig.tts = {
      voiceId: patch.voiceId,
      modelId: MODEL_ID,
      stability: VOICE_SETTINGS.stability,
      similarityBoost: VOICE_SETTINGS.similarity_boost,
      optimizeStreamingLatency: 3,
    };
  }

  if (hasPromptDelta) {
    // To rebuild the prompt we need a full template; supply safe defaults
    // for anything the caller did not pass through. The agent's existing
    // name/city/etc. are NOT readable from the EL API in this SDK call,
    // so callers patching prompt fields must supply them all.
    const fullTemplate: AgentTemplateInputs = {
      businessName: templateInputsBase.businessName ?? 'this business',
      city: templateInputsBase.city,
      primaryLanguage: templateInputsBase.primaryLanguage ?? 'en',
      ownerName: templateInputsBase.ownerName,
      greeting: templateInputsBase.greeting,
      servicesSummary: templateInputsBase.servicesSummary,
      toolBaseUrl: templateInputsBase.toolBaseUrl ?? '',
    };
    const tools = buildTemplateTools(fullTemplate);

    Object.assign(
      conversationConfig,
      buildConversationConfig({
        templateInputs: fullTemplate,
        voiceId: patch.voiceId ?? '',
        tools,
      }),
    );
  }

  await elevenlabs.conversationalAi.agents.update(agentId, {
    name: patch.businessName ? `Voxa — ${patch.businessName}` : undefined,
    tags: patch.tags ? [...patch.tags] : undefined,
    conversationConfig:
      Object.keys(conversationConfig).length > 0
        ? (conversationConfig as unknown as Parameters<
            typeof elevenlabs.conversationalAi.agents.update
          >[1] extends infer R
            ? R extends { conversationConfig?: infer C }
              ? C
              : never
            : never)
        : undefined,
  });
}

/**
 * Delete an EL agent. Called from the Stripe cancellation workflow when a
 * subscription ends.
 */
export async function deleteAgent(agentId: string): Promise<void> {
  if (!agentId) {
    throw new Error('deleteAgent: agentId is required');
  }
  await elevenlabs.conversationalAi.agents.delete(agentId);
}

// ---------------------------------------------------------------------------
// Phone numbers — native Twilio integration
// ---------------------------------------------------------------------------

export interface ImportTwilioNumberInput {
  /** Phone number to import, E.164. */
  readonly phoneNumber: string;
  /** Twilio Account SID. */
  readonly accountSid: string;
  /** Twilio Auth Token. */
  readonly authToken: string;
  /** Human label for the EL dashboard ("Sharma Dental — Bengaluru"). */
  readonly label: string;
}

export interface ImportTwilioNumberResult {
  readonly phoneNumberId: string;
}

/**
 * Import a Twilio number into ElevenLabs' native telephony integration.
 *
 * IMPORTANT: This is the "right" path. Do NOT write custom TwiML routes —
 * the native integration handles all WebSocket bridging, audio formats,
 * and reconnects for you. See CLAUDE.md gotcha #7.
 *
 * EL SDK 2.48 exposes this as `conversationalAi.phoneNumbers.create` with
 * a Twilio-discriminated request body.
 */
export async function importTwilioNumber(
  input: ImportTwilioNumberInput,
): Promise<ImportTwilioNumberResult> {
  const response = await elevenlabs.conversationalAi.phoneNumbers.create({
    provider: 'twilio',
    phoneNumber: input.phoneNumber,
    label: input.label,
    sid: input.accountSid,
    token: input.authToken,
  });

  return { phoneNumberId: response.phoneNumberId };
}

export interface AssignNumberToAgentInput {
  readonly phoneNumberId: string;
  readonly agentId: string;
}

/**
 * Attach a previously-imported phone number to an agent. After this call,
 * a real phone dialling the Twilio number will ring through to the agent.
 */
export async function assignNumberToAgent(
  input: AssignNumberToAgentInput,
): Promise<void> {
  if (!input.phoneNumberId || !input.agentId) {
    throw new Error(
      'assignNumberToAgent: phoneNumberId and agentId are required',
    );
  }
  await elevenlabs.conversationalAi.phoneNumbers.update(input.phoneNumberId, {
    agentId: input.agentId,
  });
}

// ---------------------------------------------------------------------------
// Knowledge base ingestion
// ---------------------------------------------------------------------------

export interface IngestKnowledgeBaseFromUrlInput {
  readonly agentId: string;
  readonly url: string;
  /** Optional friendly name; defaults to the URL hostname. */
  readonly name?: string;
}

/**
 * Scrape a URL via EL's hosted scraper, push the resulting document into
 * the EL knowledge base, then attach the document to the given agent's
 * RAG configuration.
 *
 * Note: EL knowledge base updates are eventually consistent — the agent
 * may take ~30s to start answering from new content.
 */
export async function ingestKnowledgeBaseFromUrl(
  input: IngestKnowledgeBaseFromUrlInput,
): Promise<void> {
  if (!input.agentId || !input.url) {
    throw new Error(
      'ingestKnowledgeBaseFromUrl: agentId and url are required',
    );
  }

  const created =
    await elevenlabs.conversationalAi.knowledgeBase.documents.createFromUrl({
      url: input.url,
      name: input.name ?? safeHostname(input.url),
    });

  await attachKnowledgeBaseDocumentToAgent({
    agentId: input.agentId,
    documentId: created.id,
    documentName: created.name,
  });
}

export interface IngestKnowledgeBaseFromTextInput {
  readonly agentId: string;
  readonly text: string;
  readonly name: string;
}

/**
 * Upload pre-scraped or owner-pasted text as a knowledge base document.
 * Useful when the URL scraper fails or the owner has structured content.
 */
export async function ingestKnowledgeBaseFromText(
  input: IngestKnowledgeBaseFromTextInput,
): Promise<void> {
  if (!input.agentId || !input.text || !input.name) {
    throw new Error(
      'ingestKnowledgeBaseFromText: agentId, text, and name are required',
    );
  }

  const created =
    await elevenlabs.conversationalAi.knowledgeBase.documents.createFromText({
      text: input.text,
      name: input.name,
    });

  await attachKnowledgeBaseDocumentToAgent({
    agentId: input.agentId,
    documentId: created.id,
    documentName: created.name,
  });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function safeHostname(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return rawUrl.slice(0, 64);
  }
}

interface AttachKnowledgeBaseDocumentInput {
  readonly agentId: string;
  readonly documentId: string;
  readonly documentName: string;
}

/**
 * Append a knowledge base document to an agent's RAG locator list.
 *
 * We fetch the existing agent, append the new doc, then PATCH back. The
 * EL API does not have an idempotent "add KB to agent" endpoint — full
 * replacement of the locator array is the supported path.
 */
async function attachKnowledgeBaseDocumentToAgent(
  input: AttachKnowledgeBaseDocumentInput,
): Promise<void> {
  const agent = await elevenlabs.conversationalAi.agents.get(input.agentId);

  const existing =
    agent.conversationConfig?.agent?.prompt?.knowledgeBase ?? [];

  const next = [
    ...existing,
    {
      type: 'url' as const,
      id: input.documentId,
      name: input.documentName,
    },
  ];

  await elevenlabs.conversationalAi.agents.update(input.agentId, {
    conversationConfig: {
      agent: {
        prompt: {
          knowledgeBase: next,
        },
      },
    } as unknown as Parameters<
      typeof elevenlabs.conversationalAi.agents.update
    >[1] extends infer R
      ? R extends { conversationConfig?: infer C }
        ? C
        : never
      : never,
  });
}

// ---------------------------------------------------------------------------
// Re-exports — keep the original CreateAgentInput symbol available so older
// imports (e.g. the Phase 1 stub consumers) don't break.
// ---------------------------------------------------------------------------

export type { AgentLanguage } from './agent-template';
