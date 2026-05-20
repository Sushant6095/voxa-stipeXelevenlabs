import { cn } from '@/lib/utils';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  /** When true, renders a pulsing emerald "Live" badge to the right of the title. */
  isLive?: boolean;
  /** Right-aligned action slot (buttons, filters). */
  action?: React.ReactNode;
}

/**
 * Page-header strip used across every dashboard route. Renders the
 * title (Cal Sans display), optional subtitle, and a pulsing "Live"
 * badge for pages with real-time data.
 */
export function DashboardHeader({
  title,
  subtitle,
  isLive = false,
  action,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1
            className={cn(
              'font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl',
            )}
          >
            {title}
          </h1>
          {isLive && <LiveBadge />}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function LiveBadge() {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-voxa-success/30 bg-voxa-success/10 px-2 py-0.5',
      )}
    >
      <span className="relative inline-flex size-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-voxa-success/70" />
        <span className="relative inline-flex size-1.5 rounded-full bg-voxa-success" />
      </span>
      <AnimatedShinyText className="text-[11px] font-medium uppercase tracking-wider text-voxa-success">
        Live
      </AnimatedShinyText>
    </span>
  );
}
