"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isValidAvatarId, type AvatarId } from "./avatar-config";
import { syncClerkUser } from "@/lib/sync-user";

export async function getUserAvatarChoice(): Promise<AvatarId> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return "sakura";

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { avatarChoice: true },
  });

  if (user?.avatarChoice && isValidAvatarId(user.avatarChoice)) {
    return user.avatarChoice;
  }
  return "sakura";
}

export async function saveUserAvatarChoice(avatarChoice: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error("Unauthorized");
  }

  if (!isValidAvatarId(avatarChoice)) {
    throw new Error(`Invalid avatar choice: ${avatarChoice}`);
  }

  // Ensure DB user exists
  const existing = await prisma.user.findUnique({ where: { clerkId } });
  if (!existing) {
    await syncClerkUser(clerkId);
  }

  await prisma.user.update({
    where: { clerkId },
    data: { avatarChoice },
  });

  revalidatePath("/profile");
  revalidatePath("/chat");
  revalidatePath("/", "layout");

  return { success: true, avatarChoice };
}
