import Link from "next/link";
import { cn } from "@/lib/utils";

const BASE =
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-[background-color,color,box-shadow,transform] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px";

const VARIANTS = {
  primary: "rounded-full bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "rounded-full border border-border bg-background text-foreground hover:bg-muted",
  ghost: "rounded-full text-foreground/80 hover:bg-muted hover:text-foreground",
  /** A quiet underlined text link, for the second action next to a primary button. */
  link: "rounded-md text-foreground underline decoration-border decoration-2 underline-offset-[6px] hover:decoration-foreground",
} as const;

const SIZES = {
  md: "h-9 px-4 text-sm",
  lg: "h-12 px-7 text-base",
} as const;

/** A link that looks like a button. Server-safe; the landing page's only button style. */
export function CtaLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(BASE, VARIANTS[variant], variant === "link" ? "h-12 px-5 text-base" : SIZES[size], className)}
    >
      {children}
    </Link>
  );
}
