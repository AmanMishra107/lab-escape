import { useEffect, useRef, useState } from "react";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../../components/ui/brut";
import { GameShell } from "../GameShell";

// 1 = Wall, 0 = Pellet, 2 = Power Pellet, 9 = Empty
const MAZE_GRID = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,0,0,0,1,0,0,0,1,0,0,0,2,1],
  [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,1,0,1,1,9,9,9,1,1,0,1,0,1],
  [1,0,1,0,1,9,9,9,9,9,1,0,1,0,1],
  [1,0,0,0,1,1,1,1,1,1,1,0,0,0,1],
  [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
  [1,2,0,0,1,1,0,1,0,1,1,0,0,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

interface Ghost {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  color: string;
  personality: "chase" | "ambush" | "random" | "predictive";
}

export default function PacMan() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 450;
    canvas.height = 300;

    let grid = MAZE_GRID.map((row) => [...row]);
    let px = 1, py = 1;
    let dirX = 0, dirY = 0;
    let nextDirX = 0, nextDirY = 0;
    let currentScore = 0;
    let currentLives = 3;
    let powerModeMs = 0;

    const ghosts: Ghost[] = [
      { x: 7, y: 4, dirX: 1, dirY: 0, color: "#ef4444", personality: "chase" },
      { x: 7, y: 5, dirX: -1, dirY: 0, color: "#ec4899", personality: "ambush" },
      { x: 6, y: 4, dirX: 0, dirY: 1, color: "#06b6d4", personality: "random" },
      { x: 8, y: 4, dirX: 0, dirY: -1, color: "#f59e0b", personality: "predictive" },
    ];

    let animId: number;
    let lastTime = performance.now();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { nextDirX = -1; nextDirY = 0; }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { nextDirX = 1; nextDirY = 0; }
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") { nextDirX = 0; nextDirY = -1; }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") { nextDirX = 0; nextDirY = 1; }
    };
    window.addEventListener("keydown", onKeyDown);

    let moveCounter = 0;

    const gameLoop = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      if (powerModeMs > 0) powerModeMs = Math.max(0, powerModeMs - dt);

      moveCounter += 1;
      if (moveCounter >= 8) {
        moveCounter = 0;

        // Try changing player direction if path is open
        if (nextDirX !== 0 || nextDirY !== 0) {
          const nx = px + nextDirX;
          const ny = py + nextDirY;
          if (grid[ny]?.[nx] !== 1) {
            dirX = nextDirX;
            dirY = nextDirY;
          }
        }

        // Move player
        const nx = px + dirX;
        const ny = py + dirY;
        if (grid[ny]?.[nx] !== 1) {
          px = nx;
          py = ny;
        }

        // Eat pellet
        if (grid[py]?.[px] === 0) {
          grid[py][px] = 9;
          currentScore += 10;
          sound.play("pop");
          setScore(currentScore);
        } else if (grid[py]?.[px] === 2) {
          grid[py][px] = 9;
          currentScore += 50;
          powerModeMs = 7000;
          sound.play("success");
          setScore(currentScore);
        }

        // Move ghosts
        ghosts.forEach((g) => {
          const possibleDirs: { x: number; y: number }[] = [
            { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
          ].filter((d) => grid[g.y + d.y]?.[g.x + d.x] !== 1);

          if (possibleDirs.length > 0) {
            const chosen = possibleDirs[Math.floor(Math.random() * possibleDirs.length)]!;
            g.x += chosen.x;
            g.y += chosen.y;
          }

          // Ghost collision
          if (g.x === px && g.y === py) {
            if (powerModeMs > 0) {
              currentScore += 200;
              g.x = 7; g.y = 4; // Respawn ghost
              setScore(currentScore);
            } else {
              sound.play("error");
              currentLives -= 1;
              setLives(currentLives);
              px = 1; py = 1;
              if (currentLives <= 0) {
                setGameOver(true);
                store.submitGameResult("pacman", {
                  gameId: "pacman",
                  score: currentScore,
                  completed: true,
                  xpEarned: Math.round(currentScore * 0.8),
                  achievementsUnlocked: currentScore >= 500 ? ["labman_clear"] : [],
                });
                return;
              }
            }
          }
        });

        // Check clear win condition
        const pelletsRemaining = grid.flat().filter((cell) => cell === 0 || cell === 2).length;
        if (pelletsRemaining === 0) {
          setWon(true);
          store.submitGameResult("pacman", {
            gameId: "pacman",
            score: currentScore + 1000,
            completed: true,
            xpEarned: 350,
            achievementsUnlocked: ["labman_clear", "maze_runner"],
          });
          return;
        }
      }

      // Render Grid
      const cellW = canvas.width / 15;
      const cellH = canvas.height / 10;
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 15; c++) {
          const val = grid[r]![c];
          if (val === 1) {
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 1;
            ctx.strokeRect(c * cellW, r * cellH, cellW, cellH);
          } else if (val === 0) {
            ctx.fillStyle = "#facc15";
            ctx.beginPath();
            ctx.arc(c * cellW + cellW / 2, r * cellH + cellH / 2, 3, 0, Math.PI * 2);
            ctx.fill();
          } else if (val === 2) {
            ctx.fillStyle = "#38bdf8";
            ctx.beginPath();
            ctx.arc(c * cellW + cellW / 2, r * cellH + cellH / 2, 7, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Render Player
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(px * cellW + cellW / 2, py * cellH + cellH / 2, cellW / 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Render Ghosts
      ghosts.forEach((g) => {
        ctx.fillStyle = powerModeMs > 0 ? "#3b82f6" : g.color;
        ctx.beginPath();
        ctx.arc(g.x * cellW + cellW / 2, g.y * cellH + cellH / 2, cellW / 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!gameOver && !won) animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <GameShell id="pacman" status={<Tag tone="yellow">LIVES: {"❤️".repeat(lives)}</Tag>}>
      <div className="flex h-full w-full flex-col justify-between p-2 font-mono text-xs">
        <div className="brut bg-stone-900 text-white p-2 flex justify-between border-2 border-lab-ink">
          <span>SCORE: <b className="text-emerald-400">{score}</b></span>
          <span>MODE: <b className="text-amber-400">LAB-MAN.EXE</b></span>
        </div>

        <div className="relative flex-1 my-1 bg-black border-3 border-lab-ink rounded overflow-hidden flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
          {(gameOver || won) && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 text-white p-4 text-center space-y-3">
              <h3 className={`font-display text-3xl ${won ? "text-emerald-400" : "text-rose-500"}`}>
                {won ? "MAZE CLEARED!" : "GAME OVER"}
              </h3>
              <p className="text-xs text-stone-300">Final Score: {score}</p>
              <BrutButton variant="go" onClick={() => window.location.reload()}>
                REPLAY LAB-MAN
              </BrutButton>
            </div>
          )}
        </div>

        <div className="border-t-2 border-lab-ink pt-1 text-[10px] text-center text-stone-600">
          CONTROLS: WASD / ARROWS TO NAVIGATE MAZE
        </div>
      </div>
    </GameShell>
  );
}
