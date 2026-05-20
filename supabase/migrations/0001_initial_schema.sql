-- ============================================================================
--  Voxa — 0001_initial_schema.sql
--  Phase 2 of the Voxa hackathon build.
--
--  Creates the full schema, indexes, RLS policies, helper functions, and
--  realtime publication for Voxa. Idempotency: this migration is written to
--  be run once on a fresh project. If you need to re-run during development,
--  use `supabase db reset` to wipe local state first.
--
--  Auth model:
--    * Clerk owns user identity. Clerk's "Supabase" JWT template signs a
--      JWT whose `sub` claim equals the Clerk user ID.
--    * Supabase reads that via `auth.jwt() ->> 'sub'`.
--    * RLS policies join through `businesses.clerk_user_id` to gate every
--      other table by the owning business.
--    * The service-role key (used by n8n + Next.js webhook handlers) bypasses
--      RLS entirely. We deliberately omit INSERT policies on `meter_events`
--      so only service-role writers can append billing audit rows.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ----------------------------------------------------------------------------
-- Helper: updated_at trigger function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at IS
  'Generic BEFORE UPDATE trigger that bumps updated_at to now().';


-- ============================================================================
-- TABLE: businesses
-- ============================================================================
CREATE TABLE public.businesses (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id    TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  owner_phone      TEXT,
  owner_whatsapp   TEXT,
  language         TEXT NOT NULL DEFAULT 'en'
                     CHECK (language IN ('en', 'hi', 'ta', 'te')),
  website_url      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.businesses IS
  'One row per Voxa customer (1:1 with Clerk user).';

CREATE TRIGGER businesses_set_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- UNIQUE on clerk_user_id already creates an index; no extra needed.


-- ============================================================================
-- TABLE: agents
-- ============================================================================
CREATE TABLE public.agents (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id            UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  elevenlabs_agent_id    TEXT UNIQUE,
  elevenlabs_voice_id    TEXT,
  twilio_number_sid      TEXT UNIQUE,
  twilio_phone_e164      TEXT UNIQUE,
  status                 TEXT NOT NULL DEFAULT 'provisioning'
                            CHECK (status IN ('provisioning', 'active', 'paused', 'failed')),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.agents IS
  'EL Conversational AI agent + provisioned Twilio number per business.';

CREATE TRIGGER agents_set_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_agents_business_id ON public.agents (business_id);
CREATE INDEX idx_agents_status_active
  ON public.agents (status)
  WHERE status = 'active';


-- ============================================================================
-- TABLE: subscriptions
-- ============================================================================
CREATE TABLE public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id             UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT NOT NULL UNIQUE,
  stripe_subscription_id  TEXT UNIQUE,
  tier                    TEXT NOT NULL CHECK (tier IN ('starter', 'growth', 'scale')),
  status                  TEXT NOT NULL
                            CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'paused')),
  current_period_end      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.subscriptions IS
  'Local mirror of the Stripe subscription state for each business.';

CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_subscriptions_business_id ON public.subscriptions (business_id);
-- UNIQUE on stripe_customer_id already provides a lookup index.


