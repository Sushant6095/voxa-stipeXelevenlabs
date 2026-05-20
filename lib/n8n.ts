import 'server-only';

/**
 * n8n workflow identifiers. Keep in sync with `n8n/*.json` exports.
 *
 * Each value is the URL path segment after `/webhook/` on the n8n host.
 */
export const N8N_WORKFLOWS = {
  ONBOARDING: 'onboarding',
  POST_CALL: 'post-call',
  STRIPE_WEBHOOK: 'stripe-webhook',
  DAILY_DIGEST: 'daily-digest',
  LIVE_TOOLS: 'live-tools',
} as const;

export type N8nWorkflow = (typeof N8N_WORKFLOWS)[keyof typeof N8N_WORKFLOWS];

const DEFAULT_TIMEOUT_MS = 10_000;

export interface TriggerN8nOptions {
  /** Abort after this many milliseconds (default 10s). */
  timeoutMs?: number;
  /** Forward additional headers (e.g. signing secrets). */
  headers?: Record<string, string>;
}

/**
 * POST a JSON payload to an n8n webhook trigger and return the parsed JSON
 * response. Uses an AbortController so a slow n8n host never wedges a
 * Stripe or ElevenLabs webhook handler.
 *
 * n8n is the orchestration backbone per CLAUDE.md — keep business logic
 * inside workflows, not duplicated in Next.js API routes.
 */
export async function triggerN8nWorkflow<TResponse = unknown>(
  workflow: N8nWorkflow,
  payload: unknown,
  options: TriggerN8nOptions = {},
): Promise<TResponse> {
  const baseUrl = process.env.N8N_WEBHOOK_BASE_URL;
  if (!baseUrl) {
    throw new Error('N8N_WEBHOOK_BASE_URL is not configured');
  }

  const url = `${baseUrl.replace(/\/$/, '')}/webhook/${workflow}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `n8n workflow "${workflow}" failed: ${response.status} ${response.statusText} ${text}`.trim(),
      );
    }

    // n8n responds JSON by default; tolerate empty bodies (204).
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return undefined as TResponse;
    }
    return (await response.json()) as TResponse;
  } finally {
    clearTimeout(timeoutId);
  }
}
