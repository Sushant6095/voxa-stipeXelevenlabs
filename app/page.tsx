import { BentoFeatures } from '@/components/landing/bento-features';
import { FaqAccordion } from '@/components/landing/faq-accordion';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { MarketingFooter } from '@/components/landing/marketing-footer';
import { MarketingNavbar } from '@/components/landing/marketing-navbar';
import { PricingTeaser } from '@/components/landing/pricing-teaser';
import { TrustedByMarquee } from '@/components/landing/trusted-by-marquee';
import { BlurFade } from '@/components/ui/blur-fade';

/**
 * Voxa marketing landing.
 *
 * Hero stays mounted from server render (no fade) so LCP isn't gated on JS.
 * Subsequent sections enter via BlurFade with a tiny staggered cascade as
 * the viewport scrolls past them, giving the page editorial pacing without
 * sacrificing initial paint.
 */
export default function HomePage() {
  return (
    <main className="voxa-bg-light dark:voxa-bg-dark min-h-screen w-full">
      <MarketingNavbar />
      <Hero />

      <BlurFade inView delay={0.0} offset={12}>
        <HowItWorks />
      </BlurFade>

      <BlurFade inView delay={0.1} offset={12}>
        <BentoFeatures />
      </BlurFade>

      <BlurFade inView delay={0.2} offset={12}>
        <PricingTeaser />
      </BlurFade>

      <BlurFade inView delay={0.3} offset={12}>
        <TrustedByMarquee />
      </BlurFade>

      <BlurFade inView delay={0.4} offset={12}>
        <FaqAccordion />
      </BlurFade>

      <MarketingFooter />
    </main>
  );
}