-- ============================================================================
-- TABLE: knowledge_base
-- ============================================================================
CREATE TABLE public.knowledge_base (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  source_url    TEXT NOT NULL,
  content       TEXT NOT NULL,
  embedded_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.knowledge_base IS
  'Scraped/ingested URLs and content for agent RAG. No embeddings for the hackathon — plain text match.';

CREATE INDEX idx_knowledge_base_business_id ON public.knowledge_base (business_id);


-- ============================================================================
-- TABLE: calls
-- ============================================================================
CREATE TABLE public.calls (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id                    UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  business_id                 UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE, -- denormalized for RLS + dashboard speed
  elevenlabs_conversation_id  TEXT UNIQUE,
  caller_phone                TEXT,
  duration_seconds            INT NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  transcript                  JSONB,
  audio_url                   TEXT,
  language_detected           TEXT,
  summary                     TEXT,
  status                      TEXT NOT NULL DEFAULT 'in_progress'
                                 CHECK (status IN ('in_progress', 'completed', 'failed')),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.calls IS
  'Every inbound call. business_id is denormalized off agents for cheap RLS + dashboard composite index.';
COMMENT ON COLUMN public.calls.business_id IS
  'Denormalized from agents.business_id. Service role writers (n8n) must set it explicitly on insert.';

CREATE INDEX idx_calls_business_created
  ON public.calls (business_id, created_at DESC);
CREATE INDEX idx_calls_agent_id
  ON public.calls (agent_id);
CREATE INDEX idx_calls_status_in_progress
  ON public.calls (status)
  WHERE status = 'in_progress';


-- ============================================================================
-- TABLE: leads
-- ============================================================================
CREATE TABLE public.leads (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id             UUID REFERENCES public.calls(id) ON DELETE SET NULL,
  business_id         UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_name       TEXT,
  customer_phone      TEXT,
  customer_email      TEXT,
  intent              TEXT,
  lead_score          INT NOT NULL DEFAULT 0 CHECK (lead_score BETWEEN 0 AND 10),
  sentiment           TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'angry')),
  follow_up_action    TEXT,
  status              TEXT NOT NULL DEFAULT 'new'
                         CHECK (status IN ('new', 'contacted', 'won', 'lost')),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.leads IS
  'Structured lead extracted by post-call Claude pass. Indexed for the leads page filters.';

CREATE TRIGGER leads_set_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_leads_business_status
  ON public.leads (business_id, status);
CREATE INDEX idx_leads_business_score
  ON public.leads (business_id, lead_score DESC);
CREATE INDEX idx_leads_call_id
  ON public.leads (call_id);


-- ============================================================================
-- TABLE: meter_events
-- ============================================================================
CREATE TABLE public.meter_events (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id           UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  business_id       UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  stripe_event_id   TEXT NOT NULL UNIQUE,
  minutes_billed    INT NOT NULL CHECK (minutes_billed >= 0),
  sent_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.meter_events IS
  'Audit trail of meter events sent to Stripe. Write-only via service role; never insertable by end users (no INSERT policy below).';

CREATE INDEX idx_meter_events_call_id ON public.meter_events (call_id);
CREATE INDEX idx_meter_events_business_sent
  ON public.meter_events (business_id, sent_at DESC);


-- ============================================================================
-- Helper functions for RLS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.current_clerk_user_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(auth.jwt() ->> 'sub', '')::TEXT;
$$;

COMMENT ON FUNCTION public.current_clerk_user_id IS
  'Returns the Clerk user ID from the JWT sub claim, or empty string if unauthenticated. Use in RLS policies.';


CREATE OR REPLACE FUNCTION public.current_business_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.businesses
  WHERE clerk_user_id = public.current_clerk_user_id()
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.current_business_id IS
  'Returns the caller''s business UUID, or NULL if none exists yet. Used as the gate on every per-business RLS policy.';


-- ----------------------------------------------------------------------------
-- Aggregate helper for the /billing page
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.business_minutes_used_this_period(p_business_id UUID)
RETURNS INT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(sum(minutes_billed), 0)::INT
  FROM public.meter_events
  WHERE business_id = p_business_id
    AND sent_at >= date_trunc('month', now());
$$;

COMMENT ON FUNCTION public.business_minutes_used_this_period IS
  'Sum of minutes_billed for the calling business in the current calendar month.';


-- ============================================================================
-- Row-Level Security
-- ============================================================================
ALTER TABLE public.businesses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter_events   ENABLE ROW LEVEL SECURITY;


-- ---- businesses ------------------------------------------------------------
CREATE POLICY businesses_select ON public.businesses
  FOR SELECT
  USING (clerk_user_id = public.current_clerk_user_id());

CREATE POLICY businesses_insert ON public.businesses
  FOR INSERT
  WITH CHECK (clerk_user_id = public.current_clerk_user_id());

CREATE POLICY businesses_update ON public.businesses
  FOR UPDATE
  USING (clerk_user_id = public.current_clerk_user_id())
  WITH CHECK (clerk_user_id = public.current_clerk_user_id());

-- Intentionally no DELETE policy: businesses are archived, never deleted by users.


-- ---- agents ----------------------------------------------------------------
CREATE POLICY agents_select ON public.agents
  FOR SELECT
  USING (business_id = public.current_business_id());

CREATE POLICY agents_insert ON public.agents
  FOR INSERT
  WITH CHECK (business_id = public.current_business_id());

CREATE POLICY agents_update ON public.agents
  FOR UPDATE
  USING (business_id = public.current_business_id())
  WITH CHECK (business_id = public.current_business_id());


-- ---- subscriptions ---------------------------------------------------------
CREATE POLICY subscriptions_select ON public.subscriptions
  FOR SELECT
  USING (business_id = public.current_business_id());

-- INSERT/UPDATE only via service-role (Stripe webhook → n8n). No end-user policy.


-- ---- knowledge_base --------------------------------------------------------
CREATE POLICY knowledge_base_select ON public.knowledge_base
  FOR SELECT
  USING (business_id = public.current_business_id());

CREATE POLICY knowledge_base_insert ON public.knowledge_base
  FOR INSERT
  WITH CHECK (business_id = public.current_business_id());

CREATE POLICY knowledge_base_update ON public.knowledge_base
  FOR UPDATE
  USING (business_id = public.current_business_id())
  WITH CHECK (business_id = public.current_business_id());

CREATE POLICY knowledge_base_delete ON public.knowledge_base
  FOR DELETE
  USING (business_id = public.current_business_id());


-- ---- calls -----------------------------------------------------------------
CREATE POLICY calls_select ON public.calls
  FOR SELECT
  USING (business_id = public.current_business_id());

-- INSERT/UPDATE only via service-role (n8n W3 post-call workflow).


-- ---- leads -----------------------------------------------------------------
CREATE POLICY leads_select ON public.leads
  FOR SELECT
  USING (business_id = public.current_business_id());

-- The owner edits status + notes in the dashboard.
CREATE POLICY leads_update ON public.leads
  FOR UPDATE
  USING (business_id = public.current_business_id())
  WITH CHECK (business_id = public.current_business_id());

-- INSERT comes from n8n service role; no INSERT policy for end users.


-- ---- meter_events ----------------------------------------------------------
CREATE POLICY meter_events_select ON public.meter_events
  FOR SELECT
  USING (business_id = public.current_business_id());

-- No INSERT/UPDATE/DELETE policy. Only service-role n8n writes to this table.
-- This keeps the billing audit trail tamper-proof from end-user JWTs.


-- ============================================================================
-- Realtime publication
-- ============================================================================
-- Required for `supabase.channel(...).on('postgres_changes', ...)` to fire.
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meter_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agents;


-- ============================================================================
-- Grants for the anon + authenticated roles
-- (Supabase auto-creates these. We just expose the helpers.)
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.current_clerk_user_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_business_id()   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.business_minutes_used_this_period(UUID) TO authenticated;
