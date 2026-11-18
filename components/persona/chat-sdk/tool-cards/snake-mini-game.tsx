"use client";

import * as React from "react";

interface Point {
  x: number;
  y: number;
}

const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];
const INITIAL_DIR: Point = { x: 1, y: 0 };

export function SnakeMiniGame() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Mutable game state held in refs for 60fps tick stability
  const gameState = React.useRef({
    snake: [...INITIAL_SNAKE],
    dir: { ...INITIAL_DIR },
    nextDir: { ...INITIAL_DIR },
    food: { x: 15, y: 10 },
    flashUntil: 0,
  });

  const spawnFood = React.useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    let collision: boolean;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      collision = currentSnake.some((seg) => seg.x === newFood.x && seg.y === newFood.y);
    } while (collision);
    return newFood;
  }, []);

  const resetGame = React.useCallback(
    (now: number) => {
      const freshFood = spawnFood(INITIAL_SNAKE);
      gameState.current = {
        snake: [...INITIAL_SNAKE],
        dir: { ...INITIAL_DIR },
        nextDir: { ...INITIAL_DIR },
        food: freshFood,
        flashUntil: now + 200,
      };
    },
    [spawnFood]
  );

  // Keyboard controls
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { dir } = gameState.current;

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          if (dir.y === 0) gameState.current.nextDir = { x: 0, y: -1 };
          break;
        case "ArrowDown":
        case "KeyS":
          if (dir.y === 0) gameState.current.nextDir = { x: 0, y: 1 };
          break;
        case "ArrowLeft":
        case "KeyA":
          if (dir.x === 0) gameState.current.nextDir = { x: -1, y: 0 };
          break;
        case "ArrowRight":
        case "KeyD":
          if (dir.x === 0) gameState.current.nextDir = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Touch swipe controls
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const { dir } = gameState.current;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };
    const dx = touchEnd.x - touchStartRef.current.x;
    const dy = touchEnd.y - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 15 && dir.x === 0) gameState.current.nextDir = { x: 1, y: 0 };
      else if (dx < -15 && dir.x === 0) gameState.current.nextDir = { x: -1, y: 0 };
    } else {
      if (dy > 15 && dir.y === 0) gameState.current.nextDir = { x: 0, y: 1 };
      else if (dy < -15 && dir.y === 0) gameState.current.nextDir = { x: 0, y: -1 };
    }
  };

  // Main game tick and render loop
  React.useEffect(() => {
    let animId: number;
    let lastTick = 0;
    const TICK_INTERVAL = 100; // ms per move

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

      const width = canvas.width;
      const height = canvas.height;
      const cellW = width / GRID_SIZE;
      const cellH = height / GRID_SIZE;

      if (timestamp - lastTick >= TICK_INTERVAL) {
        lastTick = timestamp;
        const state = gameState.current;

        state.dir = state.nextDir;
        const head = state.snake[0];
        let nextX = head.x + state.dir.x;
        let nextY = head.y + state.dir.y;

        // Wrap around edges
        if (nextX < 0) nextX = GRID_SIZE - 1;
        if (nextX >= GRID_SIZE) nextX = 0;
        if (nextY < 0) nextY = GRID_SIZE - 1;
        if (nextY >= GRID_SIZE) nextY = 0;

        // Self collision check -> smooth reset
        const hitSelf = state.snake.slice(0, -1).some((seg) => seg.x === nextX && seg.y === nextY);

        if (hitSelf) {
          resetGame(timestamp);
        } else {
          const newHead: Point = { x: nextX, y: nextY };
          const newSnake = [newHead, ...state.snake];

          // Food collision
          if (nextX === state.food.x && nextY === state.food.y) {
            state.food = spawnFood(newSnake);
          } else {
            newSnake.pop();
          }
          state.snake = newSnake;
        }
      }

      // Render Frame
      const state = gameState.current;
      const isDark =
        typeof document !== "undefined" &&
        (document.documentElement.classList.contains("dark") || !!canvas.closest(".dark"));
      // Platform design system color: luminous white in dark mode, platform primary indigo in light mode (no harsh black)
      const primaryRgb = isDark ? "255, 255, 255" : "79, 70, 229";
      const gridRgb = isDark ? "255, 255, 255" : "148, 163, 184";

      ctx.clearRect(0, 0, width, height);

      // 1. Defined background dot grid flush to border
      ctx.fillStyle = `rgba(${gridRgb}, ${isDark ? 0.12 : 0.2})`;
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          ctx.beginPath();
          ctx.arc(
            x * cellW + cellW / 2,
            y * cellH + cellH / 2,
            1.8,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      // 2. Food - prominent platform glowing circular dot
      const foodX = state.food.x * cellW + cellW / 2;
      const foodY = state.food.y * cellH + cellH / 2;
      const pulse = Math.sin(timestamp * 0.007) * 1.2;

      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgba(${primaryRgb}, ${isDark ? 0.9 : 0.5})`;
      ctx.fillStyle = isDark ? "#ffffff" : `rgb(${primaryRgb})`;
      ctx.beginPath();
      ctx.arc(foodX, foodY, Math.max(3.5, Math.min(cellW, cellH) / 2.3 + pulse), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 3. Snake - rendered as circular DOTS matching the dot matrix (NO blocks / NO rectangles)
      state.snake.forEach((seg, index) => {
        const isHead = index === 0;
        const cx = seg.x * cellW + cellW / 2;
        const cy = seg.y * cellH + cellH / 2;
        const minDim = Math.min(cellW, cellH);
        const radius = isHead
          ? Math.max(3.8, minDim * 0.4)
          : Math.max(2.8, minDim * 0.32);

        if (isHead) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = `rgba(${primaryRgb}, ${isDark ? 0.95 : 0.6})`;
          ctx.fillStyle = isDark ? "#ffffff" : `rgb(${primaryRgb})`;
        } else {
          ctx.shadowBlur = 0;
          const alpha = Math.max(0.35, 0.9 - index * 0.04);
          ctx.fillStyle = `rgba(${primaryRgb}, ${alpha})`;
        }

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [resetGame, spawnFood]);

  return (
    <div
      className="relative flex size-full items-center justify-center overflow-hidden rounded-2xl bg-muted/40 text-foreground select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <canvas
        ref={canvasRef}
        className="size-full block"
      />
    </div>
  );
}
