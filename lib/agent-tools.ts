/**
 * Voxa — server-tool definitions for the ElevenLabs Conversational AI agent.
 *
 * Pure module — no `server-only`. Imported by:
 *   - lib/agent-template.ts (composes them into the agent prompt config)
 *   - lib/elevenlabs.ts (passes them through to convAi.agents.create)
 *   - scripts + n8n workflow tests
 *
 * Each tool is a "webhook" tool: ElevenLabs makes a server-side POST to
 * our n8n live-tools workflow (Phase 6 W2). Each branch must respond in
 * under 5s — the EL tool timeout is hard. n8n must short-circuit and
 * defer slow work to async branches.
 */

// ---------------------------------------------------------------------------
// Public types — keep aligned with the EL SDK `WebhookToolConfigInput` shape.
// ---------------------------------------------------------------------------

/** JSON schema property — narrowed to the primitives EL tool args use. */
export interface ToolProperty {
  /** "string" covers ISO date, phone, enum-of-strings, etc. */
  readonly type: 'string' | 'number' | 'boolean';
  readonly description: string;
  /** Optional enum constraint surfaced to the LLM. */
  readonly enum?: ReadonlyArray<string>;
}

export interface ToolRequestBodySchema {
  readonly type: 'object';
  readonly properties: Readonly<Record<string, ToolProperty>>;
  readonly required: ReadonlyArray<string>;
}

export interface ToolApiSchema {
  readonly url: string;
  readonly method: 'POST';
  readonly request_body_schema: ToolRequestBodySchema;
  readonly request_headers?: Readonly<Record<string, string>>;
}

export interface ToolDefinition {
  readonly type: 'webhook';
  readonly name: string;
  readonly description: string;
  /** Hard ElevenLabs limit: 5–120s. Anything over 5s breaks live calls. */
  readonly response_timeout_secs: number;
  readonly api_schema: ToolApiSchema;
}

// ---------------------------------------------------------------------------
// Constants — keep these explicit so reviewers can audit them.
// ---------------------------------------------------------------------------

/** Maximum the EL tool runtime accepts AND the n8n hop can actually deliver. */
const TOOL_TIMEOUT_SECS = 5;

/** Trim trailing slash to keep concatenated URLs clean. */
function joinUrl(baseUrl: string, segment: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  return `${trimmed}/${segment}`;
}

// ---------------------------------------------------------------------------
// The six Voxa tools.
//
// Order matches the system prompt and PROMPTS.md Phase 5. If you reorder,
// reorder the prompt body too — the LLM reads them top-to-bottom and picks
// the first plausible match.
// ---------------------------------------------------------------------------

/**
 * Build the canonical six tool definitions, wired to the given n8n base URL.
 *
 * baseUrl examples:
 *   - https://n8n.up.railway.app/webhook/tool
 *   - http://localhost:5678/webhook/tool   (local dev)
 */
