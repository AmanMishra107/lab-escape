import { useEffect, useRef, useState } from "react";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../../components/ui/brut";
import { GameShell } from "../GameShell";

interface Bullet { x: number; y: number; isPlayer: boolean }
interface Invader { x: number; y: number; type: string; points: number }

export default function SpaceInvaders() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 480;
    canvas.height = 320;

    let px = 220;
    let bullets: Bullet[] = [];
    let invaders: Invader[] = [];
    let invDir = 1;
    let invSpeed = 1;
    let curScore = 0;
    let curLives = 3;
    let curWave = 1;
    let keys: Record<string, boolean> = {};
    let animId: number;

    function initWave() {
      invaders = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 8; c++) {
          invaders.push({
            x: 40 + c * 45,
            y: 40 + r * 30,
            type: r === 0 ? "POPUP" : r === 1 ? "VIRUS" : "BUG",
            points: (4 - r) * 100,
          });
        }
      }
    }
    initWave();

    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      if (e.key === " ") {
        bullets.push({ x: px + 16, y: 280, isPlayer: true });
        sound.play("key");
      }
    };
    const onKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const loop = () => {
      // Move Player
      if (keys["ArrowLeft"] || keys["a"]) px = Math.max(0, px - 5);
      if (keys["ArrowRight"] || keys["d"]) px = Math.min(canvas.width - 32, px + 5);

      // Move Bullets
      bullets.forEach((b) => { b.y += b.isPlayer ? -7 : 4; });
      bullets = bullets.filter((b) => b.y > 0 && b.y < canvas.height);

      // Move Invaders
      let edgeReached = false;
      invaders.forEach((inv) => {
        inv.x += invDir * invSpeed;
        if (inv.x <= 10 || inv.x >= canvas.width - 35) edgeReached = true;
      });

      if (edgeReached) {
        invDir *= -1;
        invaders.forEach((inv) => { inv.y += 12; });
      }

      // Bullet - Invader Collisions
      bullets.forEach((b) => {
        if (!b.isPlayer) return;
        invaders.forEach((inv, idx) => {
          if (b.x >= inv.x && b.x <= inv.x + 30 && b.y >= inv.y && b.y <= inv.y + 20) {
            invaders.splice(idx, 1);
            b.y = -999;
            curScore += inv.points;
            setScore(curScore);
            sound.play("pop");
          }
        });
      });

      // Invader - Player Base Collision / Wave Clear
      if (invaders.length === 0) {
        curWave += 1;
        setWave(curWave);
        invSpeed += 0.5;
        initWave();
        sound.play("success");
      }

      // Invader reaches bottom
      if (invaders.some((inv) => inv.y >= 260)) {
        curLives -= 1;
        setLives(curLives);
        sound.play("error");
        if (curLives <= 0) {
          setGameOver(true);
          store.submitGameResult("spaceinvaders", {
            gameId: "spaceinvaders",
            score: curScore,
            completed: true,
            xpEarned: Math.round(curScore * 0.6),
            achievementsUnlocked: curWave >= 3 ? ["invader", "alien_exterminator"] : ["invader"],
          });
          return;
        } else {
          initWave();
        }
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Player
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(px, 290, 32, 16);
      ctx.fillRect(px + 12, 282, 8, 8);

      // Render Invaders
      invaders.forEach((inv) => {
        ctx.fillStyle = inv.type === "POPUP" ? "#ef4444" : inv.type === "VIRUS" ? "#a855f7" : "#10b981";
        ctx.fillRect(inv.x, inv.y, 30, 20);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px monospace";
        ctx.fillText(inv.type[0]!, inv.x + 11, inv.y + 13);
      });

      // Render Bullets
      ctx.fillStyle = "#facc15";
      bullets.forEach((b) => ctx.fillRect(b.x, b.y, 3, 8));

      if (!gameOver) animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <GameShell id="spaceinvaders" status={<Tag tone="red">WAVE: {wave}</Tag>}>
      <div className="flex h-full w-full flex-col justify-between p-2 font-mono text-xs">
        <div className="brut bg-stone-900 text-white p-2 flex justify-between border-2 border-lab-ink">
          <span>SCORE: <b className="text-emerald-400">{score}</b></span>
          <span>LIVES: <b className="text-rose-400">{"❤️".repeat(lives)}</b></span>
        </div>

        <div className="relative flex-1 my-1 bg-black border-3 border-lab-ink rounded overflow-hidden flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
          {gameOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 text-white p-4 text-center space-y-3">
              <h3 className="font-display text-3xl text-rose-500">DEFENSES BREACHED</h3>
              <p className="text-xs text-stone-300">Final Score: {score} | Wave: {wave}</p>
              <BrutButton variant="go" onClick={() => window.location.reload()}>
                REPLAY INVADERS
              </BrutButton>
            </div>
          )}
        </div>

        <div className="border-t-2 border-lab-ink pt-1 text-[10px] text-center text-stone-600">
          CONTROLS: ARROWS (MOVE), SPACE (FIRE)
        </div>
      </div>
    </GameShell>
  );
}
