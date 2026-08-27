import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

const W = 680;
const H = 380;
const GRAVITY = 0.58;
const JUMP_FORCE = -11.2;
const PLAYER_SIZE = 32;
const GROUND_Y = H - 65;
const LEVEL_LENGTH = 3200; // total distance in units

type Vehicle = "cube" | "ship" | "ball" | "ufo" | "wave";
const VEHICLE_COLORS: Record<Vehicle, { main: string; glow: string; border: string }> = {
  cube: { main: "#38bdf8", glow: "#0284c7", border: "#ffffff" },
  ship: { main: "#c084fc", glow: "#7e22ce", border: "#f3e8ff" },
  ball: { main: "#4ade80", glow: "#15803d", border: "#dcfce7" },
  ufo: { main: "#fb923c", glow: "#c2410c", border: "#ffedd5" },
  wave: { main: "#f43f5e", glow: "#9f1239", border: "#ffe4e6" },
};

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  type: "spike" | "triple_spike" | "hanging_spike" | "block" | "pad_yellow" | "pad_purple" | "orb_yellow" | "orb_blue";
}

interface Portal {
  x: number;
  toVehicle: Vehicle;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

interface TrailNode {
  x: number;
  y: number;
  alpha: number;
}

type Phase = "idle" | "running" | "over" | "victory";

// Generate a challenging Geometry Dash level pattern
function generateLevel(): { obstacles: Obstacle[]; portals: Portal[] } {
  const obstacles: Obstacle[] = [];
  const portals: Portal[] = [];

  let x = 400;

  // Segment 1: Cube Jump Training
  obstacles.push({ x: x, y: GROUND_Y, w: 26, h: 32, type: "spike" });
  x += 240;
  obstacles.push({ x: x, y: GROUND_Y, w: 32, h: 32, type: "block" });
  x += 180;
  obstacles.push({ x: x, y: GROUND_Y, w: 56, h: 32, type: "triple_spike" });
  x += 220;
  obstacles.push({ x: x, y: GROUND_Y - 45, w: 28, h: 28, type: "orb_yellow" });
  obstacles.push({ x: x + 10, y: GROUND_Y, w: 56, h: 32, type: "triple_spike" });
  x += 280;
  obstacles.push({ x: x, y: GROUND_Y, w: 32, h: 10, type: "pad_yellow" });
  obstacles.push({ x: x + 140, y: GROUND_Y, w: 32, h: 64, type: "block" });
  x += 320;

  // Portal 1: Ship Flight Mode
  portals.push({ x: x, toVehicle: "ship" });
  x += 160;
  // Ship obstacles (Ceiling and floor caverns)
  obstacles.push({ x: x, y: 0, w: 28, h: 70, type: "hanging_spike" });
  obstacles.push({ x: x + 120, y: GROUND_Y - 40, w: 28, h: 70, type: "spike" });
  obstacles.push({ x: x + 240, y: 0, w: 28, h: 80, type: "hanging_spike" });
  obstacles.push({ x: x + 340, y: GROUND_Y - 50, w: 28, h: 80, type: "spike" });
  x += 480;

  // Portal 2: Ball Mode (Gravity flipping on ground)
  portals.push({ x: x, toVehicle: "ball" });
  x += 160;
  obstacles.push({ x: x, y: GROUND_Y, w: 26, h: 32, type: "spike" });
  x += 180;
  obstacles.push({ x: x, y: GROUND_Y, w: 32, h: 32, type: "block" });
  obstacles.push({ x: x + 80, y: GROUND_Y, w: 26, h: 32, type: "spike" });
  x += 260;

  // Portal 3: UFO Flappy Mode
  portals.push({ x: x, toVehicle: "ufo" });
  x += 160;
  obstacles.push({ x: x, y: GROUND_Y - 40, w: 30, h: 80, type: "spike" });
  obstacles.push({ x: x + 140, y: 0, w: 30, h: 80, type: "hanging_spike" });
  obstacles.push({ x: x + 260, y: GROUND_Y - 40, w: 30, h: 80, type: "spike" });
  x += 420;

  // Final Climax: Cube Speed Run
  portals.push({ x: x, toVehicle: "cube" });
  x += 160;
  obstacles.push({ x: x, y: GROUND_Y, w: 32, h: 10, type: "pad_yellow" });
  obstacles.push({ x: x + 120, y: GROUND_Y - 55, w: 28, h: 28, type: "orb_yellow" });
  obstacles.push({ x: x + 130, y: GROUND_Y, w: 56, h: 32, type: "triple_spike" });
  x += 300;
  obstacles.push({ x: x, y: GROUND_Y, w: 56, h: 32, type: "triple_spike" });

  return { obstacles, portals };
}

export default function GeometryDash() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [percent, setPercent] = useState(0);
  const [attempts, setAttempts] = useState(1);
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle>("cube");
  const phaseRef = useRef<Phase>("idle");

