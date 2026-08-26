import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

const COLS = 22;
const ROWS = 18;
type Point = { x: number; y: number };

interface FoodItem {
  x: number;
  y: number;
  type: "apple" | "golden" | "speed" | "freeze";
  points: number;
  timer: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const THEMES = {
  nokia: { name: "RETRO NOKIA", head: "#22c55e", body: "#16a34a", bg: "#022c22", grid: "#064e3b33" },
  cyber: { name: "CYBER NEON",  head: "#38bdf8", body: "#0284c7", bg: "#082f49", grid: "#07598533" },
  synth: { name: "SYNTHWAVE",   head: "#f43f5e", body: "#db2777", bg: "#4c0519", grid: "#83184333" },
};

type ThemeKey = keyof typeof THEMES;

export default function Snake() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [applesEaten, setApplesEaten] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [theme, setTheme] = useState<ThemeKey>("nokia");
  const [wrapWalls, setWrapWalls] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  const resetGame = () => {
    setScore(0);
    setApplesEaten(0);
    setGameOver(false);
    setPaused(false);
    setGameKey((k) => k + 1);
    sound.play("click");
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 440;
    canvas.height = 360;
    const cellW = canvas.width / COLS;
    const cellH = canvas.height / ROWS;

    let snake: Point[] = [
      { x: 8, y: 9 },
      { x: 7, y: 9 },
      { x: 6, y: 9 },
    ];
    let dir: Point = { x: 1, y: 0 };
    let nextDir: Point = { x: 1, y: 0 };
    let speedMs = 120;
    let currentScore = 0;
    let currentApples = 0;

    let food: FoodItem = {
      x: 14,
      y: 9,
      type: "apple",
      points: 10,
      timer: 0,
    };

    let bonusFood: FoodItem | null = null;
    let bonusSpawnTimer = 180;
    let particles: Particle[] = [];
    let tongueExt = 0;

    let lastMoveTime = performance.now();
    let animId: number;

    const spawnFood = (isBonus = false): FoodItem => {
      let nx: number, ny: number;
      do {
        nx = Math.floor(Math.random() * COLS);
        ny = Math.floor(Math.random() * ROWS);
      } while (snake.some((s) => s.x === nx && s.y === ny));

      if (isBonus) {
        const types: ("golden" | "speed" | "freeze")[] = ["golden", "speed", "freeze"];
        const chosen = types[Math.floor(Math.random() * types.length)]!;
        return {
          x: nx,
          y: ny,
          type: chosen,
          points: chosen === "golden" ? 50 : 25,
          timer: 300, // frames
        };
      }

      return {
        x: nx,
        y: ny,
        type: "apple",
        points: 10,
        timer: 0,
      };
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "ArrowUp" || e.key === "w" || e.key === "W") && dir.y === 0) nextDir = { x: 0, y: -1 };
      if ((e.key === "ArrowDown" || e.key === "s" || e.key === "S") && dir.y === 0) nextDir = { x: 0, y: 1 };
      if ((e.key === "ArrowLeft" || e.key === "a" || e.key === "A") && dir.x === 0) nextDir = { x: -1, y: 0 };
      if ((e.key === "ArrowRight" || e.key === "d" || e.key === "D") && dir.x === 0) nextDir = { x: 1, y: 0 };
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    const gameLoop = (now: number) => {
      // Bonus food countdown
      if (bonusFood) {
        bonusFood.timer--;
        if (bonusFood.timer <= 0) bonusFood = null;
      } else {
        bonusSpawnTimer--;
        if (bonusSpawnTimer <= 0) {
          bonusFood = spawnFood(true);
          bonusSpawnTimer = 350;
        }
      }

      // Snake step move
      if (!paused && now - lastMoveTime >= speedMs) {
        lastMoveTime = now;
        dir = nextDir;

        let headX = snake[0]!.x + dir.x;
        let headY = snake[0]!.y + dir.y;

        // Wall collisions
        if (wrapWalls) {
          headX = (headX + COLS) % COLS;
          headY = (headY + ROWS) % ROWS;
        } else if (headX < 0 || headX >= COLS || headY < 0 || headY >= ROWS) {
          triggerGameOver(false);
          return;
        }

        // Self-collision
        if (snake.some((s) => s.x === headX && s.y === headY)) {
          triggerGameOver(true);
          return;
        }

        const newHead = { x: headX, y: headY };
        snake.unshift(newHead);

        // Check Food Consumption
        let grew = false;

        // 1. Regular Apple
        if (headX === food.x && headY === food.y) {
          grew = true;
          currentScore += food.points;
          currentApples++;
          setScore(currentScore);
          setApplesEaten(currentApples);
          sound.play("pop");
          speedMs = Math.max(65, 120 - Math.floor(currentApples * 1.5));
          food = spawnFood(false);
          createSparks(headX * cellW + cellW / 2, headY * cellH + cellH / 2, "#ef4444", 8);
        }

        // 2. Bonus Food
        if (bonusFood && headX === bonusFood.x && headY === bonusFood.y) {
          grew = true;
          currentScore += bonusFood.points;
          setScore(currentScore);
          sound.play("powerup");
          createSparks(headX * cellW + cellW / 2, headY * cellH + cellH / 2, "#facc15", 14);
          bonusFood = null;
        }

        if (!grew) {
          snake.pop();
        }
      }

      // Tongue animation
      tongueExt = Math.sin(now * 0.015) > 0.4 ? 1 : 0;

      // Update Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
      });
      particles = particles.filter((p) => p.life > 0);

      function createSparks(x: number, y: number, color: string, count: number) {
        for (let i = 0; i < count; i++) {
          particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 18,
            color,
          });
        }
      }

      function triggerGameOver(ateSelf: boolean) {
        sound.play("error");
        setGameOver(true);
        if (ateSelf) store.findEgg("snake_self");
        store.submitGameResult("snake", {
          gameId: "snake",
          score: currentScore,
          completed: true,
          xpEarned: Math.round(currentScore * 0.5),
          achievementsUnlocked: currentScore >= 200 ? ["snake_god"] : [],
        });
      }

      // ==========================================
      // RENDER
      // ==========================================
      const currentTheme = THEMES[theme];
      ctx.fillStyle = currentTheme.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid Lines
      ctx.strokeStyle = currentTheme.grid;
      ctx.lineWidth = 1;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cellW, 0);
        ctx.lineTo(c * cellW, canvas.height);
        ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellH);
        ctx.lineTo(canvas.width, r * cellH);
        ctx.stroke();
      }

      // Draw Particles
      particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Regular Apple (🍎)
      const ax = food.x * cellW + cellW / 2;
      const ay = food.y * cellH + cellH / 2;
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(ax, ay, cellW / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(ax - 1, ay - cellH / 2, 3, 4);

      // Draw Bonus Food (🌟 / ⚡ / ❄️)
      if (bonusFood) {
        const bx = bonusFood.x * cellW + cellW / 2;
        const by = bonusFood.y * cellH + cellH / 2;
        const flash = Math.sin(now * 0.02) > 0;
        ctx.fillStyle = bonusFood.type === "golden" ? (flash ? "#facc15" : "#fef08a") : "#06b6d4";
        ctx.beginPath();
        ctx.arc(bx, by, cellW / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Draw Snake Body & Head
      snake.forEach((s, idx) => {
        const sx = s.x * cellW;
        const sy = s.y * cellH;

        if (idx === 0) {
          // SNAKE HEAD
          ctx.fillStyle = currentTheme.head;
          ctx.beginPath();
          ctx.roundRect(sx + 1, sy + 1, cellW - 2, cellH - 2, 6);
          ctx.fill();
          ctx.strokeStyle = "#00000040";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Eyes looking towards direction
          const eyeOffX = dir.x * 3;
          const eyeOffY = dir.y * 3;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(sx + cellW / 2 - 3 + eyeOffX, sy + cellH / 2 - 3 + eyeOffY, 2.5, 0, Math.PI * 2);
          ctx.arc(sx + cellW / 2 + 3 + eyeOffX, sy + cellH / 2 - 3 + eyeOffY, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#0f172a";
          ctx.beginPath();
          ctx.arc(sx + cellW / 2 - 3 + eyeOffX * 1.4, sy + cellH / 2 - 3 + eyeOffY * 1.4, 1.2, 0, Math.PI * 2);
          ctx.arc(sx + cellW / 2 + 3 + eyeOffX * 1.4, sy + cellH / 2 - 3 + eyeOffY * 1.4, 1.2, 0, Math.PI * 2);
          ctx.fill();

          // Flickering Tongue
          if (tongueExt) {
            ctx.fillStyle = "#ef4444";
            ctx.fillRect(sx + cellW / 2 + dir.x * 9 - 1, sy + cellH / 2 + dir.y * 9 - 1, 2, 4);
          }
        } else {
          // SNAKE BODY
          ctx.fillStyle = currentTheme.body;
          ctx.beginPath();
          ctx.roundRect(sx + 1.5, sy + 1.5, cellW - 3, cellH - 3, 4);
          ctx.fill();
        }
      });

      if (!gameOver) animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(animId);
    };
  }, [gameKey, paused, theme, wrapWalls]);

  return (
    <GameShell
      id="snake"
      status={
        <>
          <Tag tone="green">APPLES: {applesEaten} 🍎</Tag>
          <Tag tone="yellow">SCORE: {score}</Tag>
          <Tag tone="blue">{wrapWalls ? "WALL WARP ON" : "SOLID WALLS"}</Tag>
        </>
      }
      toolbar={
        <div className="flex gap-1">
          <BrutButton
            className="text-[10px] py-1 px-2"
            onClick={() => setTheme((t) => (t === "nokia" ? "cyber" : t === "cyber" ? "synth" : "nokia"))}
          >
            🎨 {THEMES[theme].name}
          </BrutButton>
          <BrutButton
            className={`text-[10px] py-1 px-2 ${wrapWalls ? "bg-sky-400 text-black font-bold" : ""}`}
            onClick={() => setWrapWalls((w) => !w)}
          >
            🌀 {wrapWalls ? "WARP ON" : "WARP OFF"}
          </BrutButton>
          <BrutButton variant="go" onClick={resetGame} className="text-xs py-1 px-3">
            🔄 RESTART (R)
          </BrutButton>
        </div>
      }
    >
      <div className="flex h-full w-full flex-col items-center justify-between p-2 font-mono text-xs select-none">
        
        {/* Top Header */}
        <div className="flex w-full max-w-sm items-center justify-between rounded border-2 border-lab-ink bg-stone-900 px-3 py-1.5 text-white shadow-sm">
          <span className="font-bold text-emerald-400">SNAKE.EXE · ARCADE</span>
          <span className="text-[10px] text-stone-400">WASD / ARROWS · SPACE (PAUSE)</span>
        </div>

        {/* Canvas Frame */}
        <div className="relative my-auto flex items-center justify-center rounded-lg border-4 border-lab-ink bg-black p-1 shadow-2xl">
          <canvas
            ref={canvasRef}
            className="rounded"
            style={{ width: "360px", height: "300px", maxWidth: "92vw" }}
          />

          {gameOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-4 text-center text-white space-y-3 rounded">
              <h3 className="font-display text-3xl text-rose-500 font-bold">CRASHED! 🐍💀</h3>
              <p className="text-xs text-stone-300">Final Score: {score} · Apples: {applesEaten}</p>
              <BrutButton variant="go" onClick={resetGame} className="mt-2 text-xs py-1.5 px-4 font-bold">
                PLAY AGAIN
              </BrutButton>
            </div>
          )}

          {paused && !gameOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 p-4 text-center text-white space-y-2 rounded">
              <h3 className="font-display text-2xl text-amber-400 font-bold">PAUSED</h3>
              <p className="text-xs text-stone-300">Press SPACE to resume</p>
            </div>
          )}
        </div>

        {/* Mobile / Touch D-pad */}
        <div className="grid grid-cols-3 gap-1 w-36">
          <div />
          <button
            type="button"
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }))}
            className="brut-sm bg-card hover:bg-stone-200 border border-lab-ink py-1 text-xs font-bold"
          >
            ▲
          </button>
          <div />
          <button
            type="button"
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }))}
            className="brut-sm bg-card hover:bg-stone-200 border border-lab-ink py-1 text-xs font-bold"
          >
            ◄
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }))}
            className="brut-sm bg-card hover:bg-stone-200 border border-lab-ink py-1 text-xs font-bold"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }))}
            className="brut-sm bg-card hover:bg-stone-200 border border-lab-ink py-1 text-xs font-bold"
          >
            ►
          </button>
        </div>

      </div>
    </GameShell>
  );
}

