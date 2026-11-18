import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/dostify/brand";
import { SITE_NAME } from "@/lib/dostify/site";

/* The link preview (WhatsApp, Slack, X, LinkedIn) for every page without its
   own. The headline on warm paper, with a small conversation on the right. */

export const alt = "Dostify: your AI friend who listens and gets things done";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function Bubble({ text, mine }: { text: string; mine?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", width: "100%" }}>
      <div
        style={{
          display: "flex",
          maxWidth: 360,
          padding: "18px 24px",
          fontSize: 26,
          lineHeight: 1.25,
          borderRadius: 28,
          borderBottomRightRadius: mine ? 8 : 28,
          borderBottomLeftRadius: mine ? 28 : 8,
          background: mine ? BRAND.coral : "#FFFFFF",
          color: mine ? "#FFFFFF" : BRAND.ink,
          border: mine ? "none" : `2px solid ${BRAND.rule}`,
        }}
      >
        {text}
      </div>
    </div>
  );
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: BRAND.paper,
          padding: "64px 72px",
          fontFamily: "sans-serif",
          gap: 56,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: BRAND.coral,
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                fontWeight: 700,
              }}
            >
              D
            </div>
            <div style={{ fontSize: 34, fontWeight: 700, color: BRAND.ink }}>{SITE_NAME}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 74, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2.5, color: BRAND.ink }}>
              Your AI friend who listens.
            </div>
            <div style={{ fontSize: 30, color: BRAND.slate, lineHeight: 1.3 }}>
              English, Hindi or Hinglish. A private journal. A hand with your day.
            </div>
          </div>
          <div style={{ fontSize: 24, color: BRAND.slate }}>dostify.hasanraiyan.me</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 18,
            width: 400,
            padding: 32,
            borderRadius: 36,
            background: BRAND.cream,
          }}
        >
          <Bubble mine text="Kal test hai aur kuch yaad nahi" />
          <Bubble text="Arre, deep breath. Kaunsa subject? Hum milke plan bana lete hain." />
          <Bubble mine text="Physics" />
        </div>
      </div>
    ),
    size,
  );
}
