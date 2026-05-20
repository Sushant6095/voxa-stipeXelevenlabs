-- =============================================================================
-- 0002 — Stripe webhook idempotency log
-- =============================================================================
-- Stripe redelivers webhook events on any non-2xx response, and the same
-- event can land twice during deploy windows or n8n retries. We store every
-- received event.id so the handler can short-circuit duplicates before
-- mutating subscription state or forwarding to n8n.
--
-- Service-role only — no RLS policies are added. Application code talks to
-- this table exclusively through `createServiceClient()` in the webhook
-- route. End-user clients (anon/auth keys) have no business reading it.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb
);

CREATE INDEX IF NOT EXISTS stripe_webhook_events_received_at_idx
  ON public.stripe_webhook_events (received_at DESC);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies — service role only.

COMMENT ON TABLE public.stripe_webhook_events IS
  'Idempotency log for Stripe webhook deliveries. Service-role write only.';
