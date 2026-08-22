import { useEffect, useRef, useState } from "react";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../../components/ui/brut";
import { GameShell } from "../GameShell";

interface Asteroid { x: number; y: number; vx: number; vy: number; radius: number; pts: number }
interface Bullet { x: number; y: number; vx: number; vy: number; life: number }

export default function Asteroids() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 500;
    canvas.height = 320;

    let shipX = 250, shipY = 160;
    let shipAngle = 0;
    let shipVx = 0, shipVy = 0;
    let bullets: Bullet[] = [];
    let asteroids: Asteroid[] = [];
    let curScore = 0, curLives = 3;
    let keys: Record<string, boolean> = {};
    let animId: number;

    for (let i = 0; i < 5; i++) {
      asteroids.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        radius: 25,
        pts: 20,
      });
    }

    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      if (e.key === " ") {
        bullets.push({
          x: shipX + Math.cos(shipAngle) * 15,
          y: shipY + Math.sin(shipAngle) * 15,
          vx: Math.cos(shipAngle) * 7,
          vy: Math.sin(shipAngle) * 7,
          life: 40,
        });
        sound.play("key");
      }
    };
    const onKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const loop = () => {
      if (keys["ArrowLeft"] || keys["a"]) shipAngle -= 0.08;
      if (keys["ArrowRight"] || keys["d"]) shipAngle += 0.08;
      if (keys["ArrowUp"] || keys["w"]) {
        shipVx += Math.cos(shipAngle) * 0.2;
        shipVy += Math.sin(shipAngle) * 0.2;
      }

      shipVx *= 0.98;
      shipVy *= 0.98;
      shipX = (shipX + shipVx + canvas.width) % canvas.width;
      shipY = (shipY + shipVy + canvas.height) % canvas.height;

      // Update Bullets
      bullets.forEach((b) => {
        b.x = (b.x + b.vx + canvas.width) % canvas.width;
        b.y = (b.y + b.vy + canvas.height) % canvas.height;
        b.life -= 1;
      });
      bullets = bullets.filter((b) => b.life > 0);

      // Update Asteroids
      asteroids.forEach((ast) => {
        ast.x = (ast.x + ast.vx + canvas.width) % canvas.width;
        ast.y = (ast.y + ast.vy + canvas.height) % canvas.height;
      });

      // Collisions: Bullet -> Asteroid
      bullets.forEach((b) => {
        asteroids.forEach((ast, aIdx) => {
          const dist = Math.hypot(b.x - ast.x, b.y - ast.y);
          if (dist < ast.radius) {
            b.life = 0;
            curScore += ast.pts;
            setScore(curScore);
            sound.play("pop");

            if (ast.radius > 12) {
              asteroids.push(
                { x: ast.x, y: ast.y, vx: ast.vx + 1, vy: ast.vy - 1, radius: ast.radius / 2, pts: 50 },
                { x: ast.x, y: ast.y, vx: -ast.vx - 1, vy: ast.vy + 1, radius: ast.radius / 2, pts: 50 }
              );
            }
            asteroids.splice(aIdx, 1);
          }
        });
      });

      // Collision: Ship -> Asteroid
      asteroids.forEach((ast) => {
        const dist = Math.hypot(shipX - ast.x, shipY - ast.y);
        if (dist < ast.radius + 8) {
          curLives -= 1;
          setLives(curLives);
          sound.play("error");
          shipX = 250; shipY = 160; shipVx = 0; shipVy = 0;
          if (curLives <= 0) {
            setGameOver(true);
            store.submitGameResult("asteroids", {
              gameId: "asteroids",
              score: curScore,
              completed: true,
              xpEarned: Math.round(curScore * 0.6),
              achievementsUnlocked: curScore >= 300 ? ["asteroid_miner"] : [],
            });
            return;
          }
        }
      });

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Ship
      ctx.save();
      ctx.translate(shipX, shipY);
      ctx.rotate(shipAngle);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-10, -8);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Render Bullets
      ctx.fillStyle = "#facc15";
      bullets.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Asteroids
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      asteroids.forEach((ast) => {
        ctx.beginPath();
        ctx.arc(ast.x, ast.y, ast.radius, 0, Math.PI * 2);
        ctx.stroke();
      });

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
    <GameShell id="asteroids" status={<Tag tone="purple">LIVES: {"❤️".repeat(lives)}</Tag>}>
      <div className="flex h-full w-full flex-col justify-between p-2 font-mono text-xs">
        <div className="brut bg-stone-900 text-white p-2 flex justify-between border-2 border-lab-ink">
          <span>SCORE: <b className="text-emerald-400">{score}</b></span>
          <span>SYSTEM: <b className="text-purple-300">ASTEROIDS.EXE</b></span>
        </div>

        <div className="relative flex-1 my-1 bg-black border-3 border-lab-ink rounded overflow-hidden flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
          {gameOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 text-white p-4 text-center space-y-3">
              <h3 className="font-display text-3xl text-rose-500">SHIP DESTROYED</h3>
              <p className="text-xs text-stone-300">Final Score: {score}</p>
              <BrutButton variant="go" onClick={() => window.location.reload()}>
                REPLAY ASTEROIDS
              </BrutButton>
            </div>
          )}
        </div>

        <div className="border-t-2 border-lab-ink pt-1 text-[10px] text-center text-stone-600">
          CONTROLS: ARROWS (STEER & THRUST), SPACE (FIRE)
        </div>
      </div>
    </GameShell>
  );
}
