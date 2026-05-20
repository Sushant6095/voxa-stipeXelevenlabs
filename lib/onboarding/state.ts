import type { Agent } from '@/lib/supabase/types';

/**
 * Voxa Onboarding — pure state helpers.
 *
 * The "step" notion here is intentionally TWO things at once:
 *   1. Which page the user is currently looking at (welcome/business/voice/…)
 *   2. Which provisioning sub-task n8n has completed (0..6 checkmarks)
 *
 * Both are derived from the persisted state in Supabase (businesses + agents)
 * so we never duplicate truth into local component state.
 *
 * Kept pure (no I/O) so it can be imported from both server and client.
 */

// ---------------------------------------------------------------------------
// Wizard step model (UI route)
// ---------------------------------------------------------------------------

export type OnboardingStep =
  | 'welcome'
  | 'business'
  | 'voice'
  | 'website'
  | 'provisioning'
  | 'success';

export const ONBOARDING_STEPS: ReadonlyArray<OnboardingStep> = [
  'welcome',
  'business',
  'voice',
  'website',
  'provisioning',
  'success',
] as const;

/**
 * 1-indexed position used by the <ProgressDots /> indicator. Out-of-range
 * values default to 1 so the UI never explodes if a route is renamed later.
 */
export function stepIndex(step: OnboardingStep): number {
  const idx = ONBOARDING_STEPS.indexOf(step);
  return idx >= 0 ? idx + 1 : 1;
}

export function nextStep(step: OnboardingStep): OnboardingStep | null {
  const idx = ONBOARDING_STEPS.indexOf(step);
  if (idx < 0 || idx === ONBOARDING_STEPS.length - 1) return null;
  return ONBOARDING_STEPS[idx + 1] ?? null;
}

export function routeForStep(step: OnboardingStep): string {
  return `/onboarding/${step}`;
}

// ---------------------------------------------------------------------------
// Provisioning checklist model (6 items, see ui-spec Screen 3 Step 5)
// ---------------------------------------------------------------------------

/**
 * The provisioning UI shows a 6-item checklist. We derive `completedSteps`
 * from the persisted agent row so a page refresh resumes exactly where
 * n8n's workflow left off.
 *
 * Mapping:
 *   1. Business saved             — business row populated (always true once we get here)
 *   2. Voice cloned               — agents.elevenlabs_voice_id present
 *   3. AI agent created           — agents.elevenlabs_agent_id present
 *   4. Indian number bought       — agents.twilio_number_sid present
 *   5. Number imported + assigned — agents.status === 'active'
 *   6. WhatsApp activation sent   — agents.status === 'active'
 *                                   (we can't easily detect the WhatsApp
 *                                    delivery; we treat it as part of the
 *                                    same n8n leg)
 */
export const PROVISIONING_TOTAL_STEPS = 6;

export interface ProvisioningProgress {
  readonly completedSteps: number;
  readonly status: Agent['status'] | null;
  readonly phoneNumber: string | null;
}

export interface ProvisioningInputs {
  readonly hasBusiness: boolean;
  readonly agent: Pick<
    Agent,
    | 'status'
    | 'elevenlabs_agent_id'
    | 'elevenlabs_voice_id'
    | 'twilio_number_sid'
    | 'twilio_phone_e164'
  > | null;
}

export function deriveProvisioningProgress(
  inputs: ProvisioningInputs,
): ProvisioningProgress {
  const { hasBusiness, agent } = inputs;

  let completed = 0;

  if (hasBusiness) completed += 1; // 1: business saved

  if (agent?.elevenlabs_voice_id) completed += 1; // 2: voice cloned
  if (agent?.elevenlabs_agent_id) completed += 1; // 3: agent created
  if (agent?.twilio_number_sid) completed += 1; // 4: number bought

  if (agent?.status === 'active') {
    completed += 1; // 5: number imported + assigned
    completed += 1; // 6: WhatsApp activation
  }

  // Clamp so a future schema tweak can't ever overshoot the UI.
  const clamped = Math.min(completed, PROVISIONING_TOTAL_STEPS);

  return {
    completedSteps: clamped,
    status: agent?.status ?? null,
    phoneNumber: agent?.twilio_phone_e164 ?? null,
  };
}

export function isProvisioningComplete(progress: ProvisioningProgress): boolean {
  return (
    progress.completedSteps >= PROVISIONING_TOTAL_STEPS &&
    progress.status === 'active'
  );
}
