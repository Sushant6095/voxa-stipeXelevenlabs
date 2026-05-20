/**
 * Voxa formatting helpers — pure, no `'server-only'`. Imported by both
 * server components (for SSR strings) and client components.
 */

/**
 * Format seconds as `m:ss` (e.g. 3:42). Negative or NaN clamps to 0:00.
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (!Number.isFinite(seconds ?? NaN) || (seconds ?? 0) < 0) {
    return '0:00';
  }
  const total = Math.floor(seconds ?? 0);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Format an Indian phone number with country code spacing.
 * `+919876543210` → `+91 98765 43210`.
 * Unknown shapes are returned unchanged.
 */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return '—';
  const trimmed = raw.trim();
  // +91 XXXXX XXXXX
  if (/^\+91\d{10}$/.test(trimmed)) {
    return `+91 ${trimmed.slice(3, 8)} ${trimmed.slice(8)}`;
  }
  // +91 80 XXXX XXXX (landline)
  if (/^\+9180\d{8}$/.test(trimmed)) {
    return `+91 80 ${trimmed.slice(5, 9)} ${trimmed.slice(9)}`;
  }
  return trimmed;
}

const FLAG_MAP: Record<string, string> = {
  en: '🇬🇧',
  hi: '🇮🇳',
  ta: '🇮🇳',
  te: '🇮🇳',
};

const LANG_LABEL: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
};

export function languageFlag(code: string | null | undefined): string {
  if (!code) return '🌐';
  return FLAG_MAP[code.toLowerCase()] ?? '🌐';
}

export function languageLabel(code: string | null | undefined): string {
  if (!code) return 'Unknown';
  return LANG_LABEL[code.toLowerCase()] ?? code.toUpperCase();
}

/**
 * Format an ISO timestamp as a short relative or clock string. Today
 * shows `HH:MM`, yesterday shows `Yesterday`, otherwise `DD MMM`.
 */
export function formatCallTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  ) {
    return 'Yesterday';
  }
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}
