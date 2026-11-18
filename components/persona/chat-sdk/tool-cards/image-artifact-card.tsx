"use client";

import * as React from "react";
import {
  ArrowsOutIcon,
  DownloadSimpleIcon,
  CopyIcon,
  CheckIcon,
  SpinnerIcon,
  XIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SnakeMiniGame } from "./snake-mini-game";
import { DotMatrixLoader } from "./dot-matrix-loader";
import type { PersonaImageArtifact } from "@personaai/react";

export type ImageArtifactData = PersonaImageArtifact;

const ASPECT_RATIO_CLASSES: Record<string, string> = {
  "1:1": "aspect-square",
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16]",
  "4:3": "aspect-[4/3]",
  "3:4": "aspect-[3/4]",
};

export function ImageArtifactCard({
  data,
  isPending,
  promptText,
  className,
}: {
  data: ImageArtifactData | null;
  isPending: boolean;
  promptText?: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const [isPlayingGame, setIsPlayingGame] = React.useState(false);

  const effectivePrompt = data?.prompt || promptText || "Generated image";
  const aspectRatio = data?.aspectRatio || "1:1";
  const aspectClass = ASPECT_RATIO_CLASSES[aspectRatio] || "aspect-square";
  const imageUrl = data?.url;
  const isError = !isPending && (data?.success === false || !!data?.error || !imageUrl);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageUrl) return;
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(imageUrl, "_blank");
    }
  };

  if (isPending) {
    return (
      <div
        className={cn(
          "group relative my-1 flex w-full max-w-[260px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-border/40 bg-muted/40 shadow-xs transition-all cursor-pointer p-0 select-none outline-none focus:outline-none focus:ring-0 active:outline-none ring-0",
          aspectClass,
          className
        )}
        onClick={() => {
          if (!isPlayingGame) setIsPlayingGame(true);
        }}
      >
        {isPlayingGame ? <SnakeMiniGame /> : <DotMatrixLoader />}
      </div>
    );
  }

  if (isError) {
    return null;
  }

  if (!imageUrl) return null;

  return (
    <>
      <div
        className={cn(
          "group relative my-1 flex w-full max-w-[260px] flex-col overflow-hidden rounded-2xl border border-border/40 bg-card shadow-xs transition-all select-none outline-none focus:outline-none focus:ring-0 active:outline-none ring-0 hover:shadow-md",
          className
        )}
      >
        {/* Aspect Ratio Container */}
        <div
          className={cn(
            "relative w-full cursor-zoom-in overflow-hidden bg-muted/40 select-none outline-none ring-0",
            aspectClass
          )}
          onClick={() => setLightboxOpen(true)}
        >
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
              <SpinnerIcon className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={effectivePrompt}
            draggable={false}
            onLoad={() => setImgLoaded(true)}
            className={cn(
              "size-full object-cover select-none transition-all duration-300 group-hover:scale-[1.01]",
              imgLoaded ? "opacity-100" : "opacity-0"
            )}
          />

          {/* Top-Right Action Button - Single Simple Download Button */}
          <button
            type="button"
            className="absolute top-2.5 right-2.5 z-10 flex size-7 items-center justify-center rounded-full border border-white/20 bg-black/60 p-1 text-white/90 opacity-0 backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-black/80 hover:text-white group-hover:opacity-100 cursor-pointer select-none outline-none focus:outline-none ring-0 shadow-xs"
            title="Download image"
            onClick={handleDownload}
          >
            <DownloadSimpleIcon className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Lightbox Zoom Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-5xl border-none bg-transparent p-0 text-white shadow-none ring-0 outline-none"
        >
          <DialogTitle className="sr-only">Image Zoom Preview</DialogTitle>
          <div className="relative flex flex-col items-center justify-center">
            {/* Top-Right Floating Frosted Glass Action Dock */}
            <div className="absolute top-3 right-3 z-30 flex items-center gap-1 rounded-full border border-white/20 bg-black/60 p-1 backdrop-blur-md transition-all">
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-full text-white/90 hover:text-white hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer select-none outline-none focus:outline-none ring-0"
                title="Copy image URL"
                onClick={handleCopy}
              >
                {copied ? (
                  <CheckIcon className="size-3.5 text-emerald-400" />
                ) : (
                  <CopyIcon className="size-3.5" />
                )}
              </button>
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-full text-white/90 hover:text-white hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer select-none outline-none focus:outline-none ring-0"
                title="Download image"
                onClick={handleDownload}
              >
                <DownloadSimpleIcon className="size-3.5" />
              </button>
              <div className="mx-0.5 h-3.5 w-px bg-white/20" />
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-full text-white/90 hover:text-white hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer select-none outline-none focus:outline-none ring-0"
                title="Close preview"
                onClick={() => setLightboxOpen(false)}
              >
                <XIcon className="size-3.5" />
              </button>
            </div>

            {/* Centered Zoomed Image */}
            <div className="relative flex max-h-[85vh] max-w-[92vw] items-center justify-center overflow-hidden rounded-2xl bg-black/40 shadow-2xl backdrop-blur-xs ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={effectivePrompt}
                className="max-h-[82vh] w-auto max-w-[90vw] object-contain select-none"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
