import { CtaLink } from "./cta-link";
import { FAQ } from "./faq-data";
import { JournalShowcase } from "./journal-showcase";

/*
 * Editorial sections in one voice: a big headline, then ruled rows of plain
 * text. Each point is made once on the page.
 */

const H2 =
  "font-heading text-[clamp(1.9rem,4vw,3rem)] leading-[1.05] font-bold tracking-[-0.03em] text-balance";
const RULE = "border-border";
const SECTION_GAP = "pt-32 sm:pt-44";

// ── How it works ────────────────────────────────────────────────────────────

const STEPS = [
  {
    title: "Say hello",
    body: "Create an account in about a minute. Sign in with Google or an email, and you are straight in. There is nothing to set up.",
  },
  {
    title: "Say what is on your mind",
    body: "Type, or talk out loud, in any mix of languages. Dostify listens first, keeps replies short, and answers the way you wrote.",
  },
  {
    title: "Let it help",
    body: "It remembers what matters to you, saves thoughts to your journal, and uses the apps you connect, only when you ask.",
  },
];

export function Steps() {
  return (
    <section id="how" className={`scroll-mt-24 ${SECTION_GAP}`} aria-labelledby="steps-heading">
      <h2 id="steps-heading" className={`${H2} max-w-[20ch]`}>
        From hello to helpful
      </h2>
      <ol className={`mt-12 border-t ${RULE}`}>
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className={`grid gap-2 border-b py-7 ${RULE} sm:grid-cols-[4rem_minmax(0,16rem)_minmax(0,1fr)] sm:gap-8`}
          >
            <span className="text-[15px] text-muted-foreground tabular-nums">{i + 1}</span>
            <h3 className="font-heading text-[22px] leading-tight font-bold tracking-[-0.01em]">{step.title}</h3>
            <p className="max-w-[60ch] text-[16px] leading-[1.65] text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ── The journal ─────────────────────────────────────────────────────────────

export function Journal() {
  return (
    <section
      id="journal"
      className={`grid scroll-mt-24 gap-10 ${SECTION_GAP} lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16`}
      aria-labelledby="journal-heading"
    >
      <div>
        <h2 id="journal-heading" className={H2}>
          A journal that is only yours
        </h2>
        <p className="mt-5 text-[16px] leading-[1.65] text-muted-foreground">
          Write like in a notes app: a title, some text, saved as you type. Pin the entries you want
          close and search the rest. Or just ask Dostify to save, find or change one for you.
        </p>
      </div>
      <JournalShowcase />
    </section>
  );
}

// ── FAQ ─────────────────────────────────────────────────────────────────────

export function Faq() {
  return (
    <section
      id="faq"
      className={`grid scroll-mt-24 gap-10 ${SECTION_GAP} lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16`}
      aria-labelledby="faq-heading"
    >
      <h2 id="faq-heading" className={H2}>
        Good questions
      </h2>
      <div className={`border-t ${RULE}`}>
        {FAQ.map((item) => (
          <details key={item.q} className={`group border-b py-5 ${RULE}`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-heading text-[19px] font-semibold [&::-webkit-details-marker]:hidden">
              {item.q}
              <span aria-hidden className="text-2xl leading-none text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 max-w-[62ch] text-[16px] leading-[1.65] text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ── Closing ─────────────────────────────────────────────────────────────────

export function Closing() {
  return (
    <section className="py-32 sm:py-44" aria-labelledby="closing-heading">
      <div className="flex flex-col gap-8 border-t-2 border-foreground pt-10 lg:flex-row lg:items-end lg:justify-between">
        <h2 id="closing-heading" className={`${H2} max-w-[18ch]`}>
          Say hello to your dost.
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <CtaLink href="/sign-up" size="lg">
            Start talking
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
