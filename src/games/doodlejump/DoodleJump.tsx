import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

const W = 420;
const H = 640;
const PLAYER_W = 38;
const PLAYER_H = 46;
const GRAVITY = 0.42;
const JUMP_VELOCITY = -13.5;

type PlatformType = "normal" | "moving" | "fragile" | "disappearing" | "spring" | "trampoline";
type ItemType = "jetpack" | "propeller" | "spring_shoes" | "star";
type MonsterType = "alien" | "ufo" | "blackhole";

interface Platform {
  id: number;
  x: number;
  y: number;
  w: number;
  type: PlatformType;
  vx?: number;
  cracked?: boolean;
  opacity?: number;
}

interface Item {
  id: number;
  x: number;
  y: number;
  type: ItemType;
  taken: boolean;
}

interface Monster {
  id: number;
  x: number;
  y: number;
  vx: number;
  type: MonsterType;
  alive: boolean;
}

interface Bullet {
  x: number;
  y: number;
  vy: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

type Phase = "idle" | "running" | "over";

function generatePlatformChunk(startY: number, count: number): {
  platforms: Platform[];
  items: Item[];
  monsters: Monster[];
} {
  const platforms: Platform[] = [];
  const items: Item[] = [];
  const monsters: Monster[] = [];

  let y = startY;
  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let type: PlatformType = "normal";

    if (rand < 0.18) type = "moving";
    else if (rand < 0.32) type = "fragile";
    else if (rand < 0.42) type = "spring";
    else if (rand < 0.50) type = "trampoline";
    else if (rand < 0.58) type = "disappearing";

    const w = type === "moving" ? 75 : 65 + Math.random() * 30;
    const x = 20 + Math.random() * (W - w - 40);
    const platId = Date.now() + i * 17;

    platforms.push({
      id: platId,
      x,
      y,
      w,
      type,
      vx: type === "moving" ? (Math.random() > 0.5 ? 2.0 : -2.0) : 0,
      opacity: 1.0,
    });

    // Chance to spawn items on platform
    if (Math.random() < 0.16 && type !== "fragile" && type !== "disappearing") {
      const itemRand = Math.random();
      const itemType: ItemType =
        itemRand < 0.35 ? "jetpack" :
        itemRand < 0.65 ? "propeller" :
        itemRand < 0.85 ? "spring_shoes" : "star";

      items.push({
        id: platId + 1000,
        x: x + w / 2,
        y: y - 26,
        type: itemType,
        taken: false,
      });
    }

    // Chance to spawn floating monster
    if (Math.random() < 0.08 && Math.abs(y) > 1000) {
      monsters.push({
        id: platId + 2000,
        x: 40 + Math.random() * (W - 80),
        y: y - 80,
        vx: Math.random() > 0.5 ? 1.5 : -1.5,
        type: Math.random() > 0.5 ? "alien" : "ufo",
        alive: true,
      });
    }

    y -= 60 + Math.random() * 28;
  }

  return { platforms, items, monsters };
}

