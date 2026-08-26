import { useEffect, useRef, useState } from "react";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../../components/ui/brut";
import { GameShell } from "../GameShell";

// 1 = Wall, 0 = Dot, 2 = Energizer (Power Pellet), 9 = Empty path, 8 = Ghost Gate / House
const ARCADE_MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
  [1,1,1,1,0,1,1,1,9,1,9,1,1,1,0,1,1,1,1],
  [9,9,9,1,0,1,9,9,9,9,9,9,9,1,0,1,9,9,9], // Warp tunnel row!
  [1,1,1,1,0,1,9,1,1,8,1,1,9,1,0,1,1,1,1],
  [1,9,9,9,0,9,9,1,9,9,9,1,9,9,0,9,9,9,1],
  [1,1,1,1,0,1,9,1,1,1,1,1,9,1,0,1,1,1,1],
  [9,9,9,1,0,1,9,9,9,9,9,9,9,1,0,1,9,9,9], // Warp tunnel row!
  [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,2,0,1,0,0,0,0,0,9,0,0,0,0,0,1,0,2,1],
  [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

interface Ghost {
  id: string;
  name: string;
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  baseColor: string;
  personality: "blinky" | "pinky" | "inky" | "clyde";
  isEaten: boolean;
  spawnX: number;
  spawnY: number;
}

export default function PacMan() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [powerActive, setPowerActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  // Restart handler
  const resetGame = () => {
    setGameOver(false);
    setWon(false);
    setLives(3);
    setScore(0);
    setPowerActive(false);
    setGameKey((k) => k + 1);
    sound.play("click");
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    
    // Canvas internal resolution (19 cols x 20 rows)
    const COLS = 19;
    const ROWS = 20;
    canvas.width = 380;
    canvas.height = 400;
    const cellW = canvas.width / COLS;
    const cellH = canvas.height / ROWS;

    let grid = ARCADE_MAZE.map((r) => [...r]);
    let px = 9;
    let py = 16;
    let dirX = 0;
    let dirY = 0;
    let nextDirX = 0;
    let nextDirY = 0;
    let mouthAngle = 0.2;
    let mouthDir = 1;
    let currentScore = 0;
    let currentLives = 3;
    let powerTimerMs = 0;
    let ghostMultiplier = 1;

    // Bonus fruit item
    let fruitActive = false;
    let fruitTimer = 180; // frames until fruit spawn
    const fruitX = 9;
    const fruitY = 10;

    const ghosts: Ghost[] = [
      { id: "blinky", name: "Blinky", x: 9, y: 8, dirX: 1, dirY: 0, baseColor: "#ef4444", personality: "blinky", isEaten: false, spawnX: 9, spawnY: 8 },
      { id: "pinky",  name: "Pinky",  x: 9, y: 10, dirX: 0, dirY: -1, baseColor: "#f472b6", personality: "pinky",  isEaten: false, spawnX: 9, spawnY: 10 },
      { id: "inky",   name: "Inky",   x: 8, y: 10, dirX: 0, dirY: -1, baseColor: "#38bdf8", personality: "inky",   isEaten: false, spawnX: 8, spawnY: 10 },
      { id: "clyde",  name: "Clyde",  x: 10, y: 10, dirX: 0, dirY: -1, baseColor: "#fb923c", personality: "clyde",  isEaten: false, spawnX: 10, spawnY: 10 },
    ];

    let animId: number;
    let frameCount = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { nextDirX = -1; nextDirY = 0; }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { nextDirX = 1; nextDirY = 0; }
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") { nextDirX = 0; nextDirY = -1; }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") { nextDirX = 0; nextDirY = 1; }
    };
    window.addEventListener("keydown", onKeyDown);

    const isWalkable = (gx: number, gy: number, isGhost = false): boolean => {
      // Warp tunnels
      if (gy === 8 || gy === 12) {
        if (gx < 0 || gx >= COLS) return true;
      }
      const cell = grid[gy]?.[gx];
      if (cell === undefined) return false;
      if (cell === 1) return false; // Solid wall
      if (cell === 8 && !isGhost) return false; // Ghost house gate
      return true;
    };

    const gameLoop = () => {
      frameCount++;

      // Mouth chomping cycle
      mouthAngle += 0.03 * mouthDir;
      if (mouthAngle > 0.35) mouthDir = -1;
      if (mouthAngle < 0.03) mouthDir = 1;

      // Power mode timer
      if (powerTimerMs > 0) {
        powerTimerMs -= 16.6;
        if (powerTimerMs <= 0) {
          setPowerActive(false);
          ghostMultiplier = 1;
        }
      }

      // Spawn bonus fruit periodically
      if (!fruitActive) {
        fruitTimer--;
        if (fruitTimer <= 0) {
          fruitActive = true;
          fruitTimer = 350;
        }
      }

      // Move player every 6 frames
      if (frameCount % 6 === 0) {
        // Try turning into next direction if open
        if (nextDirX !== 0 || nextDirY !== 0) {
          const testX = px + nextDirX;
          const testY = py + nextDirY;
          if (isWalkable(testX, testY)) {
            dirX = nextDirX;
            dirY = nextDirY;
          }
        }

        // Move player in current heading
        const nextPx = px + dirX;
        const nextPy = py + dirY;

        // Tunnel warp logic
        if (nextPx < 0) px = COLS - 1;
        else if (nextPx >= COLS) px = 0;
        else if (isWalkable(nextPx, nextPy)) {
          px = nextPx;
          py = nextPy;
        }

        // Eat Dots and Power Pellets
        const cell = grid[py]?.[px];
        if (cell === 0) {
          grid[py]![px] = 9;
          currentScore += 10;
          sound.play("pop");
          setScore(currentScore);
        } else if (cell === 2) {
          grid[py]![px] = 9;
          currentScore += 50;
          powerTimerMs = 7500;
          setPowerActive(true);
          ghostMultiplier = 1;
          sound.play("powerup");
          setScore(currentScore);
        }

        // Eat bonus fruit
        if (fruitActive && px === fruitX && py === fruitY) {
          fruitActive = false;
          currentScore += 200;
          sound.play("success");
          setScore(currentScore);
        }

        // Check if all pellets cleared
        const remainingDots = grid.flat().filter((c) => c === 0 || c === 2).length;
        if (remainingDots === 0) {
          setWon(true);
          sound.play("success");
          store.submitGameResult("pacman", {
            gameId: "pacman",
            score: currentScore + 1000,
            completed: true,
            xpEarned: 400,
            achievementsUnlocked: ["labman_clear"],
          });
          return;
        }
      }

      // Move Ghosts every 7 frames (slightly slower in power mode)
      const ghostSpeed = powerTimerMs > 0 ? 10 : 7;
      if (frameCount % ghostSpeed === 0) {
        ghosts.forEach((g) => {
          if (g.isEaten) {
            // Eaten eyes travel quickly back to ghost house
            if (g.x < g.spawnX) g.x++;
            else if (g.x > g.spawnX) g.x--;
            if (g.y < g.spawnY) g.y++;
            else if (g.y > g.spawnY) g.y--;
            if (g.x === g.spawnX && g.y === g.spawnY) {
              g.isEaten = false;
            }
            return;
          }

          // Compute possible valid moves (excluding 180° immediate reverse)
          const allDirs = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 },
          ];

          const validDirs = allDirs.filter((d) => {
            if (d.x === -g.dirX && d.y === -g.dirY) return false; // No instant turn around
            return isWalkable(g.x + d.x, g.y + d.y, true);
          });

          const candidates = validDirs.length > 0 ? validDirs : allDirs.filter((d) => isWalkable(g.x + d.x, g.y + d.y, true));

          if (candidates.length > 0) {
            // Target selection based on ghost personality
            let targetX = px;
            let targetY = py;

            if (powerTimerMs > 0) {
              // Frightened mode: flee away from player
              targetX = COLS - px;
              targetY = ROWS - py;
            } else if (g.personality === "pinky") {
              // Ambush: aim 4 tiles ahead of player
              targetX = px + dirX * 4;
              targetY = py + dirY * 4;
            } else if (g.personality === "inky") {
              // Flanker vector
              targetX = px + (px - ghosts[0]!.x);
              targetY = py + (py - ghosts[0]!.y);
            } else if (g.personality === "clyde") {
              // Timid: if close to player, retreat to bottom-left corner
              const dist = Math.hypot(g.x - px, g.y - py);
              if (dist < 5) {
                targetX = 1;
                targetY = 18;
              }
            }

            // Pick candidate closest to target
            candidates.sort((a, b) => {
              const da = Math.hypot(g.x + a.x - targetX, g.y + a.y - targetY);
              const db = Math.hypot(g.x + b.x - targetX, g.y + b.y - targetY);
              return da - db;
            });

            const chosen = candidates[0]!;
            g.dirX = chosen.x;
            g.dirY = chosen.y;
            g.x += chosen.x;
            g.y += chosen.y;
          }

          // Collision detection between Lab-Man and Ghost
          if (Math.abs(g.x - px) <= 0.5 && Math.abs(g.y - py) <= 0.5) {
            if (powerTimerMs > 0 && !g.isEaten) {
              // Eat ghost!
              g.isEaten = true;
              const pts = 200 * ghostMultiplier;
              ghostMultiplier *= 2;
              currentScore += pts;
              sound.play("success");
              setScore(currentScore);
            } else if (!g.isEaten) {
              // Lab-man caught!
              sound.play("error");
              currentLives--;
              setLives(currentLives);
              px = 9;
              py = 16;
              dirX = 0;
              dirY = 0;
              nextDirX = 0;
              nextDirY = 0;

              if (currentLives <= 0) {
                setGameOver(true);
                store.submitGameResult("pacman", {
                  gameId: "pacman",
                  score: currentScore,
                  completed: true,
                  xpEarned: Math.round(currentScore * 0.7),
                  achievementsUnlocked: currentScore >= 600 ? ["labman_clear"] : [],
                });
                return;
              }
            }
          }
        });
      }

      // ==========================================
      // RENDER CANVAS
      // ==========================================
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Maze Walls & Pellets
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const val = grid[r]![c];
          const cx = c * cellW;
          const cy = r * cellH;

          if (val === 1) {
            // Neon Arcade Maze Wall
            ctx.fillStyle = "#1e1b4b";
            ctx.fillRect(cx, cy, cellW, cellH);
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 2;
            ctx.strokeRect(cx + 1, cy + 1, cellW - 2, cellH - 2);
          } else if (val === 8) {
            // Ghost Gate Door
            ctx.fillStyle = "#f472b6";
            ctx.fillRect(cx, cy + cellH / 2 - 2, cellW, 4);
          } else if (val === 0) {
            // Small Pellet Dot
            ctx.fillStyle = "#fef08a";
            ctx.beginPath();
            ctx.arc(cx + cellW / 2, cy + cellH / 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (val === 2) {
            // Flashing Power Pellet Energizer
            const flash = Math.sin(frameCount * 0.15) > 0;
            ctx.fillStyle = flash ? "#38bdf8" : "#fef08a";
            ctx.beginPath();
            ctx.arc(cx + cellW / 2, cy + cellH / 2, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 2. Draw Bonus Fruit (Coffee Mug / Cherry)
      if (fruitActive) {
        const fx = fruitX * cellW + cellW / 2;
        const fy = fruitY * cellH + cellH / 2;
        ctx.fillStyle = "#f43f5e";
        ctx.beginPath();
        ctx.arc(fx, fy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(fx - 1, fy - 8, 3, 4);
      }

      // 3. Draw Lab-Man (Chomping Pac-Man)
      const pmX = px * cellW + cellW / 2;
      const pmY = py * cellH + cellH / 2;
      let rotAngle = 0;
      if (dirX === 1) rotAngle = 0;
      else if (dirX === -1) rotAngle = Math.PI;
      else if (dirY === 1) rotAngle = Math.PI / 2;
      else if (dirY === -1) rotAngle = (3 * Math.PI) / 2;

      ctx.save();
      ctx.translate(pmX, pmY);
      ctx.rotate(rotAngle);
      ctx.fillStyle = "#facc15"; // Classic yellow
      ctx.beginPath();
      ctx.arc(0, 0, cellW / 2 - 1, mouthAngle * Math.PI, (2 - mouthAngle) * Math.PI);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // 4. Draw Ghosts
      ghosts.forEach((g) => {
        const gx = g.x * cellW + cellW / 2;
        const gy = g.y * cellH + cellH / 2;
        const radius = cellW / 2 - 1;

        if (g.isEaten) {
          // Floating Eyes
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(gx - 3, gy - 2, 3, 0, Math.PI * 2);
          ctx.arc(gx + 3, gy - 2, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#1e40af";
          ctx.beginPath();
          ctx.arc(gx - 3 + g.dirX, gy - 2 + g.dirY, 1.5, 0, Math.PI * 2);
          ctx.arc(gx + 3 + g.dirX, gy - 2 + g.dirY, 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Ghost Body & Skirt
          const isFrightened = powerTimerMs > 0;
          const isFlashing = isFrightened && powerTimerMs < 2000 && Math.sin(frameCount * 0.3) > 0;
          ctx.fillStyle = isFlashing ? "#f8fafc" : isFrightened ? "#1e40af" : g.baseColor;

          ctx.beginPath();
          ctx.arc(gx, gy - 2, radius, Math.PI, 0, false);
          ctx.lineTo(gx + radius, gy + radius);
          // Wavy skirt feet
          ctx.lineTo(gx + radius / 2, gy + radius - 3);
          ctx.lineTo(gx, gy + radius);
          ctx.lineTo(gx - radius / 2, gy + radius - 3);
          ctx.lineTo(gx - radius, gy + radius);
          ctx.closePath();
          ctx.fill();

          // Eyes & Pupils
          ctx.fillStyle = isFrightened ? "#fef08a" : "#ffffff";
          ctx.beginPath();
          ctx.arc(gx - 3, gy - 3, 3, 0, Math.PI * 2);
          ctx.arc(gx + 3, gy - 3, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = isFrightened ? "#ef4444" : "#0f172a";
          ctx.beginPath();
          ctx.arc(gx - 3 + (isFrightened ? 0 : g.dirX), gy - 3 + (isFrightened ? 0 : g.dirY), 1.5, 0, Math.PI * 2);
          ctx.arc(gx + 3 + (isFrightened ? 0 : g.dirX), gy - 3 + (isFrightened ? 0 : g.dirY), 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      if (!gameOver && !won) {
        animId = requestAnimationFrame(gameLoop);
      }
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(animId);
    };
  }, [gameKey]);

  return (
    <GameShell
      id="pacman"
      status={
        <>
          <Tag tone="yellow">LIVES: {"🟡".repeat(lives)}</Tag>
          <Tag tone={powerActive ? "purple" : "blue"}>
            {powerActive ? "⚡ POWER MODE" : `SCORE ${score}`}
          </Tag>
        </>
      }
      toolbar={
        <BrutButton variant="go" onClick={resetGame} className="text-xs py-1">
          🔄 RESTART (R)
        </BrutButton>
      }
    >
      <div className="flex h-full w-full flex-col items-center justify-between p-2 font-mono select-none">
        
        {/* Arcade Top HUD */}
        <div className="flex w-full max-w-sm items-center justify-between rounded border-2 border-lab-ink bg-stone-900 px-3 py-1.5 text-xs text-white shadow-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400">LAB-MAN.EXE</span>
            {powerActive && <span className="animate-pulse font-black text-sky-400">CHASE GHOSTS!</span>}
          </div>
          <span className="text-[10px] text-stone-400">WASD / ARROWS</span>
        </div>

        {/* Arcade Canvas Frame */}
        <div className="relative my-auto flex items-center justify-center rounded-lg border-4 border-lab-ink bg-black p-2 shadow-2xl">
          <canvas
            ref={canvasRef}
            className="rounded"
            style={{ width: "320px", height: "340px", maxWidth: "90vw" }}
          />

          {/* Game Over / Victory Modal */}
          {(gameOver || won) && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-4 text-center text-white space-y-3 rounded">
              <h3 className={`font-display text-3xl font-black ${won ? "text-emerald-400" : "text-rose-500"}`}>
                {won ? "MAZE CLEARED! 🏆" : "GAME OVER 💀"}
              </h3>
              <p className="text-xs text-stone-300">Final Score: {score}</p>
              <BrutButton variant="go" onClick={resetGame} className="mt-2 text-xs py-1.5 px-4 font-bold">
                PLAY AGAIN
              </BrutButton>
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

