import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";
import { NativeAuthGate } from "@/components/dostify/native-auth";
import { AuthShell } from "@/components/dostify/auth/auth-shell";
import { clerkAppearance } from "@/components/dostify/auth/clerk-appearance";

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
        <NativeAuthGate>
          <SignUp appearance={clerkAppearance} signInUrl="/sign-in" fallbackRedirectUrl="/chat" />
        </NativeAuthGate>
      </Suspense>
    </AuthShell>
  );
}
