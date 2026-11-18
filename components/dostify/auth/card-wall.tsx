import { BRAND } from "@/lib/dostify/brand";
import { cn } from "@/lib/utils";

/*
 * The right-hand panel on sign-in and sign-up: three tilted columns of things
 * Dostify actually does (save a journal entry, remember something, connect an
 * app, show a helpline), drifting past slowly. Pure CSS and server-rendered.
 * It never shows a chat. Motion stops under prefers-reduced-motion.
 */

type Kind = "journal" | "language" | "connect" | "pinned" | "memory" | "care" | "voice" | "search" | "private";

type Tile = {
  kind: Kind;
  label: string;
  title: string;
  detail: string;
  tall?: boolean;
  /** Logo shown beside the title, from /public/connectors. */
  logo?: string;
};

const COLUMNS: Tile[][] = [
  [
    { kind: "journal", label: "Journal", title: "Physics test tomorrow", detail: "Saved to your journal" },
    { kind: "language", label: "Languages", title: "English, हिन्दी and Hinglish", detail: "Replies in the way you write", tall: true },
    { kind: "connect", label: "Connected", title: "Notion", detail: "Your pages, ready to search", logo: "/connectors/notion.png" },
    { kind: "pinned", label: "Pinned", title: "Things I am proud of", detail: "Always at the top of your journal" },
  ],
  [
    { kind: "memory", label: "Remembered", title: "Your physics test is on Friday", detail: "So it can ask how it went" },
    { kind: "care", label: "Here for you", title: "You are not alone", detail: "Tele-MANAS 14416, free and open 24x7", tall: true },
    { kind: "voice", label: "Voice", title: "Talk it out loud", detail: "4 min, in Hinglish" },
    { kind: "search", label: "Journal search", title: "3 entries found", detail: "Looking for “friday”" },
  ],
  [
    { kind: "connect", label: "Connected", title: "PYQDeck", detail: "Past papers, one tap away", logo: "/connectors/pyqdeck.png" },
    { kind: "journal", label: "Journal", title: "Group project went well", detail: "Written last Friday", tall: true },
    { kind: "private", label: "Private", title: "Only you can see this", detail: "Your journal stays yours" },
    { kind: "memory", label: "Remembered", title: "You like a short plan, not a long list", detail: "Used the next time you ask" },
  ],
];

/* Seconds for one full loop per column: clearly different, so the wall never moves in lockstep. */
const COLUMN_SECONDS = [38, 62, 48];

const STYLE: Record<Kind, { box: string; quiet: string }> = {
  journal: { box: "text-[#241914]", quiet: "text-[#241914]/65" },
  language: { box: "text-white", quiet: "text-white/75" },
  connect: { box: "text-[#241914]", quiet: "text-[#241914]/60" },
  pinned: { box: "text-[#241914]", quiet: "text-[#241914]/60" },
  memory: { box: "text-[#1B2A3F]", quiet: "text-[#1B2A3F]/65" },
  care: { box: "text-white", quiet: "text-white/75" },
  voice: { box: "text-[#3A1D12]", quiet: "text-[#3A1D12]/65" },
  search: { box: "text-white ring-1 ring-inset ring-white/15", quiet: "text-white/60" },
  private: { box: "text-white", quiet: "text-white/75" },
};

const BACKGROUND: Record<Kind, string> = {
  journal: BRAND.butter,
  language: BRAND.coral,
  connect: "#FFFFFF",
  pinned: BRAND.cream,
  memory: BRAND.sky,
  care: BRAND.sage,
  voice: BRAND.blush,
  search: "#2A201B",
  private: BRAND.coralDeep,
};

function TileCard({ tile }: { tile: Tile }) {
  const style = STYLE[tile.kind];
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col justify-between gap-6 rounded-[22px] p-5",
        tile.tall ? "min-h-[15rem]" : "min-h-[9.5rem]",
        style.box,
      )}
      style={{ background: BACKGROUND[tile.kind] }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn("text-[12px] font-semibold tracking-[0.08em] uppercase", style.quiet)}>{tile.label}</span>
        {tile.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tile.logo} alt="" className="size-8 shrink-0 rounded-lg" />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <span
          className={cn(
            "font-heading leading-[1.1] font-bold tracking-[-0.02em] [overflow-wrap:anywhere]",
            tile.tall ? "text-[28px]" : "text-[21px]",
          )}
        >
          {tile.title}
        </span>
        <span className={cn("text-[14px] leading-snug", style.quiet)}>{tile.detail}</span>
      </div>
    </div>
  );
}

export function CardWall() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <style>{`
        @keyframes cw-up { from { transform: translateY(0); } to { transform: translateY(-50%); } }
        .cw-col { animation: cw-up 45s linear infinite; }
        .cw-col[data-dir="down"] { animation-direction: reverse; }
        @media (prefers-reduced-motion: reduce) { .cw-col { animation: none; } }
      `}</style>
      <div className="absolute -inset-x-[12%] -top-[20%] -bottom-[20%] grid rotate-[-9deg] grid-cols-3 gap-4">
        {COLUMNS.map((col, i) => (
          <div
            key={i}
            className="cw-col flex min-w-0 flex-col gap-4"
            data-dir={i % 2 === 1 ? "down" : "up"}
            style={{ animationDuration: `${COLUMN_SECONDS[i]}s` }}
          >
            {/* The list is repeated so translating by -50% loops without a seam. */}
            {[...col, ...col, ...col, ...col].map((tile, j) => (
              <TileCard key={j} tile={tile} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
