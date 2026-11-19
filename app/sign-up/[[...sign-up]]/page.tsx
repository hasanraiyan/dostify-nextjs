import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/dostify/auth/auth-form";
import { AuthShell } from "@/components/dostify/auth/auth-shell";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Create your Dostify account: an AI friend you can talk to in English, Hindi or Hinglish, with a private journal and your apps connected.",
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Meet your dost"
      subtitle="Create your account and start talking."
      panelTitle="A friend who also gets things done."
      panelBody="Keep a private journal, connect your apps, and get a hand with your day."
    >
      <Suspense>
        <AuthForm mode="sign-up" />
      </Suspense>
    </AuthShell>
  );
}
