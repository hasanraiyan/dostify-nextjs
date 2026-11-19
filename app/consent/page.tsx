import { Suspense } from "react";
import { ConsentForm } from "./consent-form";

export const metadata = { title: "Authorize access" };

export default function ConsentPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-5">
      <Suspense>
        <ConsentForm />
      </Suspense>
    </main>
  );
}