export function buildTools(baseUrl: string): ToolDefinition[] {
  if (!baseUrl || baseUrl.trim().length === 0) {
    throw new Error('buildTools: baseUrl is required');
  }

  return [
    // 1) check_availability ------------------------------------------------
    {
      type: 'webhook',
      name: 'check_availability',
      description:
        'Check if a specific date and time window is available for an appointment. Call this BEFORE quoting any time slot to the caller. Returns a list of open slots; quote only those.',
      response_timeout_secs: TOOL_TIMEOUT_SECS,
      api_schema: {
        url: joinUrl(baseUrl, 'check_availability'),
        method: 'POST',
        request_body_schema: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description:
                'Date the caller asked about, in YYYY-MM-DD format. Resolve "tomorrow" / "next Tuesday" yourself before calling.',
            },
            time_window: {
              type: 'string',
              description:
                'One of: morning, afternoon, evening, any. Use "any" when the caller did not specify.',
              enum: ['morning', 'afternoon', 'evening', 'any'],
            },
          },
          required: ['date', 'time_window'],
        },
      },
    },

    // 2) book_appointment --------------------------------------------------
    {
      type: 'webhook',
      name: 'book_appointment',
      description:
        'Book the appointment via Cal.com. ONLY call after you have verbally confirmed every detail with the caller. Always repeat back the slot before booking.',
      response_timeout_secs: TOOL_TIMEOUT_SECS,
      api_schema: {
        url: joinUrl(baseUrl, 'book_appointment'),
        method: 'POST',
        request_body_schema: {
          type: 'object',
          properties: {
            customer_name: {
              type: 'string',
              description: 'Full name as the caller said it.',
            },
            customer_phone: {
              type: 'string',
              description:
                'Phone number in E.164 format. Default to +91 country code for India unless caller specifies otherwise.',
            },
            datetime_iso: {
              type: 'string',
              description:
                'ISO 8601 timestamp for the booking, including timezone offset. Example: 2026-05-21T15:00:00+05:30.',
            },
            service: {
              type: 'string',
              description:
                'Service the caller is booking (e.g. "root canal consultation", "haircut", "facial"). Keep concise.',
            },
          },
          required: ['customer_name', 'customer_phone', 'datetime_iso', 'service'],
        },
      },
    },

    // 3) get_business_info -------------------------------------------------
    {
      type: 'webhook',
      name: 'get_business_info',
      description:
        'Look up factual information about the business — hours, services, prices, menu, location, parking, staff. ALWAYS call this BEFORE answering a factual question. Never guess hours or prices.',
      response_timeout_secs: TOOL_TIMEOUT_SECS,
      api_schema: {
        url: joinUrl(baseUrl, 'get_business_info'),
        method: 'POST',
        request_body_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description:
                'What the caller is asking about, paraphrased into a short search query. Example: "Sunday hours", "root canal price", "parking available".',
            },
          },
          required: ['query'],
        },
      },
    },

    // 4) escalate_to_owner -------------------------------------------------
    {
      type: 'webhook',
      name: 'escalate_to_owner',
      description:
        'Transfer or alert the business owner. Call with urgency="high" when the caller is angry, asks for the owner by name, or describes an emergency. Use urgency="low" for unusual requests you cannot handle (refunds, custom quotes, vendor calls).',
      response_timeout_secs: TOOL_TIMEOUT_SECS,
      api_schema: {
        url: joinUrl(baseUrl, 'escalate_to_owner'),
        method: 'POST',
        request_body_schema: {
          type: 'object',
          properties: {
            reason: {
              type: 'string',
              description:
                'One short sentence summarising why escalation is needed. Example: "Caller is upset about Saturday booking that was cancelled."',
            },
            urgency: {
              type: 'string',
              description: 'Severity of the escalation.',
              enum: ['low', 'high'],
            },
          },
          required: ['reason', 'urgency'],
        },
      },
    },

    // 5) send_callback_link -----------------------------------------------
    {
      type: 'webhook',
      name: 'send_callback_link',
      description:
        'WhatsApp the caller a useful link when live booking is not possible (after hours, fully booked) or when they explicitly asked for a menu/location link.',
      response_timeout_secs: TOOL_TIMEOUT_SECS,
      api_schema: {
        url: joinUrl(baseUrl, 'send_callback_link'),
        method: 'POST',
        request_body_schema: {
          type: 'object',
          properties: {
            customer_phone: {
              type: 'string',
              description:
                'WhatsApp-able phone number in E.164. Default +91 for India.',
            },
            link_type: {
              type: 'string',
              description:
                'Type of link to send. Defaults to "booking" — use "menu" or "location" if the caller asked for those specifically.',
              enum: ['booking', 'menu', 'location'],
            },
          },
          required: ['customer_phone'],
        },
      },
    },

    // 6) log_lead ----------------------------------------------------------
    {
      type: 'webhook',
      name: 'log_lead',
      description:
        'Log the caller as a lead at the END of every call where you collected a name and phone — even if they did not book. This is how the owner sees their daily lead list.',
      response_timeout_secs: TOOL_TIMEOUT_SECS,
      api_schema: {
        url: joinUrl(baseUrl, 'log_lead'),
        method: 'POST',
        request_body_schema: {
          type: 'object',
          properties: {
            customer_name: {
              type: 'string',
              description: 'Caller name as you heard it.',
            },
            customer_phone: {
              type: 'string',
              description: 'E.164 phone number.',
            },
            intent: {
              type: 'string',
              description:
                'High-level reason they called. One of: booking, inquiry, support.',
              enum: ['booking', 'inquiry', 'support'],
            },
            notes: {
              type: 'string',
              description:
                'One-sentence summary of what they wanted, in English regardless of call language.',
            },
          },
          required: ['customer_name', 'customer_phone', 'intent', 'notes'],
        },
      },
    },
  ];
}
