---
name: twilio-elevenlabs
description: Use whenever connecting Twilio phone numbers to ElevenLabs agents. Covers the native integration path (no custom TwiML), number import, WhatsApp sandbox, call forwarding. Trigger on terms "Twilio integration", "phone number import", "native integration", "WhatsApp Twilio".
---

# Twilio + ElevenLabs Native Integration

## The native path (use this)

ElevenLabs has a built-in Twilio integration. You import your Twilio number into ElevenLabs once, and ElevenLabs auto-configures the Twilio voice webhook. You write zero TwiML.

## Step-by-step (manual)

1. **Buy a Twilio number.** Twilio Console → Phone Numbers → Buy a Number → filter by country IN, capability Voice. Cost: ~$1/month.
2. **Get your Twilio credentials.** Console → Account SID + Auth Token (top of dashboard).
3. **Import to ElevenLabs.** EL Dashboard → Conversational AI → Phone Numbers → + Import Number → "From Twilio". Paste:
   - Label: "Voxa-{businessId}"
   - Phone number: +91XXXXXXXXXX (E.164)
   - Twilio SID: AC...
   - Twilio Auth Token: ...
4. **Assign to agent.** Same screen → dropdown → select your agent.
5. **Test.** Call the number from your phone. Agent should answer within 2 rings.

ElevenLabs automatically sets the Twilio voice webhook to its own endpoint. You don't touch Twilio Console again.

## Programmatic version

### 1. Provision a Twilio number

```typescript
import twilio from 'twilio';
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function buyIndianNumber(friendlyName: string) {
  const available = await client.availablePhoneNumbers('IN').local.list({ limit: 1 });
  if (available.length === 0) throw new Error('No IN numbers available');
  
  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber: available[0].phoneNumber,
    friendlyName,
  });
  
  return { sid: purchased.sid, e164: purchased.phoneNumber };
}
```

### 2. Import to ElevenLabs

```typescript
async function importToElevenLabs(opts: {
  e164: string;
  label: string;
}) {
  const res = await fetch('https://api.elevenlabs.io/v1/convai/phone-numbers', {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      label: opts.label,
      phone_number: opts.e164,
      provider: 'twilio',
      sid: process.env.TWILIO_ACCOUNT_SID,
      token: process.env.TWILIO_AUTH_TOKEN,
    }),
  });
  
  if (!res.ok) throw new Error(`EL import failed: ${await res.text()}`);
  const { phone_number_id } = await res.json();
  return phone_number_id;
}
```

### 3. Assign to agent

```typescript
async function assignToAgent(phoneNumberId: string, agentId: string) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/phone-numbers/${phoneNumberId}`,
    {
      method: 'PATCH',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agent_id: agentId }),
    }
  );
  
  if (!res.ok) throw new Error(`EL assign failed: ${await res.text()}`);
}
```

### Full provisioning flow (used by n8n Workflow 1)

```typescript
async function provisionBusiness(business: Business) {
  // 1. Buy Twilio number
  const { sid, e164 } = await buyIndianNumber(`Voxa-${business.id}`);
  
  // 2. Import to ElevenLabs
  const phoneNumberId = await importToElevenLabs({
    e164,
    label: `Voxa-${business.id}`,
  });
  
  // 3. Assign to agent (must already exist)
  await assignToAgent(phoneNumberId, business.agentId);
  
  return { sid, e164, phoneNumberId };
}
```

## WhatsApp via Twilio Business sandbox

For the hackathon, use the sandbox — no business verification needed.

### Sandbox activation (one-time)

1. Twilio Console → Messaging → Try it Out → Send a WhatsApp message.
2. Note the sandbox number (default: `+14155238886`) and join code (e.g., `join example-word`).
3. Have every recipient (you, friends acting as customers, business owners) text the join code to that number from their WhatsApp.
4. They're now opted in for 72 hours.

### Sending a WhatsApp message

```typescript
async function sendWhatsApp(to: string, body: string) {
  const res = await client.messages.create({
    from: 'whatsapp:+14155238886',  // sandbox number
    to: `whatsapp:${to}`,            // E.164 with whatsapp: prefix
    body,
  });
  return res.sid;
}

// Example
await sendWhatsApp('+919876543210', 'Your appointment is confirmed for tomorrow at 11 AM. — Sharma Dental');
```

### From n8n HTTP Request node

```
URL: https://api.twilio.com/2010-04-01/Accounts/{{$env.TWILIO_ACCOUNT_SID}}/Messages.json
Method: POST
Authentication: Basic Auth
  Username: {{$env.TWILIO_ACCOUNT_SID}}
  Password: {{$env.TWILIO_AUTH_TOKEN}}
Body type: Form-Urlencoded
Body params:
  From = whatsapp:+14155238886
  To = whatsapp:{{$json.customer_phone}}
  Body = {{$json.message}}
```

## Call forwarding (for escalate_to_owner tool)

```typescript
// Update the live call to redirect to the owner's mobile
async function forwardCall(callSid: string, ownerNumber: string) {
  await client.calls(callSid).update({
    twiml: `<Response><Say>Connecting you to the owner.</Say><Dial>${ownerNumber}</Dial></Response>`,
  });
}
```

This works mid-call — Twilio swaps out the audio stream.

## Common failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Number doesn't ring through | Agent not assigned | Re-PATCH the phone-number with agent_id |
| Number rings but no audio | Audio format mismatch | Set agent's `asr.user_input_audio_format: 'ulaw_8000'` |
| WhatsApp returns 400 | Recipient not opted in | Have them text join code |
| WhatsApp delivers but no audio | You're sending text, not media | Use Body, not MediaUrl |
| Import to EL fails 401 | Wrong Twilio SID/Token | Re-copy from Twilio Console |
| Import to EL fails 409 | Number already imported | Check EL phone numbers list, delete old one |

## Cost notes (test mode budgeting)

- Twilio IN number: ~$1/month
- Twilio inbound calls: free for first ~60 minutes/month, then ~$0.01/min
- Twilio WhatsApp sandbox: free
- ElevenLabs Conv AI: free Creator allowance (~50 calls/month) — use the hackathon attendee offer for an extra month

For the hackathon: buy ONE number. Don't experiment with multiple.

## Don't do these

- Don't write custom TwiML (the native integration handles all of it)
- Don't use Twilio Studio (overkill, slower to iterate)
- Don't try to bypass WhatsApp opt-in (sandbox is strict)
- Don't share your Auth Token in client code or in EL agent system prompts
