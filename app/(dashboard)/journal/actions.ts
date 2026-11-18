"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/dostify/current-user";

const entrySchema = z.object({
  text: z.string().trim().min(1).max(5000),
  mood: z.coerce.number().int().min(1).max(5).optional(),
});

export async function addEntry(formData: FormData) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in.");

  const rawMood = formData.get("mood");
  const parsed = entrySchema.safeParse({
    text: formData.get("text"),
    mood: rawMood === null || rawMood === "" ? undefined : rawMood,
  });
  if (!parsed.success) return; // empty text: ignore silently

  await prisma.journalEntry.create({ data: { userId: user.id, ...parsed.data } });
  revalidatePath("/journal");
}

export async function deleteEntry(formData: FormData) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in.");

  const id = formData.get("id");
  if (typeof id !== "string") return;
  // Scoped to the user so nobody can delete someone else's entry by id.
  await prisma.journalEntry.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/journal");
}
