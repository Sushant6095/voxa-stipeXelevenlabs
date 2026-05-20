/**
 * Voxa design tokens — single source of truth for color, font, easing
 * and radius. Imported by components that need raw hex values (e.g.
 * `<AnimatedBeam gradientStartColor={colors.primary} />`).
 *
 * Tailwind utility classes (`bg-primary`, `text-accent-voxa`, …) are
 * defined in `app/globals.css` via the Tailwind v4 `@theme` block and
 * reference the same hex values.
 */

/** Voxa brand palette — hex strings ready for inline style / SVG fill. */
export const colors = {
  /** Indigo-500 — primary brand. */
  primary: "#6366F1",
  /** Indigo-600 — primary on hover/active. */
  primaryDark: "#4F46E5",
  /** Pink-500 — voice / AI accent. */
  accent: "#EC4899",
  /** Pink-600 — accent on hover/active. */
  accentDark: "#DB2777",
  /** Emerald-500 — booking confirmed / meter event success. */
  success: "#10B981",
  /** Amber-500 — warnings. */
  warning: "#F59E0B",
  /** Red-500 — destructive / errors. */
  danger: "#EF4444",
  /** Light-mode page background — Tailwind gradient utility. */
  bgLight:
    "bg-gradient-to-br from-slate-50 via-indigo-50/30 to-pink-50/20",
  /** Dark-mode page background — Tailwind gradient utility. */
  bgDark:
    "bg-gradient-to-br from-slate-950 via-indigo-950/30 to-pink-950/20",
} as const;

/** Font-family token names. CSS variables are wired in `app/globals.css`. */
export const fonts = {
  /** Body sans — Geist Sans. */
  sans: "Geist Sans",
  /** Mono — Geist Mono. */
  mono: "Geist Mono",
  /** Display — Cal Sans, hero headlines only. */
  display: "Cal Sans",
} as const;

/** Cubic-bezier easing curves for Motion / CSS animations. */
export const easing = {
  /** Luxurious reveals — preferred for hero and on-mount entry. */
  smooth: [0.16, 1, 0.3, 1],
  /** Standard out — buttons, hover, fast tweens. */
  out: [0.22, 1, 0.36, 1],
  /** Page transitions — symmetric in/out. */
  inOut: [0.4, 0, 0.2, 1],
} as const;

/** Border-radius utility classes — keep these consistent across surfaces. */
export const radius = {
  /** Cards & surfaces. */
  card: "rounded-2xl",
  /** Buttons, inputs. */
  button: "rounded-lg",
  /** Pills, badges, avatars. */
  pill: "rounded-full",
} as const;

export type VoxaColors = typeof colors;
export type VoxaFonts = typeof fonts;
export type VoxaEasing = typeof easing;
export type VoxaRadius = typeof radius;
