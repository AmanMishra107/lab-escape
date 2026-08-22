import { useEffect, useRef, useState } from "react";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../../components/ui/brut";
import { GameShell } from "../GameShell";

interface Brick { x: number; y: number; w: number; h: number; color: string; pts: number; destroyed: boolean }

export default function Breakout() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 480;
    canvas.height = 320;

    let padX = 200;
    const padW = 80, padH = 12;
    let bx = 240, by = 280;
    let bvx = 4, bvy = -4;

    let bricks: Brick[] = [];
    const colors = ["#ef4444", "#f97316", "#eab308", "#10b981", "#3b82f6"];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 8; c++) {
        bricks.push({
          x: 15 + c * 57,
          y: 35 + r * 22,
          w: 52,
          h: 18,
          color: colors[r]!,
          pts: (5 - r) * 10,
          destroyed: false,
        });
      }
    }

    let curScore = 0, curLives = 3;
    let keys: Record<string, boolean> = {};
    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      padX = Math.max(0, Math.min(canvas.width - padW, e.clientX - rect.left - padW / 2));
    };
    const onKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };

    canvas.addEventListener("mousemove", onMouseMove);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const loop = () => {
      if (keys["ArrowLeft"] || keys["a"]) padX = Math.max(0, padX - 6);
      if (keys["ArrowRight"] || keys["d"]) padX = Math.min(canvas.width - padW, padX + 6);

      bx += bvx;
      by += bvy;

      if (bx <= 5 || bx >= canvas.width - 5) bvx *= -1;
      if (by <= 5) bvy *= -1;

      // Paddle collision
      if (by >= 290 && bx >= padX && bx <= padX + padW) {
        bvy = -Math.abs(bvy);
        bvx = (bx - (padX + padW / 2)) * 0.15;
        sound.play("pop");
      }

      // Brick collision
      bricks.forEach((b) => {
        if (b.destroyed) return;
        if (bx >= b.x && bx <= b.x + b.w && by >= b.y && by <= b.y + b.h) {
          b.destroyed = true;
          bvy *= -1;
          curScore += b.pts;
          setScore(curScore);
          sound.play("key");
        }
      });

      // Win check
      if (bricks.every((b) => b.destroyed)) {
        setWon(true);
        store.submitGameResult("breakout", {
          gameId: "breakout",
          score: curScore + 500,
          completed: true,
          xpEarned: 300,
          achievementsUnlocked: ["breaker", "brick_wall"],
        });
        return;
      }

      // Ball missed
      if (by >= canvas.height) {
        curLives -= 1;
        setLives(curLives);
        sound.play("error");
        if (curLives <= 0) {
          setGameOver(true);
          store.submitGameResult("breakout", {
            gameId: "breakout",
            score: curScore,
            completed: true,
            xpEarned: Math.round(curScore * 0.5),
            achievementsUnlocked: curScore >= 250 ? ["breaker"] : [],
          });
          return;
        } else {
          bx = 240; by = 280; bvx = 4; bvy = -4;
        }
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Bricks
      bricks.forEach((b) => {
        if (b.destroyed) return;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
      });

      // Render Paddle
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(padX, 300, padW, padH);

      // Render Ball
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, Math.PI * 2);
      ctx.fill();

      if (!gameOver && !won) animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      canvas.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <GameShell id="breakout" status={<Tag tone="yellow">LIVES: {"❤️".repeat(lives)}</Tag>}>
      <div className="flex h-full w-full flex-col justify-between p-2 font-mono text-xs">
        <div className="brut bg-stone-900 text-white p-2 flex justify-between border-2 border-lab-ink">
          <span>SCORE: <b className="text-emerald-400">{score}</b></span>
          <span>MODE: <b className="text-sky-400">BREAKOUT.EXE</b></span>
        </div>

        <div className="relative flex-1 my-1 bg-black border-3 border-lab-ink rounded overflow-hidden flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
          {(gameOver || won) && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 text-white p-4 text-center space-y-3">
              <h3 className={`font-display text-3xl ${won ? "text-emerald-400" : "text-rose-500"}`}>
                {won ? "ALL BRICKS CLEARED!" : "GAME OVER"}
              </h3>
              <p className="text-xs text-stone-300">Final Score: {score}</p>
              <BrutButton variant="go" onClick={() => window.location.reload()}>
                REPLAY BREAKOUT
              </BrutButton>
            </div>
          )}
        </div>

        <div className="border-t-2 border-lab-ink pt-1 text-[10px] text-center text-stone-600">
          CONTROLS: MOUSE / ARROWS (SLIDE PADDLE)
        </div>
      </div>
    </GameShell>
  );
}
