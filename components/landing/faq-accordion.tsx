import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

/**
 * Landing FAQ — five questions, only one open at a time (base-ui's default
 * `multiple={false}`). Copy aims at the "this is too good to be true" gut
 * check Indian SMB owners have when they meet a per-minute AI receptionist
 * for the first time.
 */

interface FaqEntry {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
}

const FAQ: ReadonlyArray<FaqEntry> = [
  {
    id: 'setup',
    question: 'How long does setup take?',
    answer:
      "Most owners are live in under sixty seconds. Pick a plan, record sixty seconds of your voice, paste your website, and we provision a real Indian phone number plus your AI receptionist while you finish your chai. No code, no operator on a call.",
  },
  {
    id: 'languages',
    question: 'What languages does Voxa speak?',
    answer:
      "Voxa auto-detects and switches between Hindi, Tamil, Telugu, and English mid-call. Your caller doesn't get a phone-tree language picker; the agent simply matches their language and replies in your cloned voice.",
  },
  {
    id: 'calendar',
    question: 'Can the AI book appointments into my existing calendar?',
    answer:
      "Yes. Voxa books directly into your Cal.com calendar via a server-side tool call during the conversation. Slots negotiated by the agent are locked before the caller hangs up, so you never get double-booked.",
  },
  {
    id: 'overage',
    question: 'What happens during overage minutes?',
    answer:
      "Your plan includes a generous minute bucket. After that, overage minutes are metered to your Stripe bill at a transparent per-minute rate (₹15 on Starter, ₹12 on Growth, ₹10 on Scale). You can watch the meter live on your dashboard — no surprise invoices.",
  },
  {
    id: 'clone',
    question: 'Can I clone my own voice?',
    answer:
      "Absolutely — it's a one-tap step in onboarding. Record sixty seconds of yourself reading a short paragraph, and your AI receptionist will sound like you for every call. If you'd rather keep a default voice, you can skip and switch later from settings.",
  },
];

export function FaqAccordion() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="relative w-full px-6 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            Frequently asked
          </p>
          <h2
            id="faq-heading"
            className="mt-3 font-display text-3xl tracking-tight text-slate-950 sm:text-4xl dark:text-slate-50"
          >
            The honest answers
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-balance text-sm text-slate-600 sm:text-base dark:text-slate-300">
            Built for Indian SMBs who&apos;ve been burnt by &quot;AI&quot;
            chatbots before. No fluff.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200/70 bg-white/60 px-2 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-950/40 sm:px-6">
          <Accordion>
            {FAQ.map((entry) => (
              <AccordionItem key={entry.id} value={entry.id}>
                <AccordionTrigger className="text-left font-display text-base sm:text-lg">
                  {entry.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm leading-relaxed text-slate-600 sm:text-[15px] dark:text-slate-300">
                    {entry.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
