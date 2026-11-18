import { CtaLink } from "./cta-link";

/** One confident line, and one way in. */
export function Hero() {
  return (
    <section className="pt-20 pb-4 sm:pt-28 lg:pt-36">
      <div className="mx-auto flex max-w-[60rem] flex-col items-center text-center">
        <p className="mb-7 rounded-full border bg-card px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground sm:text-sm">
          English · हिन्दी · Hinglish
        </p>
        <h1 className="font-heading text-[clamp(2.75rem,8vw,5.75rem)] leading-[0.96] font-bold tracking-[-0.045em] text-balance">
          A friend who listens. <span className="text-primary">And gets things done.</span>
        </h1>
        <p className="mt-7 max-w-[50ch] text-[clamp(1.0625rem,1.6vw,1.25rem)] leading-[1.55] text-pretty text-muted-foreground">
          Dostify is an AI friend you can talk to in the way you actually talk. Vent after a rough day,
          keep a private journal, and let it handle the little things.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-2 gap-y-3">
          <CtaLink href="/sign-up" size="lg">
            Start talking
          </CtaLink>
          <CtaLink href="#how" variant="link">
            See how it works
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
