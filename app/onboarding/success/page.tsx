import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

import { ProgressDots } from '@/components/onboarding/progress-dots';
import { StepSuccess } from '@/components/onboarding/step-success';
import { stepIndex } from '@/lib/onboarding/state';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Step 6 — Success.
 *
 * Server component. Fetches the agent's E.164 phone number (provisioned by
 * n8n W1) and hands it to ui-virtuoso's <StepSuccess /> component for the
 * sparkles + call-now CTA.
 *
 * If the agent isn't active yet (rare — provisioning page is supposed to
 * gate on this) we fall back to /onboarding/provisioning so the user
 * doesn't see a blank phone number.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function OnboardingSuccessPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/onboarding/welcome');
  }

  const supabase = createServiceClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (!business) {
    redirect('/pricing');
  }

  const { data: agent } = await supabase
    .from('agents')
    .select('twilio_phone_e164, status')
    .eq('business_id', business.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!agent || agent.status !== 'active' || !agent.twilio_phone_e164) {
    redirect('/onboarding/provisioning');
  }

  return (
    <>
      <ProgressDots currentStep={stepIndex('success')} />
      <StepSuccess phoneNumber={agent.twilio_phone_e164} />
    </>
  );
}
