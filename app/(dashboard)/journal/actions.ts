"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentDbUser } from "@/lib/dostify/current-user";
import {
  createEntry,
  deleteEntry as removeEntry,
  setEntryPinned,
  updateEntryText,
} from "@/lib/dostify/journal";

const text = z.string().trim().min(1).max(5000);

async function requireUser() {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in.");
  return user;
}

/** The list lives in the journal layout, so refresh the whole segment. */
const refresh = () => revalidatePath("/journal", "layout");

/** Autosave target: creates the entry when `id` is null, otherwise updates it. */
export async function saveEntry(
  id: string | null,
  value: string,
): Promise<{ id: string } | { error: string }> {
  const user = await requireUser();
  const parsed = text.safeParse(value);
  if (!parsed.success) return { error: "Entry is empty or too long." };

  if (id) {
    if (!(await updateEntryText(user.id, id, parsed.data))) return { error: "Entry not found." };
    refresh();
    return { id };
  }
  const created = await createEntry(user.id, { text: parsed.data });
  refresh();
  return { id: created.id };
}

export async function deleteEntry(id: string) {
  const user = await requireUser();
  await removeEntry(user.id, id);
  refresh();
}

export async function togglePin(id: string, pinned: boolean) {
  const user = await requireUser();
  await setEntryPinned(user.id, id, pinned);
  refresh();
}
