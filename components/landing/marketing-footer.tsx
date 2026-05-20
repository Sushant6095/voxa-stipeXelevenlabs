import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandX,
  IconBrandYoutube,
  type Icon as TablerIcon,
} from '@tabler/icons-react';
import Link from 'next/link';

import { VoxaLogo } from '@/components/brand/voxa-logo';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';

/**
 * Footer for marketing pages. Four columns + a bottom row with the Voxa
 * wordmark, copyright, and the locale tagline. Columns use Cal Sans (display)
 * for the heading so they feel like editorial typography rather than nav.
 */

interface FooterLink {
  readonly label: string;
  readonly href: string;
}

interface FooterColumn {
  readonly heading: string;
  readonly links: ReadonlyArray<FooterLink>;
}

const COLUMNS: ReadonlyArray<FooterColumn> = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Demo', href: '/#demo' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Docs', href: '/docs' },
      { label: 'API', href: '/docs/api' },
      { label: 'Support', href: '/support' },
      { label: 'Status', href: 'https://status.voxa.in' },
    ],
  },
];

interface SocialLink {
  readonly label: string;
  readonly href: string;
  readonly Icon: TablerIcon;
}

const SOCIALS: ReadonlyArray<SocialLink> = [
  { label: 'Twitter / X', href: 'https://x.com/voxa_ai', Icon: IconBrandX },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/voxa-ai',
    Icon: IconBrandLinkedin,
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@voxa-ai',
    Icon: IconBrandYoutube,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/voxa-ai',
    Icon: IconBrandGithub,
  },
];

export function MarketingFooter() {
  return (
    <footer
      aria-labelledby="footer-heading"
      className="relative w-full border-t border-slate-200/60 px-6 py-16 dark:border-slate-800/60"
    >
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((column) => (
            <FooterNavColumn key={column.heading} column={column} />
          ))}
          <SocialColumn />
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-slate-200/60 pt-8 text-sm text-slate-500 sm:flex-row sm:items-center dark:border-slate-800/60 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <VoxaLogo size={28} />
            <AnimatedShinyText className="font-display text-xl font-semibold tracking-tight">
              <span>
                voxa<span className="text-[#EC4899]">.</span>
              </span>
            </AnimatedShinyText>
          </div>

          <p className="font-mono text-xs tracking-wider">
            &copy; {new Date().getFullYear()} Voxa AI
          </p>

          <p className="font-mono text-xs uppercase tracking-[0.18em]">
            Made for Indian SMBs
          </p>
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function FooterNavColumn({ column }: { readonly column: FooterColumn }) {
  return (
    <nav aria-label={column.heading}>
      <h3 className="font-display text-sm font-semibold tracking-tight text-slate-950 dark:text-slate-50">
        {column.heading}
      </h3>
      <ul className="mt-4 space-y-2.5 text-sm">
        {column.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-50"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SocialColumn() {
  return (
    <div>
      <h3 className="font-display text-sm font-semibold tracking-tight text-slate-950 dark:text-slate-50">
        Social
      </h3>
      <ul className="mt-4 flex items-center gap-3">
        {SOCIALS.map(({ label, href, Icon }) => (
          <li key={label}>
            <Link
              href={href}
              aria-label={label}
              target="_blank"
              rel="noopener noreferrer"
              className="grid size-9 place-items-center rounded-lg border border-slate-200/70 bg-white/50 text-slate-600 transition-all hover:-translate-y-0.5 hover:border-[#6366F1]/40 hover:text-[#6366F1] dark:border-slate-800/60 dark:bg-slate-950/40 dark:text-slate-400 dark:hover:border-[#A5B4FC]/40 dark:hover:text-[#A5B4FC]"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
