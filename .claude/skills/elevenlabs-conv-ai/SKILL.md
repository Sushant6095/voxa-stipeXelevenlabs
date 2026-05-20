---
name: elevenlabs-conv-ai
description: Use whenever working with ElevenLabs Conversational AI agents — creating agents, system prompts, server tools, voice cloning, knowledge base ingestion, post-call webhooks, multilingual configuration. Trigger on terms "ElevenLabs", "voice agent", "Conv AI", "agent prompt", "voice cloning", "post-call webhook".
---

# ElevenLabs Conversational AI

## Architecture

```
Caller dials Twilio number
      ↓
Twilio webhooks to ElevenLabs (native integration)
      ↓
ElevenLabs agent runs:
  - System prompt + first message
  - Multilingual model (eleven_turbo_v2_5)
  - Server tools (HTTP calls to your n8n webhooks)
  - Knowledge base (uploaded docs / URLs)
      ↓
Audio streamed back to caller via Twilio
      ↓
On hangup:
  - Post-call transcription webhook → your endpoint → n8n Workflow 3
  - Stripe meter event fired
  - Lead extracted, dashboard updated
```

## Creating an agent via API

```typescript
const res = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
  method: 'POST',
  headers: {
    'xi-api-key': process.env.ELEVENLABS_API_KEY!,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: `Voxa-${businessId}`,
    conversation_config: {
      agent: {
        first_message: `Namaste, ${businessName}, kaise madad kar sakti hoon?`,
        language: 'en',  // fallback language
        prompt: {
          prompt: SYSTEM_PROMPT,
          llm: 'gpt-4o-mini',
          temperature: 0.5,
          max_tokens: 250,
          tools: [
            // 6 server tools (see below)
          ],
        },
      },
      tts: {
        voice_id: voiceId,  // cloned voice or default
        model_id: 'eleven_turbo_v2_5',
        stability: 0.5,
        similarity_boost: 0.75,
        optimize_streaming_latency: 3,
      },
      asr: {
        quality: 'high',
        provider: 'elevenlabs',
        user_input_audio_format: 'ulaw_8000',  // ← REQUIRED for Twilio
        keywords: [businessName, ownerName],
      },
      conversation: {
        max_duration_seconds: 600,  // 10 min max per call
      },
    },
    platform_settings: {
      data_collection: {
        // Collected from the agent's analysis
      },
    },
  }),
});

const { agent_id } = await res.json();
```

## Server tool definitions (the 6 Voxa tools)

```typescript
const tools = [
  {
    name: 'check_availability',
    type: 'webhook',
    description: 'Check if a specific date and time is available for an appointment. Use BEFORE quoting any time to the caller.',
    api_schema: {
      url: `${N8N_BASE}/webhook/tool/check_availability`,
      method: 'POST',
      request_body_schema: {
        type: 'object',
        required: ['date', 'time_window'],
        properties: {
          date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
          time_window: { type: 'string', description: 'Time window like "morning", "afternoon", "evening", or "11:00"' },
        },
      },
    },
    response_timeout_secs: 5,
  },
  {
    name: 'book_appointment',
    type: 'webhook',
    description: 'Book the appointment. ONLY call this after the customer has confirmed the slot. Always confirm details by repeating them.',
    api_schema: {
      url: `${N8N_BASE}/webhook/tool/book_appointment`,
      method: 'POST',
      request_body_schema: {
        type: 'object',
        required: ['customer_name', 'customer_phone', 'datetime_iso', 'service'],
        properties: {
          customer_name: { type: 'string' },
          customer_phone: { type: 'string', description: 'E.164 phone number' },
          datetime_iso: { type: 'string', description: 'ISO 8601 timestamp' },
          service: { type: 'string', description: 'Type of service requested' },
        },
      },
    },
  },
  {
    name: 'get_business_info',
    type: 'webhook',
    description: 'Look up information about the business — hours, services, prices, location. Call this BEFORE answering any factual question about the business.',
    api_schema: {
      url: `${N8N_BASE}/webhook/tool/get_business_info`,
      method: 'POST',
      request_body_schema: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', description: 'What the caller is asking about' },
        },
      },
    },
  },
  {
    name: 'escalate_to_owner',
    type: 'webhook',
    description: 'Transfer the call to the business owner. Use when the caller is angry, asks for the owner by name, or has a request beyond your capabilities.',
    api_schema: {
      url: `${N8N_BASE}/webhook/tool/escalate_to_owner`,
      method: 'POST',
      request_body_schema: {
        type: 'object',
        required: ['reason', 'urgency'],
        properties: {
          reason: { type: 'string' },
          urgency: { type: 'string', enum: ['low', 'high'] },
        },
      },
    },
  },
  {
    name: 'send_callback_link',
    type: 'webhook',
    description: 'Send a Cal.com booking link via WhatsApp when live booking is not possible.',
    api_schema: {
      url: `${N8N_BASE}/webhook/tool/send_callback_link`,
      method: 'POST',
      request_body_schema: {
        type: 'object',
        required: ['customer_phone'],
        properties: {
          customer_phone: { type: 'string' },
        },
      },
    },
  },
  {
    name: 'log_lead',
    type: 'webhook',
    description: 'Log the caller as a lead. Call this at the END of every call where you collected the name and phone number, even if no booking was made.',
    api_schema: {
      url: `${N8N_BASE}/webhook/tool/log_lead`,
      method: 'POST',
      request_body_schema: {
        type: 'object',
        required: ['customer_name', 'customer_phone', 'intent', 'notes'],
        properties: {
          customer_name: { type: 'string' },
          customer_phone: { type: 'string' },
          intent: { type: 'string' },
          notes: { type: 'string' },
        },
      },
    },
  },
];
```