  const st = useRef({
    px: 100,
    py: GROUND_Y,
    vy: 0,
    vehicle: "cube" as Vehicle,
    rotation: 0,
    onGround: true,
    gravityDir: 1 as 1 | -1,
    isHolding: false,
    cameraX: 0,
    speed: 6.2,
    obstacles: [] as Obstacle[],
    portals: [] as Portal[],
    particles: [] as Particle[],
    trail: [] as TrailNode[],
    bgHue: 280,
    shake: 0,
    progress: 0,
  });

  const setPhaseSync = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const jumpAction = useCallback((isDown = true) => {
    if (phaseRef.current !== "running") return;
    const s = st.current;
    s.isHolding = isDown;

    if (!isDown) return;

    // Check Orbs collision within range first!
    const orbRange = 40;
    const nearbyOrb = s.obstacles.find(
      (o) =>
        (o.type === "orb_yellow" || o.type === "orb_blue") &&
        Math.abs(s.px + PLAYER_SIZE / 2 - o.x) < orbRange &&
        Math.abs(s.py - o.y) < orbRange + 20
    );

    if (nearbyOrb) {
      if (nearbyOrb.type === "orb_yellow") {
        s.vy = JUMP_FORCE * 1.15;
        s.onGround = false;
        sound.play("powerup");
        return;
      } else if (nearbyOrb.type === "orb_blue") {
        s.gravityDir = (s.gravityDir * -1) as 1 | -1;
        s.vy = JUMP_FORCE * 0.8 * s.gravityDir;
        s.onGround = false;
        sound.play("powerup");
        return;
      }
    }

    // Vehicle specific jumps
    if (s.vehicle === "cube") {
      if (s.onGround) {
        s.vy = JUMP_FORCE * s.gravityDir;
        s.onGround = false;
        sound.play("key");
      }
    } else if (s.vehicle === "ball") {
      if (s.onGround) {
        s.gravityDir = (s.gravityDir * -1) as 1 | -1;
        s.vy = 4 * s.gravityDir;
        s.onGround = false;
        sound.play("pop");
      }
    } else if (s.vehicle === "ufo") {
      s.vy = -7.5 * s.gravityDir;
      sound.play("pop");
    }
  }, []);

