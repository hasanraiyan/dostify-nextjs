import { Footer } from "./footer";
import { Header } from "./header";
import { Hero } from "./hero";
import { LandingAssistant } from "./landing-assistant";
import { Closing, Faq, Journal, Steps } from "./sections";

/**
 * The public home page. Static, so search engines get all of it as plain HTML.
 * Short on purpose: say what it is, how it works, show the journal, answer
 * the questions people have. Each point appears once.
 */
export function LandingPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 sm:px-8">
        <Hero />
        <Steps />
        <Journal />
        <Faq />
        <Closing />
      </main>
      <Footer />
      <LandingAssistant />
    </div>
  );
}
