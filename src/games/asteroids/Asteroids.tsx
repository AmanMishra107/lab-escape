import { useEffect, useRef, useState } from "react";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../../components/ui/brut";
import { GameShell } from "../GameShell";

interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pts: number;
  verts: { x: number; y: number }[];
  angle: number;
  rotSpeed: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  isUfo?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface UFO {
  x: number;
  y: number;
  vx: number;
  vy: number;
  shootTimer: number;
}

export default function Asteroids() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [shield, setShield] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [gameKey, setGameKey] = useState(0);

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setShield(100);
    setLevel(1);
    setGameOver(false);
    setGameKey((k) => k + 1);
    sound.play("click");
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 480;
    canvas.height = 360;

    let shipX = 240, shipY = 180;
    let shipAngle = -Math.PI / 2;
    let shipVx = 0, shipVy = 0;
    let currentShield = 100;
    let currentLives = 3;
    let currentScore = 0;
    let curLevel = 1;

    let bullets: Bullet[] = [];
    let asteroids: Asteroid[] = [];
    let particles: Particle[] = [];
    let ufo: UFO | null = null;
    let ufoSpawnTimer = 400;

    let keys: Record<string, boolean> = {};
    let animId: number;

    function createJaggedVertices(radius: number, numVerts = 10): { x: number; y: number }[] {
      const verts: { x: number; y: number }[] = [];
      for (let i = 0; i < numVerts; i++) {
        const a = (i / numVerts) * Math.PI * 2;
        const r = radius * (0.75 + Math.random() * 0.5);
        verts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
      }
      return verts;
    }

    function spawnAsteroidWave(count: number) {
      for (let i = 0; i < count; i++) {
        const radius = 28;
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        // Avoid spawning right on top of player
        if (Math.hypot(x - shipX, y - shipY) < 90) {
          x = (x + 150) % canvas.width;
        }

        asteroids.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 2.2,
          vy: (Math.random() - 0.5) * 2.2,
          radius,
          pts: 20,
          verts: createJaggedVertices(radius, 11),
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.04,
        });
      }
    }

    spawnAsteroidWave(4);

    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      if (e.key === " ") {
        e.preventDefault();
        // Fire bullet
        bullets.push({
          x: shipX + Math.cos(shipAngle) * 16,
          y: shipY + Math.sin(shipAngle) * 16,
          vx: Math.cos(shipAngle) * 8 + shipVx * 0.4,
          vy: Math.sin(shipAngle) * 8 + shipVy * 0.4,
          life: 45,
        });
        sound.play("key");
      }
      if (e.key === "h" || e.key === "H") {
        // Hyperspace warp panic button
        shipX = Math.random() * canvas.width;
        shipY = Math.random() * canvas.height;
        shipVx = 0;
        shipVy = 0;
        sound.play("powerup");
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const gameLoop = () => {
      // 1. Controls & Ship Physics
      if (keys["ArrowLeft"] || keys["a"] || keys["A"]) shipAngle -= 0.08;
      if (keys["ArrowRight"] || keys["d"] || keys["D"]) shipAngle += 0.08;

      const isThrusting = keys["ArrowUp"] || keys["w"] || keys["W"];
      if (isThrusting) {
        shipVx += Math.cos(shipAngle) * 0.22;
        shipVy += Math.sin(shipAngle) * 0.22;

        // Thrust particle exhaust
        particles.push({
          x: shipX - Math.cos(shipAngle) * 12 + (Math.random() - 0.5) * 4,
          y: shipY - Math.sin(shipAngle) * 12 + (Math.random() - 0.5) * 4,
          vx: -Math.cos(shipAngle) * 3 + (Math.random() - 0.5) * 1.5,
          vy: -Math.sin(shipAngle) * 3 + (Math.random() - 0.5) * 1.5,
          life: 16,
          color: Math.random() > 0.5 ? "#f97316" : "#facc15",
        });
      }

      // Drag friction
      shipVx *= 0.985;
      shipVy *= 0.985;

      // Position wrap-around
      shipX = (shipX + shipVx + canvas.width) % canvas.width;
      shipY = (shipY + shipVy + canvas.height) % canvas.height;

      // Slowly recharge shield
      if (currentShield < 100) {
        currentShield = Math.min(100, currentShield + 0.06);
        setShield(Math.round(currentShield));
      }

      // 2. UFO Spawner & Logic
      if (!ufo) {
        ufoSpawnTimer--;
        if (ufoSpawnTimer <= 0) {
          ufo = {
            x: 0,
            y: 50 + Math.random() * (canvas.height - 100),
            vx: 1.8,
            vy: (Math.random() - 0.5) * 1.2,
            shootTimer: 60,
          };
          ufoSpawnTimer = 600;
        }
      } else {
        ufo.x += ufo.vx;
        ufo.y += ufo.vy;
        ufo.shootTimer--;

        if (ufo.shootTimer <= 0) {
          ufo.shootTimer = 75;
          const angleToPlayer = Math.atan2(shipY - ufo.y, shipX - ufo.x);
          bullets.push({
            x: ufo.x,
            y: ufo.y,
            vx: Math.cos(angleToPlayer) * 4.5,
            vy: Math.sin(angleToPlayer) * 4.5,
            life: 60,
            isUfo: true,
          });
        }

        if (ufo.x > canvas.width + 30) ufo = null;
      }

      // 3. Update Bullets
      bullets.forEach((b) => {
        b.x = (b.x + b.vx + canvas.width) % canvas.width;
        b.y = (b.y + b.vy + canvas.height) % canvas.height;
        b.life--;
      });
      bullets = bullets.filter((b) => b.life > 0);

      // 4. Update Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
      });
      particles = particles.filter((p) => p.life > 0);

      // 5. Update Asteroids
      asteroids.forEach((ast) => {
        ast.x = (ast.x + ast.vx + canvas.width) % canvas.width;
        ast.y = (ast.y + ast.vy + canvas.height) % canvas.height;
        ast.angle += ast.rotSpeed;
      });

      // 6. Collision: Player Bullets -> Asteroids & UFO
      bullets.forEach((b) => {
        if (b.isUfo) {
          // UFO bullet -> Player collision
          if (Math.hypot(b.x - shipX, b.y - shipY) < 14) {
            b.life = 0;
            damageShip();
          }
          return;
        }

        // Bullet -> UFO
        if (ufo && Math.hypot(b.x - ufo.x, b.y - ufo.y) < 20) {
          b.life = 0;
          ufo = null;
          currentScore += 200;
          setScore(currentScore);
          sound.play("success");
          createExplosion(ufo?.x ?? b.x, ufo?.y ?? b.y, "#ec4899", 20);
        }

        // Bullet -> Asteroids
        asteroids.forEach((ast, aIdx) => {
          if (Math.hypot(b.x - ast.x, b.y - ast.y) < ast.radius) {
            b.life = 0;
            currentScore += ast.pts;
            setScore(currentScore);
            sound.play("pop");

            createExplosion(ast.x, ast.y, "#94a3b8", Math.round(ast.radius));

            // Split asteroid into smaller fragments
            if (ast.radius > 16) {
              const newR = ast.radius / 1.8;
              for (let k = 0; k < 2; k++) {
                asteroids.push({
                  x: ast.x,
                  y: ast.y,
                  vx: (Math.random() - 0.5) * 3.5,
                  vy: (Math.random() - 0.5) * 3.5,
                  radius: newR,
                  pts: 50,
                  verts: createJaggedVertices(newR, 9),
                  angle: Math.random() * Math.PI * 2,
                  rotSpeed: (Math.random() - 0.5) * 0.07,
                });
              }
            }

            asteroids.splice(aIdx, 1);
          }
        });
      });

      // 7. Collision: Ship -> Asteroids
      asteroids.forEach((ast) => {
        if (Math.hypot(shipX - ast.x, shipY - ast.y) < ast.radius + 10) {
          damageShip();
        }
      });

      function damageShip() {
        if (currentShield > 30) {
          currentShield -= 35;
          setShield(Math.round(currentShield));
          sound.play("warn");
          createExplosion(shipX, shipY, "#38bdf8", 12);
        } else {
          currentLives--;
          setLives(currentLives);
          currentShield = 100;
          setShield(100);
          sound.play("error");
          createExplosion(shipX, shipY, "#f43f5e", 25);
          shipX = 240;
          shipY = 180;
          shipVx = 0;
          shipVy = 0;

          if (currentLives <= 0) {
            setGameOver(true);
            store.submitGameResult("asteroids", {
              gameId: "asteroids",
              score: currentScore,
              completed: true,
              xpEarned: Math.round(currentScore * 0.8),
              achievementsUnlocked: currentScore >= 400 ? ["asteroid_miner"] : [],
            });
          }
        }
      }

      function createExplosion(x: number, y: number, color: string, count: number) {
        for (let i = 0; i < count; i++) {
          particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 20 + Math.random() * 15,
            color,
          });
        }
      }

      // Check next wave if all cleared
      if (asteroids.length === 0) {
        curLevel++;
        setLevel(curLevel);
        sound.play("powerup");
        spawnAsteroidWave(4 + curLevel);
      }

      // ========================================================
      // RENDER
      // ========================================================
      ctx.fillStyle = "#050508";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Starfield background
      ctx.fillStyle = "#ffffff30";
      for (let s = 0; s < 30; s++) {
        const sx = (s * 37) % canvas.width;
        const sy = (s * 79) % canvas.height;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Draw Particles
      particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.life > 10 ? 2 : 1, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Bullets
      bullets.forEach((b) => {
        ctx.fillStyle = b.isUfo ? "#f43f5e" : "#38bdf8";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.isUfo ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Asteroids (Vector Polygon)
      asteroids.forEach((ast) => {
        ctx.save();
        ctx.translate(ast.x, ast.y);
        ctx.rotate(ast.angle);
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ast.verts.forEach((v, i) => {
          if (i === 0) ctx.moveTo(v.x, v.y);
          else ctx.lineTo(v.x, v.y);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      });

      // Draw UFO Saucer
      if (ufo) {
        ctx.save();
        ctx.translate(ufo.x, ufo.y);
        ctx.strokeStyle = "#ec4899";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, -4, 7, Math.PI, 0);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Ship (Vector Jet)
      ctx.save();
      ctx.translate(shipX, shipY);
      ctx.rotate(shipAngle);

      // Ship body
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-12, -9);
      ctx.lineTo(-7, 0);
      ctx.lineTo(-12, 9);
      ctx.closePath();
      ctx.stroke();

      // Shield ring
      if (currentShield > 20) {
        ctx.strokeStyle = `rgba(56, 189, 248, ${currentShield / 160})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      if (!gameOver) animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      cancelAnimationFrame(animId);
    };
  }, [gameKey]);

  return (
    <GameShell
      id="asteroids"
      status={
        <>
          <Tag tone="purple">LIVES: {"🚀".repeat(lives)}</Tag>
          <Tag tone="blue">SHIELD {shield}%</Tag>
          <Tag tone="yellow">SECTOR {level}</Tag>
        </>
      }
      toolbar={
        <BrutButton variant="go" onClick={resetGame} className="text-xs py-1">
          🔄 RESTART (R)
        </BrutButton>
      }
    >
      <div className="flex h-full w-full flex-col items-center justify-between p-2 font-mono text-xs select-none">
        
        {/* Top Radar Bar */}
        <div className="flex w-full max-w-md items-center justify-between rounded border-2 border-lab-ink bg-stone-900 px-3 py-1.5 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <span className="font-bold text-amber-400">ASTEROIDS.EXE</span>
            <span>SCORE: <b className="text-emerald-400">{score}</b></span>
          </div>
          <span className="text-[10px] text-stone-400">HYPERSPACE [H]</span>
        </div>

        {/* Arcade Vector Canvas */}
        <div className="relative my-auto flex items-center justify-center rounded-lg border-4 border-lab-ink bg-black p-2 shadow-2xl">
          <canvas
            ref={canvasRef}
            className="rounded"
            style={{ width: "420px", height: "310px", maxWidth: "92vw" }}
          />

          {gameOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-4 text-center text-white space-y-3 rounded">
              <h3 className="font-display text-3xl text-rose-500 font-bold">SHIP DESTROYED 💥</h3>
              <p className="text-xs text-stone-300">Final Score: {score} · Sector reached: {level}</p>
              <BrutButton variant="go" onClick={resetGame} className="mt-2 text-xs py-1.5 px-4 font-bold">
                LAUNCH NEW SHIP
              </BrutButton>
            </div>
          )}
        </div>

        {/* Mobile / Touch Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }))}
            className="brut-sm bg-card px-3 py-1 text-xs font-bold border border-lab-ink"
          >
            ◄ TURN
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }))}
            className="brut-sm bg-amber-300 px-4 py-1 text-xs font-bold border border-lab-ink"
          >
            🔥 THRUST
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }))}
            className="brut-sm bg-card px-3 py-1 text-xs font-bold border border-lab-ink"
          >
            TURN ►
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }))}
            className="brut-sm bg-rose-500 text-white px-4 py-1 text-xs font-bold border border-lab-ink"
          >
            ⚡ FIRE
          </button>
        </div>

      </div>
    </GameShell>
  );
}

