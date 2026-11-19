import type { Metadata } from "next";
import { ContactLine, LegalPage } from "@/components/landing/legal-page";
import { FREE_MONTHLY_MESSAGES, FREE_MONTHLY_VOICE_SECONDS } from "@/lib/dostify/usage-limits";
import { SITE_NAME } from "@/lib/dostify/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms for using ${SITE_NAME}, the AI friend app.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="19 November 2026">
      <section>
        <p>
          These terms apply to {SITE_NAME}, the website and the Android app. By creating an account or using{" "}
          {SITE_NAME}, you agree to them. If you do not agree, please do not use it.
        </p>
      </section>

      <section>
        <h2>What {SITE_NAME} is, and is not</h2>
        <p>
          {SITE_NAME} is an AI friend you can talk to by text or voice, with a private journal and optional
          connections to your other apps. You are talking to an AI, not a person.
        </p>
        <p>
          <strong>
            {SITE_NAME} is not a therapist, a doctor, a lawyer or a crisis service, and it is not a substitute
            for professional help.
          </strong>{" "}
          Its replies can be wrong or incomplete. Do not rely on it for medical, legal, financial or safety
          decisions. If you are in danger or thinking of harming yourself, contact emergency services (112) or
          a helpline such as Tele-MANAS (14416) or KIRAN (1800-599-0019) right away.
        </p>
      </section>

      <section>
        <h2>Your account</h2>
        <ul>
          <li>You must give a real email address and keep your password private.</li>
          <li>You are responsible for what happens under your account.</li>
          <li>You must be at least 13 years old. If you are under 18, use {SITE_NAME} with a parent or guardian&apos;s permission.</li>
        </ul>
      </section>

      <section>
        <h2>Free plan and future paid plans</h2>
        <p>
          {SITE_NAME} is free to use within monthly limits: currently {FREE_MONTHLY_MESSAGES} chat messages and{" "}
          {Math.round(FREE_MONTHLY_VOICE_SECONDS / 60)} minutes of voice per calendar month (India time). We may
          change these limits, and we may introduce paid plans in the future. If we do, we will show the price
          and what is included before you are charged, and nothing is charged without your action.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>Do not use {SITE_NAME} to:</p>
        <ul>
          <li>break the law or harm, harass or exploit others;</li>
          <li>create, request or share sexual content involving minors, or content that promotes self-harm;</li>
          <li>attempt to break, overload, scrape or reverse-engineer the service, or to get around the usage limits;</li>
          <li>access another person&apos;s account or data.</li>
        </ul>
        <p>We may limit or suspend accounts that break these rules.</p>
      </section>

      <section>
        <h2>Your content</h2>
        <p>
          You own your journal entries and messages. You give {SITE_NAME} permission to store and process them
          only to run the service for you, as described in our <a href="/privacy">Privacy Policy</a>. Do not
          share anything you do not have the right to share.
        </p>
      </section>

      <section>
        <h2>Connected apps</h2>
        <p>
          You can choose to connect third-party apps. They are governed by their own terms. You can disconnect
          them at any time, and {SITE_NAME} only acts on them when you ask.
        </p>
      </section>

      <section>
        <h2>Availability and changes</h2>
        <p>
          We work to keep {SITE_NAME} running, but we do not promise it will always be available or error-free.
          We may update, change or stop features. We may update these terms, and the date at the top will change.
          Continuing to use {SITE_NAME} after a change means you accept it.
        </p>
      </section>

      <section>
        <h2>Ending your account</h2>
        <p>
          You can stop using {SITE_NAME} at any time and ask us to delete your account and data (see our Privacy
          Policy). We may suspend or end accounts that break these terms.
        </p>
      </section>

      <section>
        <h2>Liability</h2>
        <p>
          {SITE_NAME} is provided &quot;as is&quot;. To the fullest extent the law allows, we are not liable for
          indirect or consequential losses, or for decisions you make based on the AI&apos;s replies. Nothing in
          these terms limits rights you have under consumer protection laws that cannot be waived.
        </p>
      </section>

      <section>
        <h2>Governing law</h2>
        <p>These terms are governed by the laws of India, and the courts in India have jurisdiction.</p>
      </section>

      <section>
        <h2>Contact</h2>
        <ContactLine />
      </section>
    </LegalPage>
  );
}
