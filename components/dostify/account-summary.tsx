"use client";

import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { DotsThreeVerticalIcon, SignOutIcon, UserIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * The account row at the bottom of the sidebar. Clicking the avatar or name
 * opens the profile page; the three-dot menu has the same plus sign out.
 */
export function AccountSummary({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  if (!user) return null;

  const name = user.fullName || user.username || "Signed in";

  return (
    <div className="flex items-center gap-1">
      <Link
        href="/profile"
        onClick={onNavigate}
        aria-label="Open profile"
        className="flex min-w-0 flex-1 items-center gap-2 rounded-xl p-1 text-left transition-colors hover:bg-muted"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={user.imageUrl} alt="" className="size-8 shrink-0 rounded-full" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium">{name}</span>
          {user.primaryEmailAddress && (
            <span className="block truncate text-[11px] text-muted-foreground">
              {user.primaryEmailAddress.emailAddress}
            </span>
          )}
        </span>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="Account menu"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-popup-open:bg-muted"
            >
              <DotsThreeVerticalIcon className="size-4" />
            </button>
          }
        />
        <DropdownMenuContent align="end" side="top" className="min-w-44">
          <DropdownMenuItem
            onClick={() => {
              router.push("/profile");
              onNavigate?.();
            }}
          >
            <UserIcon className="size-3.5" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => void signOut({ redirectUrl: "/sign-in" })}
          >
            <SignOutIcon className="size-3.5" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
