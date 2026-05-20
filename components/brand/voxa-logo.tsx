import { cn } from '@/lib/utils';

interface VoxaLogoProps {
  /** Pixel size of the square logo (default 32). */
  size?: number;
  /** Render with the indigo→pink gradient (default) or a single CSS-color fill. */
  variant?: 'gradient' | 'mono';
  /** Used only when variant='mono' — defaults to currentColor. */
  monoColor?: string;
  className?: string;
  title?: string;
}

/**
 * Voxa brand mark — a small, friendly crab. Two claws sit forward, six legs
 * fan out behind the rounded body, two googly eyes peek out the top.
 *
 * Designed for two states:
 *  - `gradient` — full color (indigo → pink) for hero, navbar, footer
 *  - `mono`     — single color (defaults to currentColor) for compact UIs
 *
 * 64×64 viewBox; scales cleanly down to 14px and up to billboards. Strokes
 * use `vectorEffect="non-scaling-stroke"` so leg weights stay visually
 * consistent across sizes.
 */
export function VoxaLogo({
  size = 32,
  variant = 'gradient',
  monoColor,
  className,
  title = 'Voxa',
}: VoxaLogoProps) {
  const fill = variant === 'gradient' ? 'url(#voxa-body-grad)' : monoColor ?? 'currentColor';
  const stroke = fill;
  const eyeFill = variant === 'gradient' ? '#FFFFFF' : '#FFFFFF';
  const pupilFill = '#0f172a';
  const mouthStroke = variant === 'gradient' ? '#FFFFFF' : '#FFFFFF';

  return (
    <svg
      role="img"
      aria-label={title}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <title>{title}</title>
      {variant === 'gradient' && (
        <defs>
          <linearGradient id="voxa-body-grad" x1="6" y1="10" x2="58" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="55%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <radialGradient id="voxa-belly-hl" cx="0.5" cy="0.35" r="0.55">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>
      )}

      {/* Legs — rendered behind the body */}
      <g
        stroke={stroke}
        strokeWidth={3.2}
        strokeLinecap="round"
        fill="none"
        vectorEffect="non-scaling-stroke"
      >
        {/* Left side, 3 legs angling down-out */}
        <path d="M18 38 Q9 39 5 45" />
        <path d="M16 43 Q6 47 6 53" />
        <path d="M18 47 Q12 53 14 58" />
        {/* Right side, 3 legs */}
        <path d="M46 38 Q55 39 59 45" />
        <path d="M48 43 Q58 47 58 53" />
        <path d="M46 47 Q52 53 50 58" />
      </g>

      {/* Claws (large pincers up-out from the front of the body) */}
      <g
        stroke={stroke}
        strokeWidth={3.6}
        strokeLinecap="round"
        fill="none"
        vectorEffect="non-scaling-stroke"
      >
        <path d="M18 30 Q10 24 7 14" />
        <path d="M46 30 Q54 24 57 14" />
      </g>
      {/* Claw heads — solid circles with a small inner notch */}
      <g fill={fill}>
        <circle cx="7" cy="13" r="5.4" />
        <circle cx="57" cy="13" r="5.4" />
      </g>
      <g fill="#0f172a" opacity="0.85">
        {/* Notch / pincer split */}
        <path d="M5 13 Q7 9.5 11.5 11.5 Q9.5 13.2 11.5 14.5 Q7 16.5 5 13 Z" />
        <path d="M59 13 Q57 9.5 52.5 11.5 Q54.5 13.2 52.5 14.5 Q57 16.5 59 13 Z" />
      </g>

      {/* Body — wide rounded shell */}
      <ellipse cx="32" cy="38" rx="20" ry="14" fill={fill} />

      {/* Subtle belly highlight (only in gradient variant) */}
      {variant === 'gradient' && (
        <ellipse cx="32" cy="34" rx="14" ry="7" fill="url(#voxa-belly-hl)" />
      )}

      {/* Eye stalks — two short rods pointing up out of the shell */}
      <g
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      >
        <line x1="24" y1="29" x2="22.5" y2="22" />
        <line x1="40" y1="29" x2="41.5" y2="22" />
      </g>

      {/* Eyes (white whites + dark pupil) */}
      <g>
        <circle cx="22.5" cy="20" r="4" fill={eyeFill} stroke={stroke} strokeWidth="1" />
        <circle cx="41.5" cy="20" r="4" fill={eyeFill} stroke={stroke} strokeWidth="1" />
        {/* Pupils — slightly offset to give a friendly forward gaze */}
        <circle cx="23" cy="20.5" r="1.7" fill={pupilFill} />
        <circle cx="42" cy="20.5" r="1.7" fill={pupilFill} />
        {/* Catchlight */}
        <circle cx="22.4" cy="19.6" r="0.6" fill="#FFFFFF" />
        <circle cx="41.4" cy="19.6" r="0.6" fill="#FFFFFF" />
      </g>

      {/* Smile */}
      <path
        d="M26 41 Q32 46 38 41"
        stroke={mouthStroke}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

interface VoxaWordmarkProps {
  /** Logo pixel size; the text scales relative to it. */
  size?: number;
  /** Show the trailing pulsing brand dot. */
  showDot?: boolean;
  className?: string;
  variant?: 'gradient' | 'mono';
  monoColor?: string;
}

/**
 * Convenience composition — `<VoxaLogo />` + the "voxa." wordmark + the
 * optional pulsing brand dot. Use this anywhere the brand stands alone
 * (navbar, footer, sidebar, sign-in screen).
 */
export function VoxaWordmark({
  size = 24,
  showDot = true,
  className,
  variant = 'gradient',
  monoColor,
}: VoxaWordmarkProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 leading-none', className)}>
      <VoxaLogo size={size} variant={variant} monoColor={monoColor} />
      <span
        className="font-heading text-[1em] font-semibold tracking-tight text-foreground"
        style={{ fontSize: `${size * 0.75}px` }}
      >
        voxa.
      </span>
      {showDot && (
        <span className="relative inline-flex" aria-hidden>
          <span className="absolute inset-0 animate-ping rounded-full bg-pink-500/40" />
          <span className="relative inline-block size-1.5 rounded-full bg-pink-500" />
        </span>
      )}
    </span>
  );
}