export default function DoodleJump() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const phaseRef = useRef<Phase>("idle");

  const st = useRef({
    px: W / 2 - PLAYER_W / 2,
    py: H - 140,
    pvx: 0,
    pvy: -12,
    facing: 1 as 1 | -1, // 1 = right, -1 = left
    cameraY: 0,
    maxHeight: 0,
    score: 0,
    platforms: [] as Platform[],
    items: [] as Item[],
    monsters: [] as Monster[],
    bullets: [] as Bullet[],
    particles: [] as Particle[],
    activePowerup: null as { type: "jetpack" | "propeller"; timer: number } | null,
    springShoesJumps: 0,
    eyeBlink: 0,
  });

  const setPhaseSync = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const shootBullet = useCallback(() => {
    if (phaseRef.current !== "running") return;
    const s = st.current;
    s.bullets.push({
      x: s.px + PLAYER_W / 2,
      y: s.py - 10,
      vy: -16,
    });
    sound.play("pop");
  }, []);

  const reset = useCallback(() => {
    const s = st.current;
    s.px = W / 2 - PLAYER_W / 2;
    s.py = H - 140;
    s.pvx = 0;
    s.pvy = -14;
    s.facing = 1;
    s.cameraY = 0;
    s.maxHeight = 0;
    s.score = 0;
    s.bullets = [];
    s.particles = [];
    s.activePowerup = null;
    s.springShoesJumps = 0;

    // Starting ground platform
    s.platforms = [
      { id: 1, x: W / 2 - 50, y: H - 80, w: 100, type: "normal", opacity: 1 },
    ];

    const initialChunk = generatePlatformChunk(H - 150, 45);
    s.platforms.push(...initialChunk.platforms);
    s.items = initialChunk.items;
    s.monsters = initialChunk.monsters;

    setScore(0);
    setPhaseSync("running");
  }, []);

  // Keyboard and shooting controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (phaseRef.current !== "running") return;
      const s = st.current;
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        s.pvx = -5.8;
        s.facing = -1;
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        s.pvx = 5.8;
        s.facing = 1;
      } else if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") {
        shootBullet();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const s = st.current;
      if (
        e.code === "ArrowLeft" || e.code === "KeyA" ||
        e.code === "ArrowRight" || e.code === "KeyD"
      ) {
        s.pvx = 0;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [shootBullet]);

  // Main Canvas & Game loop
  useEffect(() => {
    if (phase !== "running") return;
    let raf = 0;

    const loop = () => {
      if (phaseRef.current !== "running") return;
      const cv = canvasRef.current;
      const ctx = cv?.getContext("2d");
      if (!cv || !ctx) {
        raf = requestAnimationFrame(loop);
        return;
      }
      const s = st.current;

      // ── Step Physics ──
      if (s.activePowerup) {
        if (s.activePowerup.type === "jetpack") {
          s.pvy = -18;
          // Rocket flame particles
          s.particles.push({
            x: s.px + PLAYER_W / 2 + (Math.random() - 0.5) * 8,
            y: s.py + PLAYER_H,
            vx: (Math.random() - 0.5) * 3,
            vy: 4 + Math.random() * 4,
            color: Math.random() > 0.5 ? "#f97316" : "#facc15",
            size: 4 + Math.random() * 4,
            life: 15,
          });
        } else if (s.activePowerup.type === "propeller") {
          s.pvy = -12;
        }
        s.activePowerup.timer--;
        if (s.activePowerup.timer <= 0) {
          s.activePowerup = null;
        }
      } else {
        s.pvy = Math.min(15, s.pvy + GRAVITY);
      }

      s.px += s.pvx;
      s.py += s.pvy;
      s.eyeBlink++;

      // Edge Wrapping (Left <-> Right)
      if (s.px + PLAYER_W < 0) s.px = W;
      if (s.px > W) s.px = -PLAYER_W;

      // Smooth Camera Tracking (Moves upward when player passes mid-screen)
      const targetCameraY = (H / 2) - s.py;
      if (targetCameraY > s.cameraY) {
        const diff = targetCameraY - s.cameraY;
        s.cameraY += diff;
        s.score += Math.floor(diff);
        setScore(s.score);
        store.reduceBoredom(0.2);
      }

      // Step Bullets
      for (const b of s.bullets) {
        b.y += b.vy;
      }
      s.bullets = s.bullets.filter((b) => b.y + s.cameraY > -50);

      // Step Monsters
      for (const m of s.monsters) {
        if (!m.alive) continue;
        m.x += m.vx;
        if (m.x < 20 || m.x > W - 60) m.vx *= -1;

        // Check bullet hits on monster
        for (const b of s.bullets) {
          if (Math.abs(b.x - (m.x + 20)) < 24 && Math.abs((b.y) - (m.y + s.cameraY)) < 24) {
            m.alive = false;
            sound.play("powerup");
            // Monster explosion particles
            for (let pi = 0; pi < 12; pi++) {
              s.particles.push({
                x: m.x + 20,
                y: m.y + s.cameraY,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: "#a855f7",
                size: 4,
                life: 20,
              });
            }
          }
        }

        // Check player collision with monster
        if (m.alive) {
          const monsterScreenY = m.y + s.cameraY;
          if (
            s.px + PLAYER_W - 8 > m.x &&
            s.px + 8 < m.x + 40 &&
            s.py + PLAYER_H > monsterScreenY &&
            s.py < monsterScreenY + 40
          ) {
            if (s.pvy > 0 && s.py + PLAYER_H - s.pvy <= monsterScreenY + 12) {
              // Stomped on monster head!
              m.alive = false;
              s.pvy = JUMP_VELOCITY * 1.3;
              sound.play("powerup");
            } else if (!s.activePowerup) {
              // Monster hit player
              sound.play("error");
              setHighScore((prev) => Math.max(prev, s.score));
              setPhaseSync("over");
              store.saveGameResult({
                gameId: "doodlejump",
                score: s.score,
                completed: true,
                won: s.score > 4000,
                xpEarned: Math.floor(s.score / 15),
              });
              return;
            }
          }
        }
      }

      // Step Moving Platforms
      for (const p of s.platforms) {
        if (p.type === "moving" && p.vx) {
          p.x += p.vx;
          if (p.x < 15 || p.x + p.w > W - 15) p.vx *= -1;
        }
      }

      // Step Platform Collisions (Only when player is falling down)
      if (s.pvy > 0 && !s.activePowerup) {
        for (const p of s.platforms) {
          const platScreenY = p.y + s.cameraY;
          if (
            s.px + PLAYER_W - 6 > p.x &&
            s.px + 6 < p.x + p.w &&
            s.py + PLAYER_H >= platScreenY &&
            s.py + PLAYER_H - s.pvy <= platScreenY + 16
          ) {
            if (p.type === "fragile") {
              p.cracked = true;
              sound.play("glitch");
            } else if (p.type === "disappearing") {
              p.opacity = 0;
              s.pvy = JUMP_VELOCITY;
              sound.play("pop");
            } else if (p.type === "spring") {
              s.pvy = JUMP_VELOCITY * 1.6;
              sound.play("powerup");
            } else if (p.type === "trampoline") {
              s.pvy = JUMP_VELOCITY * 2.0;
              sound.play("powerup");
            } else {
              // Normal jump / Spring shoes boost
              if (s.springShoesJumps > 0) {
                s.pvy = JUMP_VELOCITY * 1.5;
                s.springShoesJumps--;
              } else {
                s.pvy = JUMP_VELOCITY;
              }
              sound.play("pop");
            }
          }
        }
      }

      // Step Items Pickup
      for (const item of s.items) {
        if (item.taken) continue;
        const itemScreenY = item.y + s.cameraY;
        if (
          Math.abs(s.px + PLAYER_W / 2 - item.x) < 32 &&
          Math.abs(s.py + PLAYER_H / 2 - itemScreenY) < 32
        ) {
          item.taken = true;
          if (item.type === "jetpack") {
            s.activePowerup = { type: "jetpack", timer: 140 };
            sound.play("powerup");
          } else if (item.type === "propeller") {
            s.activePowerup = { type: "propeller", timer: 160 };
            sound.play("powerup");
          } else if (item.type === "spring_shoes") {
            s.springShoesJumps = 6;
            sound.play("powerup");
          } else if (item.type === "star") {
            s.score += 350;
            sound.play("success");
          }
        }
      }

      // Generate more platform chunks as the player ascends
      const highestPlat = s.platforms.reduce((min, p) => (p.y < min ? p.y : min), 0);
      if (highestPlat + s.cameraY > -300) {
        const newChunk = generatePlatformChunk(highestPlat - 70, 20);
        s.platforms.push(...newChunk.platforms);
        s.items.push(...newChunk.items);
        s.monsters.push(...newChunk.monsters);
      }

      // Clean fallen platforms/items off screen
      s.platforms = s.platforms.filter((p) => p.y + s.cameraY < H + 100);
      s.items = s.items.filter((item) => item.y + s.cameraY < H + 100);
      s.monsters = s.monsters.filter((m) => m.y + s.cameraY < H + 100);

      // Step Particles
      for (const p of s.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
      }
      s.particles = s.particles.filter((p) => p.life > 0);

      // Fall Death Check
      if (s.py + s.cameraY > H + 60) {
        sound.play("error");
        setHighScore((prev) => Math.max(prev, s.score));
        setPhaseSync("over");
        store.saveGameResult({
          gameId: "doodlejump",
          score: s.score,
          completed: true,
          won: s.score > 4000,
          xpEarned: Math.floor(s.score / 15),
        });
        return;
      }

      // ── DRAW SCENE ──
      // Graph Paper Grid / Retro Notebook Paper background
      ctx.fillStyle = "#fefce8";
      ctx.fillRect(0, 0, W, H);

      // Notebook Graph Grid lines
      ctx.strokeStyle = "rgba(202, 138, 4, 0.14)";
      ctx.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 24) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      }
      const gridOffsetY = s.cameraY % 24;
      for (let gy = gridOffsetY; gy < H; gy += 24) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }

      // Left Margin Height Marks
      ctx.strokeStyle = "rgba(239, 68, 68, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(35, 0); ctx.lineTo(35, H); ctx.stroke();

      // ── Render Platforms ──
      for (const p of s.platforms) {
        const platY = p.y + s.cameraY;
        if (platY < -30 || platY > H + 30) continue;

        ctx.save();
        if (p.opacity !== undefined) ctx.globalAlpha = p.opacity;

        if (p.type === "normal") {
          // Classic Green Platform
          ctx.fillStyle = "#84cc16";
          ctx.strokeStyle = "#4d7c0f";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(p.x, platY, p.w, 14, 6);
          ctx.fill();
          ctx.stroke();
        } else if (p.type === "moving") {
          // Blue Moving Platform
          ctx.fillStyle = "#38bdf8";
          ctx.strokeStyle = "#0369a1";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(p.x, platY, p.w, 14, 6);
          ctx.fill();
          ctx.stroke();
        } else if (p.type === "fragile") {
          // Brown Cracked Wood Platform
          ctx.fillStyle = p.cracked ? "#78350f" : "#b45309";
          ctx.strokeStyle = "#451a03";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(p.x, platY, p.w, 14, 4);
          ctx.fill();
          ctx.stroke();
          // Crack lines
          ctx.strokeStyle = "#451a03";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.x + p.w / 2, platY);
          ctx.lineTo(p.x + p.w / 2 - 4, platY + 7);
          ctx.lineTo(p.x + p.w / 2 + 4, platY + 14);
          ctx.stroke();
        } else if (p.type === "spring") {
          // Green with Yellow Spring
          ctx.fillStyle = "#84cc16";
          ctx.strokeStyle = "#4d7c0f";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(p.x, platY, p.w, 14, 6);
          ctx.fill();
          ctx.stroke();

          // Spring Coil
          ctx.strokeStyle = "#71717a";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(p.x + p.w / 2 - 8, platY);
          ctx.lineTo(p.x + p.w / 2 + 8, platY - 4);
          ctx.lineTo(p.x + p.w / 2 - 8, platY - 8);
          ctx.lineTo(p.x + p.w / 2 + 8, platY - 12);
          ctx.stroke();
        } else if (p.type === "trampoline") {
          // Trampoline platform
          ctx.fillStyle = "#f97316";
          ctx.strokeStyle = "#9a3412";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(p.x, platY, p.w, 14, 4);
          ctx.fill();
          ctx.stroke();
        } else if (p.type === "disappearing") {
          // White Cloud Platform
          ctx.fillStyle = "#e2e8f0";
          ctx.strokeStyle = "#64748b";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(p.x, platY, p.w, 14, 6);
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      }

      // ── Render Items ──
      for (const item of s.items) {
        if (item.taken) continue;
        const itemY = item.y + s.cameraY;
        if (itemY < -30 || itemY > H + 30) continue;

        ctx.font = "22px sans-serif";
        ctx.textAlign = "center";
        if (item.type === "jetpack") ctx.fillText("🚀", item.x, itemY);
        else if (item.type === "propeller") ctx.fillText("🚁", item.x, itemY);
        else if (item.type === "spring_shoes") ctx.fillText("🥿", item.x, itemY);
        else if (item.type === "star") ctx.fillText("⭐", item.x, itemY);
      }

      // ── Render Monsters ──
      for (const m of s.monsters) {
        if (!m.alive) continue;
        const monsterY = m.y + s.cameraY;
        if (monsterY < -50 || monsterY > H + 50) continue;

        ctx.font = "32px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(m.type === "alien" ? "👾" : "🛸", m.x + 20, monsterY + 24);
      }

      // ── Render Bullets ──
      for (const b of s.bullets) {
        ctx.fillStyle = "#eab308";
        ctx.beginPath();
        ctx.arc(b.x, b.y + s.cameraY, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Render Particles ──
      for (const p of s.particles) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Render Doodle Character ──
      const screenPX = s.px;
      const screenPY = s.py + s.cameraY;

      ctx.save();
      ctx.translate(screenPX + PLAYER_W / 2, screenPY + PLAYER_H / 2);
      ctx.scale(s.facing, 1); // Flip character horizontally based on direction

      // Doodle Body (Cute Yellowish/Lime Creature with Snout)
      ctx.fillStyle = "#bef264";
      ctx.strokeStyle = "#4d7c0f";
      ctx.lineWidth = 3;

      // Feet
      ctx.fillStyle = "#84cc16";
      ctx.fillRect(-14, 18, 8, 8);
      ctx.fillRect(4, 18, 8, 8);

      // Body Oval
      ctx.fillStyle = "#bef264";
      ctx.beginPath();
      ctx.roundRect(-PLAYER_W / 2, -PLAYER_H / 2, PLAYER_W, PLAYER_H - 4, 16);
      ctx.fill();
      ctx.stroke();

      // Snout (Nose tube)
      ctx.beginPath();
      ctx.roundRect(10, -6, 16, 12, 6);
      ctx.fill();
      ctx.stroke();

      // Big Cute Cartoon Eyes
      const isBlinking = s.eyeBlink % 70 < 4;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(4, -10, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (!isBlinking) {
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.arc(6, -10, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Powerup Overlay (Propeller Hat or Jetpack on back)
      if (s.activePowerup?.type === "propeller") {
        ctx.font = "20px sans-serif";
        ctx.fillText("🚁", 0, -PLAYER_H / 2 - 4);
      } else if (s.activePowerup?.type === "jetpack") {
        ctx.font = "22px sans-serif";
        ctx.fillText("🚀", -12, 0);
      }

      ctx.restore();

      // ── Top Score Banner HUD ──
      ctx.fillStyle = "#1e293b";
      ctx.font = "900 24px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`⭐ ${s.score}`, 18, 36);

      if (s.springShoesJumps > 0) {
        ctx.font = "bold 13px monospace";
        ctx.fillStyle = "#8b5cf6";
        ctx.fillText(`🥿 ${s.springShoesJumps}x BOUNCE`, 18, 60);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (phaseRef.current !== "running") return;
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const canvasX = (clientX / rect.width) * W;
    const s = st.current;

    const diff = canvasX - (s.px + PLAYER_W / 2);
    s.pvx = Math.max(-6, Math.min(6, diff * 0.15));
    if (diff > 5) s.facing = 1;
    if (diff < -5) s.facing = -1;
  };

  return (
    <GameShell
      id="doodlejump"
      status={
        <>
          <Tag tone="blue">ALTITUDE {score}m</Tag>
          {highScore > 0 && <Tag tone="yellow">BEST {highScore}m</Tag>}
        </>
      }
      toolbar={
        phase !== "idle" ? (
          <div className="flex gap-2">
            <BrutButton onClick={shootBullet} variant="primary">🔫 SHOOT NOSE (SPACE)</BrutButton>
            <BrutButton onClick={reset} variant="warn">↺ RESTART</BrutButton>
          </div>
        ) : null
      }
    >
      <div className="relative flex h-full w-full items-center justify-center bg-amber-50 select-none">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="h-full max-h-full cursor-crosshair touch-none"
          style={{ maxWidth: "100%", objectFit: "contain" }}
          onPointerMove={handlePointerMove}
          onClick={shootBullet}
        />

        {/* Start Screen */}
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-amber-50/95 p-5 text-center overflow-y-auto">
            <span className="text-5xl animate-bounce">🐸</span>
            <h2 className="font-display text-3xl text-lime-700">DOODLE JUMP</h2>
            <p className="font-mono text-xs font-bold text-amber-800 tracking-wider">
              📜 OFFICIAL 2010s ACADEMY RULES
            </p>

            <div className="border-2 border-amber-400 bg-amber-100/90 p-3 rounded-md text-[11px] font-mono text-slate-800 space-y-1.5 max-w-sm text-left shadow-sm">
              <p className="font-bold text-slate-900 border-b border-amber-300 pb-1">🕹️ CONTROLS:</p>
              <p>• <strong>MOUSE / A & D / ARROWS:</strong> Steer left & right (wraps around screen edges!).</p>
              <p>• <strong>SPACE / W / UP / CLICK:</strong> Shoot nose cannon upward at monsters.</p>
              
              <p className="font-bold text-slate-900 border-b border-amber-300 pt-1 pb-1">🟩 PLATFORM RULES:</p>
              <p>• 🟢 <strong>Green:</strong> Standard solid bounce.</p>
              <p>• 🔵 <strong>Blue:</strong> Moving horizontally left & right.</p>
              <p>• 🟤 <strong>Brown:</strong> Cracked wood — breaks immediately upon step!</p>
              <p>• ⚪ <strong>White:</strong> Disappears after a single bounce.</p>
              <p>• 🟡 <strong>Spring:</strong> +60% Super high launch bounce.</p>
              <p>• 🟠 <strong>Trampoline:</strong> +100% Mega sky boost.</p>

              <p className="font-bold text-slate-900 border-b border-amber-300 pt-1 pb-1">🚀 POWERUPS & ENEMIES:</p>
              <p>• 🚀 <strong>Jetpack & 🚁 Propeller:</strong> Invincible high-speed ascent.</p>
              <p>• 🥿 <strong>Spring Shoes:</strong> 6x consecutive giant leaps.</p>
              <p>• 👾 <strong>Aliens & UFOs:</strong> Shoot them or stomp on their heads!</p>
            </div>

            <BrutButton onClick={reset} variant="primary" className="text-base px-7 py-2">
              ▶ HOP TO THE SKY
            </BrutButton>
          </div>
        )}

        {/* Game Over Screen */}
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-amber-50/95 p-6 text-center">
            <span className="text-5xl">💫</span>
            <h2 className="font-display text-3xl text-rose-600">FELL DOWN!</h2>
            <div className="font-mono">
              <p className="text-5xl font-bold text-slate-800">{score}m</p>
              <p className="text-xs text-slate-500 mt-1">BEST ALTITUDE {highScore}m</p>
            </div>
            <BrutButton onClick={reset} variant="warn" className="text-base px-6 py-2">
              ↺ PLAY AGAIN
            </BrutButton>
          </div>
        )}
      </div>
    </GameShell>
  );
}
