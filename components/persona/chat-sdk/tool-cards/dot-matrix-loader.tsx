"use client";

import * as React from "react";

const GRID_SIZE = 20;

export function DotMatrixLoader() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    let animId: number;

    const loop = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Ensure canvas pixel dimensions match client rect perfectly
      if (canvas.clientWidth && canvas.clientHeight) {
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
          canvas.width = canvas.clientWidth;
          canvas.height = canvas.clientHeight;
        }
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const isDark =
        typeof document !== "undefined" &&
        (document.documentElement.classList.contains("dark") || !!canvas.closest(".dark"));
      // Platform design system color: luminous white in dark mode, platform primary indigo in light mode
      const rgb = isDark ? "255, 255, 255" : "79, 70, 229";

      const width = canvas.width;
      const height = canvas.height;
      const cellW = width / GRID_SIZE;
      const cellH = height / GRID_SIZE;
      const centerX = (GRID_SIZE - 1) / 2;
      const centerY = (GRID_SIZE - 1) / 2;

      ctx.clearRect(0, 0, width, height);

      // Organic expanding ripple wave of light across the dot matrix
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          const dist = Math.hypot(x - centerX, y - centerY);
          const wave = Math.sin(timestamp * 0.0035 - dist * 0.45);
          const normalized = (wave + 1) / 2; // 0 to 1

          const alpha = isDark ? 0.06 + normalized * 0.55 : 0.08 + normalized * 0.5;
          const radius = 1.7 + normalized * 1.1;

          ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(
            x * cellW + cellW / 2,
            y * cellH + cellH / 2,
            radius,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative flex size-full items-center justify-center overflow-hidden rounded-2xl bg-muted/40 text-foreground select-none">
      <canvas
        ref={canvasRef}
        className="size-full block"
      />
    </div>
  );
}
