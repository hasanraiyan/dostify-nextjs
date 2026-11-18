
import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider } from "@clerk/nextjs";
import { THEME_INIT_SCRIPT } from "@/lib/dostify/theme";

const spaceGroteskHeading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dostify — your AI friend",
  description:
    "Dostify is your AI friend: chat or talk, keep a journal, and get a hand when you need one.",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        // The theme script adds `dark` before React hydrates.
        suppressHydrationWarning
        className={cn(
          "h-full",
          "antialiased",
          geistSans.variable,
          geistMono.variable,
          "font-sans",
          inter.variable,
          spaceGroteskHeading.variable
        )}
      >
        <head>
          <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        </head>
        <body className="min-h-full flex flex-col">
          <TooltipProvider>
            {children}
          </TooltipProvider>

          {/* <anam-agent
            agent-id="92fa58a4-bd6c-41e3-9b56-8c0798d4be00"
            api-base-url="https://lab.anam.ai"
          />

          <Script
            src="https://unpkg.com/@anam-ai/agent-widget"
            strategy="afterInteractive"
          /> */}
        </body>
      </html>
    </ClerkProvider>
  );
}
