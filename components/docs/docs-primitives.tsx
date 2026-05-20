'use client';

import { AlertTriangle, CheckCircle2, Copy, Info, Lightbulb, Link2 } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// AnchorHeading — H2/H3 with auto hash anchor (like Stripe docs)
// ---------------------------------------------------------------------------

interface AnchorHeadingProps {
  level: 2 | 3 | 4;
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function AnchorHeading({ level, id, children, className }: AnchorHeadingProps) {
  const Tag = `h${level}` as 'h2' | 'h3' | 'h4';
  const sizes = {
    2: 'mt-12 mb-4 text-2xl font-semibold tracking-tight',
    3: 'mt-8 mb-3 text-lg font-semibold tracking-tight',
    4: 'mt-6 mb-2 text-base font-semibold tracking-tight',
  } as const;
  return (
    <Tag id={id} className={cn('scroll-mt-20 group flex items-center gap-2', sizes[level], className)}>
      {children}
      <a
        href={`#${id}`}
        className="opacity-0 transition-opacity group-hover:opacity-60"
        aria-label="Anchor"
      >
        <Link2 aria-hidden className="size-3.5 text-foreground/40" />
      </a>
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// Callout — Stripe-style coloured info/warning/note boxes
// ---------------------------------------------------------------------------

interface CalloutProps {
  variant?: 'info' | 'success' | 'warning' | 'tip';
  title?: string;
  children: React.ReactNode;
}

export function Callout({ variant = 'info', title, children }: CalloutProps) {
  const config = {
    info: {
      icon: Info,
      cls: 'border-primary/30 bg-primary/[0.05] text-primary/90',
      iconCls: 'text-primary',
    },
    success: {
      icon: CheckCircle2,
      cls: 'border-emerald-500/30 bg-emerald-500/[0.05] text-emerald-700 dark:text-emerald-300',
      iconCls: 'text-emerald-500',
    },
    warning: {
      icon: AlertTriangle,
      cls: 'border-amber-500/30 bg-amber-500/[0.06] text-amber-700 dark:text-amber-300',
      iconCls: 'text-amber-500',
    },
    tip: {
      icon: Lightbulb,
      cls: 'border-fuchsia-500/30 bg-fuchsia-500/[0.05] text-fuchsia-700 dark:text-fuchsia-300',
      iconCls: 'text-fuchsia-500',
    },
  }[variant];
  const Icon = config.icon;
  return (
    <div className={cn('my-6 flex gap-3 rounded-xl border p-4 text-sm', config.cls)}>
      <Icon aria-hidden className={cn('mt-0.5 size-4 shrink-0', config.iconCls)} />
      <div className="min-w-0 flex-1 text-foreground/85">
        {title && <p className="mb-1 font-semibold text-foreground">{title}</p>}
        <div className="leading-relaxed [&>p+p]:mt-2">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CodeBlock — monochrome code box with copy button
// ---------------------------------------------------------------------------

interface CodeBlockProps {
  language?: string;
  code: string;
  filename?: string;
  className?: string;
}

export function CodeBlock({ language, code, filename, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <div
      className={cn(
        'group relative my-5 overflow-hidden rounded-xl border border-black/[0.06]',
        'bg-[#0b0d10] text-[13px] leading-relaxed shadow-sm',
        className,
      )}
    >
      {(filename || language) && (
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-white/55">
          <span>{filename ?? language}</span>
          {language && filename && <span className="text-white/35">{language}</span>}
        </div>
      )}
      <button
        type="button"
        onClick={onCopy}
        className={cn(
          'absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-md border border-white/10',
          'bg-white/5 px-2 py-1 text-[11px] text-white/65 transition-colors',
          'opacity-0 hover:bg-white/10 hover:text-white group-hover:opacity-100',
        )}
        aria-label={copied ? 'Copied' : 'Copy code'}
      >
        {copied ? (
          <>
            <CheckCircle2 aria-hidden className="size-3 text-emerald-400" /> Copied
          </>
        ) : (
          <>
            <Copy aria-hidden className="size-3" /> Copy
          </>
        )}
      </button>
      <pre className="overflow-x-auto p-4 text-white/85 selection:bg-fuchsia-500/30">
        <code className="font-mono text-[12.5px]">{code}</code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CodeTabs — language-switcher (curl / Node / Python) like Stripe
// ---------------------------------------------------------------------------

export interface CodeTab {
  label: string;
  language: string;
  code: string;
  filename?: string;
}

interface CodeTabsProps {
  tabs: CodeTab[];
  defaultIndex?: number;
}

export function CodeTabs({ tabs, defaultIndex = 0 }: CodeTabsProps) {
  const [active, setActive] = useState(defaultIndex);
  const current = tabs[active] ?? tabs[0];
  if (!current) return null;
  return (
    <div className="my-5 overflow-hidden rounded-xl border border-black/[0.06] bg-[#0b0d10] shadow-sm">
      <div className="flex items-center gap-1 border-b border-white/5 px-2 py-1.5">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              'rounded-md px-3 py-1 text-[11.5px] font-medium uppercase tracking-[0.06em] transition-colors',
              i === active
                ? 'bg-white/10 text-white'
                : 'text-white/55 hover:bg-white/[0.04] hover:text-white/85',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <pre className="overflow-x-auto p-4 text-white/85">
        <code className="font-mono text-[12.5px] leading-relaxed">{current.code}</code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ParamTable — Stripe-style parameter type listing
// ---------------------------------------------------------------------------

export interface ParamSpec {
  name: string;
  type: string;
  required?: boolean;
  description: React.ReactNode;
  /** Nested child params for object types */
  children?: ParamSpec[];
}

interface ParamTableProps {
  params: ParamSpec[];
}

function ParamRow({ param, depth = 0 }: { param: ParamSpec; depth?: number }) {
  return (
    <>
      <div
        className={cn(
          'flex flex-col gap-1 border-b border-black/[0.05] py-4 dark:border-white/10',
          depth > 0 && 'ml-4 border-l border-black/[0.05] pl-4 dark:border-white/10',
        )}
      >
        <div className="flex flex-wrap items-baseline gap-2">
          <code className="font-mono text-[13px] font-semibold text-foreground">
            {param.name}
          </code>
          <span className="font-mono text-[11.5px] text-foreground/55">
            {param.type}
          </span>
          {param.required ? (
            <span className="rounded-full bg-amber-500/15 px-1.5 py-px font-mono text-[10px] font-medium text-amber-600 dark:text-amber-400">
              required
            </span>
          ) : (
            <span className="rounded-full bg-foreground/[0.06] px-1.5 py-px font-mono text-[10px] font-medium text-foreground/50">
              optional
            </span>
          )}
        </div>
        <p className="text-[13px] leading-relaxed text-foreground/75">
          {param.description}
        </p>
      </div>
      {param.children?.map((child) => (
        <ParamRow key={child.name} param={child} depth={depth + 1} />
      ))}
    </>
  );
}

export function ParamTable({ params }: ParamTableProps) {
  return (
    <div className="my-6 rounded-xl border border-black/[0.06] bg-foreground/[0.01] px-5 dark:border-white/10">
      {params.map((p) => (
        <ParamRow key={p.name} param={p} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EndpointHeader — Stripe-style "POST /api/voice/clone" header row
// ---------------------------------------------------------------------------

interface EndpointHeaderProps {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  path: string;
  description?: string;
}

const methodColor: Record<EndpointHeaderProps['method'], string> = {
  GET: 'bg-primary/15 text-primary',
  POST: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  PATCH: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  DELETE: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  PUT: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400',
};

export function EndpointHeader({ method, path, description }: EndpointHeaderProps) {
  return (
    <div className="my-4 flex flex-col gap-2 rounded-lg border border-black/[0.06] bg-foreground/[0.02] p-3 dark:border-white/10">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide',
            methodColor[method],
          )}
        >
          {method}
        </span>
        <code className="font-mono text-sm font-medium text-foreground">{path}</code>
      </div>
      {description && (
        <p className="text-sm leading-relaxed text-foreground/70">{description}</p>
      )}
    </div>
  );
}
