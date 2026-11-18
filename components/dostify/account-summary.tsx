"use client";

import { UserButton, useUser } from "@clerk/nextjs";

/** Avatar menu plus the signed-in user's name and email; shared by the sidebars. */
export function AccountSummary() {
  const { user } = useUser();
  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <UserButton appearance={{ elements: { avatarBox: "size-8" } }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">
          {user.fullName || user.username || "Signed in"}
        </p>
        {user.primaryEmailAddress && (
          <p className="truncate text-[11px] text-muted-foreground">
            {user.primaryEmailAddress.emailAddress}
          </p>
        )}
      </div>
    </div>
  );
}
