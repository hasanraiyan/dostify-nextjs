"use server";

import { getUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isValidAvatarId, type AvatarId } from "./avatar-config";

export async function getUserAvatarChoice(): Promise<AvatarId> {
  const userId = await getUserId();
  if (!userId) return "sakura";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarChoice: true },
  });

  if (user?.avatarChoice && isValidAvatarId(user.avatarChoice)) {
    return user.avatarChoice;
  }
  return "sakura";
}

export async function saveUserAvatarChoice(avatarChoice: string) {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!isValidAvatarId(avatarChoice)) {
    throw new Error(`Invalid avatar choice: ${avatarChoice}`);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { avatarChoice },
  });

  revalidatePath("/profile");
  revalidatePath("/chat");
  revalidatePath("/", "layout");

  return { success: true, avatarChoice };
}