## Voice cloning

```typescript
// POST /v1/voices/add with multipart/form-data
const formData = new FormData();
formData.append('name', `${businessName} Owner`);
formData.append('files', audioBlob, 'sample.mp3');
formData.append('labels', JSON.stringify({ language: 'hi', business_id: businessId }));

const res = await fetch('https://api.elevenlabs.io/v1/voices/add', {
  method: 'POST',
  headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! },
  body: formData,
});

const { voice_id } = await res.json();
```

Sample must be 30s-2min, clean (no background noise), single speaker, natural speech.

## Knowledge base ingestion

```typescript
// Upload a document (text content) to an agent's knowledge base
const res = await fetch(
  `https://api.elevenlabs.io/v1/convai/agents/${agentId}/knowledge-base/documents`,
  {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Business website',
      text: scrapedContent,  // plain text, scraped from URL
    }),
  }
);
```

For Voxa: scrape the user's website URL (use a simple fetch + cheerio for hackathon), extract main content, push as one document per page.

## Post-call webhook payload (what you receive)

```typescript
// POST to your endpoint when a call ends
{
  type: 'post_call_transcription',
  event_timestamp: 1716123456,
  data: {
    agent_id: 'agt_xxx',
    conversation_id: 'conv_xxx',
    status: 'done',
    transcript: [
      { role: 'agent', message: '...', time_in_call_secs: 0 },
      { role: 'user', message: '...', time_in_call_secs: 3 },
      // ...
    ],
    metadata: {
      start_time_unix_secs: 1716123400,
      call_duration_secs: 90,
      // ...
    },
    analysis: {
      data_collection_results: { /* if you configured collection */ },
      call_summary_title: '...',
      transcript_summary: '...',
    },
    has_audio: true,
    has_user_audio: true,
    has_response_audio: true,
  },
}
```

Forward this to n8n Workflow 3 from `/api/elevenlabs/webhook/route.ts`.

## Multilingual configuration

Don't create separate agents per language. Use one agent with:
- `model_id: 'eleven_turbo_v2_5'` (supports all Voxa languages natively)
- System prompt instructs language detection (see voice-engineer agent's prompt template)
- `asr.user_input_audio_format: 'ulaw_8000'` for Twilio compatibility

## Critical gotchas

1. **Tools have a hard 5s timeout.** If your n8n webhook takes longer, the agent silently fails the call. Always profile.
2. **`user_input_audio_format: 'ulaw_8000'` is non-negotiable for Twilio.** Without it, audio quality is broken.
3. **Voice cloning needs a clean sample.** Echo, background music, or multiple speakers → cloning fails or produces a weird voice.
4. **Post-call webhooks fire ~5-15s after hangup**, not synchronously. Don't expect them in the same request.
5. **The agent's `language` field is the fallback only.** Real multilingual behavior comes from the prompt + model.
6. **Knowledge base updates are eventually consistent.** Allow ~30s after upload before testing the agent on the new content.

## Don't do these

- Don't write custom TwiML (use the native Twilio import)
- Don't poll for conversation status (use the post-call webhook)
- Don't put dynamic content in `first_message` if you can avoid it (it doesn't substitute variables — use the system prompt for that)
- Don't enable the Audio webhook unless you need recordings (it's heavy)
