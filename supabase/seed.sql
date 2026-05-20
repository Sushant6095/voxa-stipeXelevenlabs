-- ============================================================================
--  Voxa — seed.sql
--  One demo business + agent + 3 calls + 2 leads + 1 meter_event, tied to
--  clerk_user_id = 'user_demo'. Run via `supabase db reset` (auto-applies
--  seed.sql after migrations) or manually with psql.
--
--  All inserts use the service role (RLS bypassed). End-user reads will only
--  succeed when their Clerk JWT carries sub='user_demo'.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Business
-- ----------------------------------------------------------------------------
INSERT INTO public.businesses (
  id,
  clerk_user_id,
  name,
  owner_phone,
  owner_whatsapp,
  language,
  website_url
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'user_demo',
  'Sharma Dental Clinic',
  '+919900112233',
  '+919900112233',
  'hi',
  'https://sharmadental.example.in'
)
ON CONFLICT (clerk_user_id) DO NOTHING;


-- ----------------------------------------------------------------------------
-- Agent
-- ----------------------------------------------------------------------------
INSERT INTO public.agents (
  id,
  business_id,
  elevenlabs_agent_id,
  elevenlabs_voice_id,
  twilio_number_sid,
  twilio_phone_e164,
  status
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'agent_demo_el',
  'voice_demo_el',
  'PNdemo000000000000000000000000demo',
  '+918047111222',
  'active'
)
ON CONFLICT (id) DO NOTHING;


-- ----------------------------------------------------------------------------
-- Subscription
-- ----------------------------------------------------------------------------
INSERT INTO public.subscriptions (
  id,
  business_id,
  stripe_customer_id,
  stripe_subscription_id,
  tier,
  status,
  current_period_end
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'cus_demo_sharma',
  'sub_demo_sharma',
  'growth',
  'active',
  now() + interval '30 days'
)
ON CONFLICT (stripe_customer_id) DO NOTHING;


-- ----------------------------------------------------------------------------
-- Knowledge base entry
-- ----------------------------------------------------------------------------
INSERT INTO public.knowledge_base (
  id,
  business_id,
  source_url,
  content,
  embedded_at
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'https://sharmadental.example.in/services',
  'Sharma Dental Clinic offers root canal, scaling, braces, and cosmetic dentistry. Open Mon-Sat 10am-7pm. Closed Sundays.',
  now()
)
ON CONFLICT (id) DO NOTHING;


-- ----------------------------------------------------------------------------
-- Calls
-- ----------------------------------------------------------------------------
INSERT INTO public.calls (
  id,
  agent_id,
  business_id,
  elevenlabs_conversation_id,
  caller_phone,
  duration_seconds,
  language_detected,
  summary,
  status,
  transcript,
  created_at
) VALUES
  (
    '55555555-5555-5555-5555-555555555551',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'conv_demo_001',
    '+919900223344',
    142,
    'hi',
    'Caller booked a scaling appointment for Thursday 4pm. Spoke in Hindi.',
    'completed',
    '[{"role":"agent","text":"Namaste, Sharma Dental Clinic."},{"role":"user","text":"Hello, scaling karwana hai."}]'::jsonb,
    now() - interval '3 hours'
  ),
  (
    '55555555-5555-5555-5555-555555555552',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'conv_demo_002',
    '+919811556677',
    87,
    'en',
    'Inquired about braces pricing. Asked to be called back tomorrow.',
    'completed',
    '[{"role":"agent","text":"Hello, Sharma Dental, how can I help?"},{"role":"user","text":"What is the cost of braces?"}]'::jsonb,
    now() - interval '1 hour'
  ),
  (
    '55555555-5555-5555-5555-555555555553',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'conv_demo_003',
    '+919833779900',
    23,
    'hi',
    'Live call in progress.',
    'in_progress',
    NULL,
    now() - interval '2 minutes'
  )
ON CONFLICT (id) DO NOTHING;


-- ----------------------------------------------------------------------------
-- Leads
-- ----------------------------------------------------------------------------
INSERT INTO public.leads (
  id,
  call_id,
  business_id,
  customer_name,
  customer_phone,
  customer_email,
  intent,
  lead_score,
  sentiment,
  follow_up_action,
  status,
  notes
) VALUES
  (
    '66666666-6666-6666-6666-666666666661',
    '55555555-5555-5555-5555-555555555551',
    '11111111-1111-1111-1111-111111111111',
    'Anjali Verma',
    '+919900223344',
    NULL,
    'book_appointment',
    9,
    'positive',
    'Send WhatsApp reminder 24h before Thursday 4pm slot.',
    'won',
    'Confirmed booking, polite caller, returning patient.'
  ),
  (
    '66666666-6666-6666-6666-666666666662',
    '55555555-5555-5555-5555-555555555552',
    '11111111-1111-1111-1111-111111111111',
    'Rohit Mehra',
    '+919811556677',
    'rohit.mehra@example.com',
    'pricing_enquiry',
    6,
    'neutral',
    'Owner to call back with braces consultation slot.',
    'new',
    'Wants metal vs ceramic comparison.'
  )
ON CONFLICT (id) DO NOTHING;


-- ----------------------------------------------------------------------------
-- Meter event
-- ----------------------------------------------------------------------------
INSERT INTO public.meter_events (
  id,
  call_id,
  business_id,
  stripe_event_id,
  minutes_billed
) VALUES (
  '77777777-7777-7777-7777-777777777771',
  '55555555-5555-5555-5555-555555555551',
  '11111111-1111-1111-1111-111111111111',
  'evt_demo_call_001',
  3
)
ON CONFLICT (stripe_event_id) DO NOTHING;
