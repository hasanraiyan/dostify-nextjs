"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { addEntry } from "./actions";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="rounded-full">
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function EntryForm() {
  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <Card>
      <CardContent>
        <form
          ref={formRef}
          action={async (formData) => {
            await addEntry(formData);
            formRef.current?.reset();
          }}
          className="flex flex-col gap-3"
        >
          <Textarea
            name="text"
            required
            maxLength={5000}
            aria-label="New journal entry"
            className="min-h-32 rounded-2xl p-3 text-sm"
          />
          <div className="flex justify-end">
            <SaveButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
