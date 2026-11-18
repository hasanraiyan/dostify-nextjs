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

export async function addEntry(formData: FormData) {
  const user = await requireUser();
  const parsed = text.safeParse(formData.get("text"));
  if (!parsed.success) return; // empty text: ignore silently
  await createEntry(user.id, { text: parsed.data });
  revalidatePath("/journal");
}

export async function updateEntry(formData: FormData) {
  const user = await requireUser();
  const id = formData.get("id");
  const parsed = text.safeParse(formData.get("text"));
  if (typeof id !== "string" || !parsed.success) return;
  await updateEntryText(user.id, id, parsed.data);
  revalidatePath("/journal");
}

export async function deleteEntry(formData: FormData) {
  const user = await requireUser();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await removeEntry(user.id, id);
  revalidatePath("/journal");
}

export async function togglePin(formData: FormData) {
  const user = await requireUser();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await setEntryPinned(user.id, id, formData.get("pinned") === "true");
  revalidatePath("/journal");
}
