import type { Metadata } from "next";
import { ContactLine, LegalPage } from "@/components/landing/legal-page";
import { SITE_NAME } from "@/lib/dostify/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE_NAME} collects, uses and protects your data.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="19 November 2026">
      <section>
        <p>
          This policy explains what {SITE_NAME} (the website and the Android app) collects, why, and the choices
          you have. We keep it short and plain on purpose.
        </p>
      </section>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account details:</strong> your name and email address, and your password, which is stored
            only as a secure hash, never in readable form.
          </li>
          <li>
            <strong>What you write and say:</strong> your chat messages, your journal entries and, in voice
            calls, your speech, which is processed in real time to understand you and to reply. Voice
            needs your microphone permission, and you can turn it off in your device settings.
          </li>
          <li>
            <strong>Profile choices:</strong> for example which avatar you picked.
          </li>
          <li>
            <strong>Usage counters:</strong> how many messages and how many voice minutes you used this month,
            so we can apply the free-plan limits.
          </li>
          <li>
            <strong>Technical data:</strong> a session cookie that keeps you signed in, and basic device and
            page-performance information.
          </li>
          <li>
            <strong>Connected apps:</strong> only if you connect them, and only the access you approve.
          </li>
        </ul>
      </section>

      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To run {SITE_NAME}: sign you in, reply to you, remember what matters to you, and keep your journal.</li>
          <li>To apply usage limits and keep the service secure and working.</li>
          <li>To measure and improve speed and reliability, using aggregated analytics.</li>
        </ul>
        <p>We do not sell your personal data, and we do not use your journal for advertising.</p>
      </section>

      <section>
        <h2>Who processes it for us</h2>
        <p>We use trusted providers to run the service. They only handle data to provide their part of it:</p>
        <ul>
          <li>AI and voice processing (the Persona platform and the AI models behind it), which receives your messages and voice to generate replies;</li>
          <li>database and hosting providers, which store your account, journal and usage data;</li>
          <li>Vercel Analytics and Speed Insights, for aggregated traffic and performance data.</li>
        </ul>
        <p>We may also disclose data if the law requires it.</p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>
          We keep your data while your account is active. When you ask us to delete your account, we delete your
          account, journal entries, chat data and usage records from our systems, except where we must keep
          something to meet a legal obligation.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <ul>
          <li>You can view and edit your journal entries and profile in the app.</li>
          <li>You can disconnect connected apps at any time.</li>
          <li>You can ask us to give you a copy of your data, correct it, or delete your account and all its data.</li>
        </ul>
        <p>To request deletion or access to your data, contact us using the details below. We will respond promptly.</p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          Connections use HTTPS, passwords are hashed, and access to your data is limited to your signed-in
          account. No online service is perfectly secure, so please use a strong, unique password.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          {SITE_NAME} is not for children under 13, and we do not knowingly collect their data. If you believe a
          child has given us data, contact us and we will remove it.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>If we change this policy, we will update the date at the top. For significant changes we will tell you in the app.</p>
      </section>

      <section>
        <h2>Contact</h2>
        <ContactLine />
      </section>
    </LegalPage>
  );
}
