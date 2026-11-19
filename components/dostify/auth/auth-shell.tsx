import Link from "next/link";
import { BRAND } from "@/lib/dostify/brand";
import { SITE_NAME } from "@/lib/dostify/site";
import { CardWall } from "./card-wall";

type AuthShellProps = {
  title: string;
  subtitle: string;
  panelTitle: string;
  panelBody: string;
  children: React.ReactNode;
};

/** The Dostify "D" tile, drawn in code so it matches icon.svg at any size. */
export function BrandMark({ className = "size-8" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex items-center justify-center rounded-[28%] bg-[#D9532B] font-heading font-bold text-white ${className}`}
      style={{ fontSize: "62%" }}
    >
      D
    </span>
  );
}

/*
 * Split screen for sign-in and sign-up: the form on warm paper, a drifting
 * wall of what Dostify does on a dark panel. Colours are fixed (not themed) so the form
 * always matches the page.
 */
export function AuthShell({ title, subtitle, panelTitle, panelBody, children }: AuthShellProps) {
  return (
    <div
      className="grid min-h-dvh w-full font-sans antialiased lg:h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:overflow-hidden"
      style={{ background: BRAND.paper, color: BRAND.ink }}
    >
      <div className="flex min-h-dvh flex-col px-5 pt-6 sm:px-10 sm:pt-8 lg:h-dvh lg:min-h-0">
        <Link
          href="/"
          className="flex w-fit items-center gap-2.5 rounded-lg font-heading text-lg font-bold outline-none focus-visible:ring-2 focus-visible:ring-[#D9532B] focus-visible:ring-offset-2"
        >
          <BrandMark />
          {SITE_NAME}
        </Link>

        {/* Only this area scrolls on large screens, so the logo stays put. m-auto
            centres the form when it fits and lets it scroll from the top when not. */}
        <div className="flex flex-1 flex-col lg:min-h-0 lg:overflow-y-auto lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">
          <main className="m-auto w-full max-w-[400px] py-10 sm:py-12">
            <h1 className="font-heading text-[clamp(2rem,4vw,2.6rem)] leading-[1.05] font-bold tracking-[-0.03em]">
              {title}
            </h1>
            <p className="mt-3 text-base leading-relaxed sm:text-[17px]" style={{ color: BRAND.slate }}>
              {subtitle}
            </p>
            <div className="mt-8 flex w-full justify-center sm:mt-9">{children}</div>
          </main>
          <p className="pb-6 text-center text-xs lg:pb-8" style={{ color: BRAND.slate }}>
            Dostify is an AI friend, not a therapist or a doctor.
          </p>
        </div>
      </div>

      <aside
        className="relative m-3 hidden overflow-hidden rounded-[28px] lg:block"
        style={{ background: BRAND.night }}
      >
        <CardWall />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%]"
          style={{
            background: `linear-gradient(to top, ${BRAND.night} 42%, color-mix(in oklab, ${BRAND.night} 70%, transparent) 70%, transparent)`,
          }}
        />
        <div className="absolute inset-x-0 bottom-0 p-7 xl:p-9">
          <p className="max-w-[16ch] font-heading text-[clamp(2.2rem,3.4vw,3.4rem)] leading-none font-bold tracking-[-0.035em] text-white">
            {panelTitle}
          </p>
          <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-white/70">{panelBody}</p>
        </div>
      </aside>
    </div>
  );
}