  const releaseAction = useCallback(() => {
    st.current.isHolding = false;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        jumpAction(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        releaseAction();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [jumpAction, releaseAction]);

  const reset = useCallback(() => {
    const level = generateLevel();
    const s = st.current;
    s.px = 100;
    s.py = GROUND_Y;
    s.vy = 0;
    s.vehicle = "cube";
    s.rotation = 0;
    s.onGround = true;
    s.gravityDir = 1;
    s.isHolding = false;
    s.cameraX = 0;
    s.speed = 6.2;
    s.obstacles = level.obstacles;
    s.portals = level.portals;
    s.particles = [];
    s.trail = [];
    s.bgHue = 280;
    s.shake = 0;
    s.progress = 0;

    setCurrentVehicle("cube");
    setPercent(0);
    setPhaseSync("running");
  }, []);

  const triggerDeath = useCallback(() => {
    const s = st.current;
    s.shake = 18;

    // Explode into geometric square neon fragments
    const colors = ["#38bdf8", "#f43f5e", "#fbbf24", "#ffffff", "#c084fc"];
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      s.particles.push({
        x: s.px + PLAYER_SIZE / 2,
        y: s.py - PLAYER_SIZE / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)]!,
        life: 30 + Math.random() * 20,
        maxLife: 50,
      });
    }

    sound.play("error");
    setAttempts((a) => a + 1);
    setPhaseSync("over");
    store.saveGameResult({
      gameId: "geodash",
      score: Math.round(s.progress),
      completed: true,
      won: s.progress >= 95,
      xpEarned: Math.round(s.progress * 1.5),
    });
  }, []);

  // Main Geometry Dash rAF Render Loop
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
      s.px += s.speed;
      s.cameraX = s.px - 140;
      s.bgHue = (s.bgHue + 0.2) % 360;

      // Progress % calculation
      s.progress = Math.min(100, Math.round((s.px / LEVEL_LENGTH) * 100));
      setPercent(s.progress);

      // Check Victory
      if (s.px >= LEVEL_LENGTH) {
        setPhaseSync("victory");
        sound.play("success");
        store.saveGameResult({
          gameId: "geodash",
          score: 100,
          completed: true,
          won: true,
          xpEarned: 250,
        });
        return;
      }

      // Physics based on Vehicle type
      if (s.vehicle === "ship") {
        const shipLift = s.isHolding ? -0.55 : 0.45;
        s.vy = Math.max(-7.5, Math.min(7.5, s.vy + shipLift));
        s.py += s.vy;
        s.rotation = s.vy * 3.5;
        if (s.py > GROUND_Y) { s.py = GROUND_Y; s.vy = 0; }
        if (s.py < 40) { s.py = 40; s.vy = 0; }
      } else if (s.vehicle === "cube") {
        if (!s.onGround) {
          s.vy += GRAVITY * s.gravityDir;
          s.rotation += 8.5 * s.gravityDir;
        } else {
          // Snap rotation to nearest 90 degrees on ground
          s.rotation = Math.round(s.rotation / 90) * 90;
        }
        s.py += s.vy;
      } else if (s.vehicle === "ball") {
        s.vy += GRAVITY * 1.1 * s.gravityDir;
        s.py += s.vy;
        s.rotation += 9 * s.gravityDir;
      } else if (s.vehicle === "ufo") {
        s.vy += GRAVITY * 0.7 * s.gravityDir;
        s.py += s.vy;
        s.rotation = s.vy * 2.5;
      }

      // Ground & Ceiling Floor Bounds
      if (s.gravityDir === 1) {
        if (s.py >= GROUND_Y) {
          s.py = GROUND_Y;
          s.vy = 0;
          s.onGround = true;
        } else {
          s.onGround = false;
        }
      } else {
        // Inverted Gravity
        const ceilingY = 50 + PLAYER_SIZE;
        if (s.py <= ceilingY) {
          s.py = ceilingY;
          s.vy = 0;
          s.onGround = true;
        } else {
          s.onGround = false;
        }
      }

      // Record Neon Trail
      s.trail.push({ x: s.px, y: s.py - PLAYER_SIZE / 2, alpha: 1.0 });
      if (s.trail.length > 18) s.trail.shift();
      s.trail.forEach((t) => (t.alpha -= 0.05));

      // ── Portals Interaction ──
      for (const portal of s.portals) {
        if (Math.abs(s.px - portal.x) < 24) {
          if (s.vehicle !== portal.toVehicle) {
            s.vehicle = portal.toVehicle;
            setCurrentVehicle(portal.toVehicle);
            sound.play("powerup");
            // Portal transition flash
            for (let i = 0; i < 14; i++) {
              s.particles.push({
                x: portal.x,
                y: H / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: 4,
                color: VEHICLE_COLORS[portal.toVehicle].main,
                life: 25,
                maxLife: 25,
              });
            }
          }
        }
      }

      // ── Obstacle Hitbox Collision ──
      const px = s.px;
      const py = s.py;
      const pHalf = PLAYER_SIZE / 2;

      for (const ob of s.obstacles) {
        // Jump Pads interaction
        if (ob.type === "pad_yellow" || ob.type === "pad_purple") {
          if (Math.abs(px + pHalf - (ob.x + ob.w / 2)) < ob.w / 2 + 10 && Math.abs(py - ob.y) < 14) {
            s.vy = ob.type === "pad_yellow" ? JUMP_FORCE * 1.35 : JUMP_FORCE * 0.95;
            s.onGround = false;
            sound.play("pop");
            continue;
          }
        }

        // Spikes and deadly blocks collision
        if (ob.type === "spike" || ob.type === "triple_spike" || ob.type === "hanging_spike") {
          const spikePadding = 8;
          if (
            px + PLAYER_SIZE - spikePadding > ob.x &&
            px + spikePadding < ob.x + ob.w &&
            py - PLAYER_SIZE + spikePadding < ob.y + ob.h &&
            py > ob.y
          ) {
            triggerDeath();
            return;
          }
        } else if (ob.type === "block") {
          // Solid block collision
          if (
            px + PLAYER_SIZE > ob.x + 4 &&
            px < ob.x + ob.w - 4 &&
            py - PLAYER_SIZE < ob.y &&
            py > ob.y - ob.h + 10
          ) {
            // Check if landed on top
            if (s.vy > 0 && py - s.vy <= ob.y - ob.h + 6) {
              s.py = ob.y - ob.h;
              s.vy = 0;
              s.onGround = true;
            } else {
              // Frontal crash
              triggerDeath();
              return;
            }
          }
        }
      }

      // Screen Shake decay
      if (s.shake > 0) s.shake *= 0.85;

      // Particles step
      for (const p of s.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
      }
      s.particles = s.particles.filter((p) => p.life > 0);

      // ── DRAW SCENE ──
      ctx.save();
      if (s.shake > 0.5) {
        ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
      }

      // Background Gradient Pulse
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, `hsl(${s.bgHue}, 80%, 10%)`);
      bgGrad.addColorStop(0.6, `hsl(${s.bgHue + 40}, 85%, 16%)`);
      bgGrad.addColorStop(1, `hsl(${s.bgHue + 80}, 90%, 8%)`);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Cyber grid background lines
      ctx.strokeStyle = `hsla(${s.bgHue + 30}, 90%, 65%, 0.15)`;
      ctx.lineWidth = 1.5;
      const gridOffset = (s.cameraX * 0.4) % 60;
      for (let gx = -gridOffset; gx < W; gx += 60) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, H);
        ctx.stroke();
      }

      // Floor & Ceiling Platforms
      ctx.fillStyle = `hsl(${s.bgHue + 20}, 90%, 8%)`;
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
      ctx.fillStyle = `hsl(${s.bgHue + 40}, 100%, 60%)`;
      ctx.fillRect(0, GROUND_Y, W, 4); // Neon Floor line

      ctx.fillStyle = `hsl(${s.bgHue + 20}, 90%, 8%)`;
      ctx.fillRect(0, 0, W, 30);
      ctx.fillStyle = `hsl(${s.bgHue + 40}, 100%, 60%)`;
      ctx.fillRect(0, 26, W, 4); // Neon Ceiling line

      // ── Render Portals ──
      for (const p of s.portals) {
        const screenX = p.x - s.cameraX;
        if (screenX < -60 || screenX > W + 60) continue;

        const col = VEHICLE_COLORS[p.toVehicle].main;
        ctx.save();
        ctx.strokeStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(screenX, H / 2, 18, 55, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = "bold 10px monospace";
        ctx.fillStyle = col;
        ctx.textAlign = "center";
        ctx.fillText(p.toVehicle.toUpperCase(), screenX, H / 2 - 62);
        ctx.restore();
      }

      // ── Render Obstacles ──
      for (const ob of s.obstacles) {
        const screenX = ob.x - s.cameraX;
        if (screenX < -100 || screenX > W + 100) continue;

        if (ob.type === "spike" || ob.type === "triple_spike") {
          const spikeCount = ob.type === "triple_spike" ? 3 : 1;
          const sw = ob.w / spikeCount;
          for (let si = 0; si < spikeCount; si++) {
            const sx = screenX + si * sw;
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sx, GROUND_Y);
            ctx.lineTo(sx + sw / 2, GROUND_Y - ob.h);
            ctx.lineTo(sx + sw, GROUND_Y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Inner neon glow
            ctx.fillStyle = "#f43f5e";
            ctx.beginPath();
            ctx.moveTo(sx + 4, GROUND_Y - 2);
            ctx.lineTo(sx + sw / 2, GROUND_Y - ob.h + 6);
            ctx.lineTo(sx + sw - 4, GROUND_Y - 2);
            ctx.closePath();
            ctx.fill();
          }
        } else if (ob.type === "hanging_spike") {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(screenX, 30);
          ctx.lineTo(screenX + ob.w / 2, 30 + ob.h);
          ctx.lineTo(screenX + ob.w, 30);
          ctx.closePath();
          ctx.fill();
        } else if (ob.type === "block") {
          ctx.fillStyle = "#1e293b";
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 2.5;
          ctx.fillRect(screenX, ob.y - ob.h, ob.w, ob.h);
          ctx.strokeRect(screenX, ob.y - ob.h, ob.w, ob.h);
        } else if (ob.type === "pad_yellow" || ob.type === "pad_purple") {
          const padCol = ob.type === "pad_yellow" ? "#facc15" : "#c084fc";
          ctx.fillStyle = padCol;
          ctx.beginPath();
          ctx.roundRect(screenX, ob.y - 8, ob.w, 8, 4);
          ctx.fill();
        } else if (ob.type === "orb_yellow" || ob.type === "orb_blue") {
          const orbCol = ob.type === "orb_yellow" ? "#facc15" : "#38bdf8";
          ctx.save();
          ctx.strokeStyle = orbCol;
          ctx.shadowColor = orbCol;
          ctx.shadowBlur = 14;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(screenX + ob.w / 2, ob.y, 14, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = orbCol;
          ctx.beginPath();
          ctx.arc(screenX + ob.w / 2, ob.y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // ── Render Trail ──
      for (const t of s.trail) {
        const tx = t.x - s.cameraX;
        ctx.fillStyle = VEHICLE_COLORS[s.vehicle].main;
        ctx.globalAlpha = Math.max(0, t.alpha * 0.4);
        ctx.fillRect(tx, t.y, 6, 6);
      }
      ctx.globalAlpha = 1.0;

      // ── Render Player Vehicle ──
      const screenPX = s.px - s.cameraX;
      const screenPY = s.py - PLAYER_SIZE / 2;
      const vColor = VEHICLE_COLORS[s.vehicle];

      ctx.save();
      ctx.translate(screenPX + PLAYER_SIZE / 2, screenPY);
      ctx.rotate((s.rotation * Math.PI) / 180);

      ctx.shadowColor = vColor.glow;
      ctx.shadowBlur = 16;
      ctx.fillStyle = vColor.main;

      if (s.vehicle === "cube") {
        ctx.fillRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
        ctx.strokeStyle = vColor.border;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);

        // Cube Neon Face
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-6, -6, 5, 5);
        ctx.fillRect(2, -6, 5, 5);
        ctx.fillRect(-4, 3, 8, 3);
      } else if (s.vehicle === "ship") {
        ctx.beginPath();
        ctx.moveTo(PLAYER_SIZE / 2 + 4, 0);
        ctx.lineTo(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2);
        ctx.lineTo(-PLAYER_SIZE / 3, 0);
        ctx.lineTo(-PLAYER_SIZE / 2, PLAYER_SIZE / 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = vColor.border;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (s.vehicle === "ball") {
        ctx.beginPath();
        ctx.arc(0, 0, PLAYER_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = vColor.border;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else if (s.vehicle === "ufo") {
        ctx.beginPath();
        ctx.ellipse(0, 0, PLAYER_SIZE / 2 + 4, PLAYER_SIZE / 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, -PLAYER_SIZE / 4, PLAYER_SIZE / 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // ── Render Explosion Particles ──
      for (const p of s.particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(p.x - s.cameraX, p.y, p.size, p.size);
        ctx.restore();
      }

      // ── HUD: Top Level Progress Bar ──
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(W / 2 - 120, 10, 240, 14);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(W / 2 - 120, 10, 240, 14);

      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(W / 2 - 118, 12, 236 * (s.progress / 100), 10);

      ctx.font = "bold 10px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(`${s.progress}%`, W / 2, 21);

      ctx.restore();
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, triggerDeath]);

  return (
    <GameShell
      id="geodash"
      status={
        <>
          <Tag tone="blue">PROGRESS {percent}%</Tag>
          <Tag tone="yellow">ATTEMPT {attempts}</Tag>
          <Tag tone="red">{currentVehicle.toUpperCase()}</Tag>
        </>
      }
      toolbar={
        phase !== "idle" ? (
          <BrutButton onClick={reset} variant="warn">↺ RETRY RUN</BrutButton>
        ) : null
      }
    >
      <div className="relative flex h-full w-full items-center justify-center bg-black select-none">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="h-full max-h-full cursor-pointer touch-none"
          style={{ maxWidth: "100%", objectFit: "contain" }}
          onMouseDown={() => jumpAction(true)}
          onMouseUp={releaseAction}
          onTouchStart={(e) => { e.preventDefault(); jumpAction(true); }}
          onTouchEnd={releaseAction}
        />

        {/* Start / Idle Screen */}
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/90 p-6 text-center">
            <span className="text-6xl animate-bounce">🔲</span>
            <h2 className="font-display text-4xl text-sky-400">GEOMETRY DASH</h2>
            <p className="font-mono text-sm font-bold text-amber-300">
              ⚡ RHYTHM PLATFORMER ADVENTURE
            </p>
            <div className="border-2 border-slate-700 bg-slate-900/80 p-3.5 rounded text-xs font-mono text-slate-300 space-y-1.5 max-w-sm">
              <p>🔲 <strong>SPACE / CLICK / TAP</strong> to Jump or Fly.</p>
              <p>🌀 Portals transform your vehicle (<strong>Cube, Ship, Ball, UFO</strong>).</p>
              <p>🟡 Yellow Orbs: Tap in mid-air for double jump boost!</p>
            </div>
            <BrutButton onClick={reset} variant="primary" className="text-base px-6 py-2.5">
              ▶ START ATTEMPT #1
            </BrutButton>
          </div>
        )}

        {/* Game Over Screen */}
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/95 p-6 text-center">
            <span className="text-5xl">💥</span>
            <h2 className="font-display text-3xl text-rose-500">CRASHED!</h2>
            <div className="font-mono">
              <p className="text-5xl font-bold text-white">{percent}%</p>
              <p className="text-xs text-slate-400 mt-1">ATTEMPT #{attempts}</p>
            </div>
            <BrutButton onClick={reset} variant="warn" className="text-base px-6 py-2">
              ↺ RETRY (SPACE)
            </BrutButton>
          </div>
        )}

        {/* Victory Screen */}
        {phase === "victory" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/95 p-6 text-center animate-fade-in">
            <span className="text-6xl">🏆</span>
            <h2 className="font-display text-4xl text-amber-400">100% COMPLETE!</h2>
            <p className="font-mono text-base text-sky-300">
              You conquered the entire Geometry Dash track in {attempts} attempt(s)!
            </p>
            <BrutButton onClick={reset} variant="primary" className="text-base px-6 py-2.5">
              ↺ PLAY AGAIN
            </BrutButton>
          </div>
        )}
      </div>
    </GameShell>
  );
}
