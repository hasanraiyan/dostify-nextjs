import type { Metadata } from "next";
import { ContactLine, LegalPage } from "@/components/landing/legal-page";
import { SITE_NAME } from "@/lib/dostify/site";

export const metadata: Metadata = {
  title: "Delete your account",
  description: `How to delete your ${SITE_NAME} account and data.`,
  alternates: { canonical: "/delete-account" },
};

export default function DeleteAccountPage() {
  return (
    <LegalPage title="Delete your account" updated="20 November 2026">
      <section>
        <p>
          You can delete your {SITE_NAME} account and all its data at any time, in the Android app or on the
          website.
        </p>
      </section>

      <section>
        <h2>Delete it yourself</h2>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5">
          <li>
            <a href="/sign-in">Sign in</a> to your account.
          </li>
          <li>Open your <strong>Profile</strong> page.</li>
          <li>Scroll to <strong>Delete account</strong> and tap <strong>Delete my account</strong>.</li>
          <li>Enter your password and confirm.</li>
        </ol>
        <p>The deletion happens right away.</p>
      </section>

      <section>
        <h2>What gets deleted</h2>
        <ul>
          <li>your account and sign-in details (name, email, password hash);</li>
          <li>your journal entries and chat data;</li>
          <li>your voice session records and monthly usage counters;</li>
          <li>your connected-app access tokens.</li>
        </ul>
        <p>
          We may keep a minimal record only where the law requires it. Backups are overwritten on our normal
          schedule.
        </p>
      </section>

      <section>
        <h2>Can&apos;t sign in?</h2>
        <p>
          If you forgot your password or no longer have access, contact us from the email address on the
          account and we will delete it for you.
        </p>
        <ContactLine />
      </section>
    </LegalPage>
  );
}
