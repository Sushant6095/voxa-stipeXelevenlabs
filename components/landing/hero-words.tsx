"use client";

import { WordRotate } from "@/components/ui/word-rotate";

/**
 * Hero language rotator. Cycles English → Hindi → Tamil → Telugu with a
 * gradient mask from Voxa primary (indigo-500) to accent (pink-500).
 * Isolated into its own client component so `app/page.tsx` can stay an
 * RSC and only this slice ships interactivity.
 */
const HERO_LANGUAGES = ["English", "हिन्दी", "தமிழ்", "తెలుగు"] as const;

export function HeroWords() {
  return (
    <WordRotate
      words={[...HERO_LANGUAGES]}
      duration={2200}
      className="bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#EC4899] bg-clip-text font-display text-[clamp(2.75rem,5.5vw,5.5rem)] font-semibold leading-[1.05] tracking-tight text-transparent"
    />
  );
}
