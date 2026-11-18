import type { Metadata } from "next";
import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/dostify/auth/auth-shell";
import { clerkAppearance } from "@/components/dostify/auth/clerk-appearance";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Dostify and pick up the conversation where you left off.",
};

export default function SignInPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Pick up the conversation where you left off."
      panelTitle="Someone is always around to listen."
      panelBody="Talk it out in English, Hindi or Hinglish. Dostify remembers what matters to you."
    >
      <Suspense>
        <SignIn appearance={clerkAppearance} signUpUrl="/sign-up" fallbackRedirectUrl="/chat" />
      </Suspense>
    </AuthShell>
  );
}
