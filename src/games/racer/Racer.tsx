import { useEffect, useRef, useState } from "react";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../../components/ui/brut";
import { GameShell } from "../GameShell";

interface TrafficVehicle {
  x: number;
  y: number;
  speed: number;
  lane: number;
  targetLane: number;
  color: string;
  width: number;
  height: number;
  type: "car" | "truck" | "police" | "sport";
  laneTimer: number;
}

interface ItemDrop {
  x: number;
  y: number;
  type: "coin" | "nitro" | "repair" | "shield";
  collected: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const CAR_MODELS = [
  { id: "viper",   name: "RED VIPER",    chassis: "#ef4444", stripe: "#ffffff", trim: "#991b1b" },
  { id: "phantom", name: "CYBER BOLT",   chassis: "#06b6d4", stripe: "#38bdf8", trim: "#0e7490" },
  { id: "stinger", name: "GOLD STINGER", chassis: "#eab308", stripe: "#18181b", trim: "#a16207" },
];

export default function Racer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [nitro, setNitro] = useState(100);
  const [health, setHealth] = useState(100);
  const [distanceM, setDistanceM] = useState(0);
  const [coins, setCoins] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [carIdx, setCarIdx] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  const resetGame = () => {
    setScore(0);
    setSpeedKmh(0);
    setNitro(100);
    setHealth(100);
    setDistanceM(0);
    setCoins(0);
    setMultiplier(1);
    setGameOver(false);
    setGameKey((k) => k + 1);
    sound.play("click");
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 360;
    canvas.height = 460;

    let playerX = 180;
    let playerY = 370;
    let playerVx = 0;
    let speed = 4.5;
    let targetSpeed = 4.5;
    let curNitro = 100;
    let isNitro = false;
    let curHealth = 100;
    let hasShield = false;
    let distance = 0;
    let curScore = 0;
    let curCoins = 0;
    let curMult = 1;
    let multResetTimer = 0;

    const roadL = 40;
    const roadR = 320;
    const laneWidth = (roadR - roadL) / 4;

    let roadOffset = 0;
    let traffic: TrafficVehicle[] = [];
    let drops: ItemDrop[] = [];
    let particles: Particle[] = [];
    let keys: Record<string, boolean> = {};
    let animId: number;

    const trafficColors = ["#f43f5e", "#3b82f6", "#10b981", "#8b5cf6", "#f97316", "#ffffff", "#0284c7"];

    function spawnTraffic() {
      const lane = Math.floor(Math.random() * 4);
      const laneX = roadL + lane * laneWidth + laneWidth / 2;
      const roll = Math.random();
      const isTruck = roll > 0.82;
      const isPolice = !isTruck && roll < 0.18;
      const isSport = !isTruck && !isPolice && roll < 0.45;

      const width = isTruck ? 34 : 26;
      const height = isTruck ? 68 : isSport ? 42 : 46;

      const overlap = traffic.some((t) => Math.abs(t.y + 100) < 120 && Math.abs(t.x - laneX) < 28);
      if (!overlap) {
        traffic.push({
          x: laneX,
          y: -100,
          lane,
          targetLane: lane,
          speed: isTruck ? 1.6 : isPolice ? 3.6 : isSport ? 3.2 : 2.2,
          color: isPolice ? "#0f172a" : isTruck ? "#475569" : trafficColors[Math.floor(Math.random() * trafficColors.length)]!,
          width,
          height,
          type: isTruck ? "truck" : isPolice ? "police" : isSport ? "sport" : "car",
          laneTimer: 120 + Math.random() * 180,
        });
      }
    }

    function spawnDrop() {
      const lane = Math.floor(Math.random() * 4);
      const laneX = roadL + lane * laneWidth + laneWidth / 2;
      const roll = Math.random();
      const type = roll > 0.85 ? "shield" : roll > 0.65 ? "repair" : roll > 0.45 ? "nitro" : "coin";
      drops.push({
        x: laneX,
        y: -50,
        type,
        collected: false,
      });
    }

    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      if (e.key === " " || e.key === "Shift") isNitro = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
      if (e.key === " " || e.key === "Shift") isNitro = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let trafficTimer = 0;
    let dropTimer = 0;

    const gameLoop = () => {
      // 1. Acceleration & Nitro
      if (keys["ArrowUp"] || keys["w"] || keys["W"]) {
        targetSpeed = isNitro && curNitro > 5 ? 12.0 : 8.5;
      } else if (keys["ArrowDown"] || keys["s"] || keys["S"]) {
        targetSpeed = 2.6; // Brakes
      } else {
        targetSpeed = isNitro && curNitro > 5 ? 10.5 : 5.5;
      }

      speed += (targetSpeed - speed) * 0.06;

      if (isNitro && curNitro > 0) {
        curNitro = Math.max(0, curNitro - 0.45);
        for (let i = 0; i < 2; i++) {
          particles.push({
            x: playerX - 9 + (Math.random() - 0.5) * 2,
            y: playerY + 22,
            vx: (Math.random() - 0.5) * 1.5,
            vy: 6 + Math.random() * 4,
            life: 12,
            color: Math.random() > 0.5 ? "#06b6d4" : "#38bdf8",
            size: 3,
          });
          particles.push({
            x: playerX + 9 + (Math.random() - 0.5) * 2,
            y: playerY + 22,
            vx: (Math.random() - 0.5) * 1.5,
            vy: 6 + Math.random() * 4,
            life: 12,
            color: Math.random() > 0.5 ? "#06b6d4" : "#38bdf8",
            size: 3,
          });
        }
      } else if (curNitro < 100) {
        curNitro = Math.min(100, curNitro + 0.08);
      }
      setNitro(Math.round(curNitro));

      // 2. Steering
      if (keys["ArrowLeft"] || keys["a"] || keys["A"]) playerVx -= 0.65;
      if (keys["ArrowRight"] || keys["d"] || keys["D"]) playerVx += 0.65;

      playerVx *= 0.84;
      playerX += playerVx;

      if (playerX < roadL + 16) { playerX = roadL + 16; playerVx = 0; }
      if (playerX > roadR - 16) { playerX = roadR - 16; playerVx = 0; }

      // Drift Smoke
      if (Math.abs(playerVx) > 2.0) {
        particles.push({
          x: playerX + (playerVx > 0 ? -12 : 12),
          y: playerY + 20,
          vx: -playerVx * 0.25,
          vy: 2,
          life: 10,
          color: "#cbd5e150",
          size: 4,
        });
      }

      // Progression
      distance += speed * 0.35;
      curScore += Math.round(speed * 0.8 * curMult);
      setScore(curScore);
      setDistanceM(Math.round(distance));
      setSpeedKmh(Math.round(speed * 22));

      if (multResetTimer > 0) {
        multResetTimer--;
        if (multResetTimer <= 0) {
          curMult = 1;
          setMultiplier(1);
        }
      }

      roadOffset = (roadOffset + speed) % 60;

      // 3. Traffic Spawner & Movement
      trafficTimer++;
      if (trafficTimer >= Math.max(28, 75 - speed * 3.5)) {
        trafficTimer = 0;
        spawnTraffic();
      }

      dropTimer++;
      if (dropTimer >= 150) {
        dropTimer = 0;
        spawnDrop();
      }

      traffic.forEach((t) => {
        t.y += speed - t.speed;

        t.laneTimer--;
        if (t.laneTimer <= 0) {
          t.laneTimer = 140 + Math.random() * 180;
          const shift = Math.random() > 0.5 ? 1 : -1;
          t.targetLane = Math.max(0, Math.min(3, t.lane + shift));
        }

        const targetX = roadL + t.targetLane * laneWidth + laneWidth / 2;
        t.x += (targetX - t.x) * 0.035;
      });

      // Handle item collection safely without throwing
      drops.forEach((d) => {
        d.y += speed;
        if (!d.collected && Math.hypot(playerX - d.x, playerY - d.y) < 28) {
          d.collected = true;
          sound.play("powerup");

          if (d.type === "coin") {
            curCoins += 10;
            curScore += 120;
            setCoins(curCoins);
          } else if (d.type === "nitro") {
            curNitro = Math.min(100, curNitro + 40);
            setNitro(Math.round(curNitro));
          } else if (d.type === "repair") {
            curHealth = Math.min(100, curHealth + 35);
            setHealth(Math.round(curHealth));
          } else if (d.type === "shield") {
            hasShield = true;
          }
        }
      });

      // 4. Vehicle Collisions & Close Passes
      const pW = 26;
      const pH = 46;

      traffic.forEach((t) => {
        const dx = Math.abs(playerX - t.x);
        const dy = Math.abs(playerY - t.y);

        // Crash
        if (dx < (pW + t.width) / 2.3 && dy < (pH + t.height) / 2.3) {
          handleCrash(t);
        }

        // Close Overtake Bonus
        if (dx < 34 && dy < 44 && !gameOver) {
          curMult = Math.min(5, curMult + 1);
          multResetTimer = 80;
          setMultiplier(curMult);
          curScore += 80 * curMult;
          sound.play("pop");
        }
      });

      traffic = traffic.filter((t) => t.y < canvas.height + 120 && t.y > -180);
      drops = drops.filter((d) => d.y < canvas.height + 80 && !d.collected);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
      });
      particles = particles.filter((p) => p.life > 0);

      function handleCrash(t: TrafficVehicle) {
        if (hasShield) {
          hasShield = false;
          sound.play("warn");
          createExplosion(playerX, playerY, "#38bdf8", 18);
          t.y += 100;
        } else {
          curHealth -= 35;
          setHealth(Math.max(0, Math.round(curHealth)));
          sound.play("error");
          createExplosion(playerX, playerY, "#ef4444", 22);
          t.y += 90;

          if (curHealth <= 0) {
            setGameOver(true);
            store.submitGameResult("racer", {
              gameId: "racer",
              score: curScore,
              completed: true,
              xpEarned: Math.round(curScore * 0.3),
              achievementsUnlocked: curScore >= 1800 ? ["speed_demon"] : [],
            });
          }
        }
      }

      function createExplosion(x: number, y: number, color: string, count: number) {
        for (let i = 0; i < count; i++) {
          particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 7,
            vy: (Math.random() - 0.5) * 7,
            life: 22,
            color,
            size: 4,
          });
        }
      }

      // ========================================================
      // RENDER
      // ========================================================
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Road Surface
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(roadL, 0, roadR - roadL, canvas.height);

      // Road Borders
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(roadL - 4, 0, 4, canvas.height);
      ctx.fillRect(roadR, 0, 4, canvas.height);

      // Kerb Stripes
      const stripeH = 26;
      for (let y = -stripeH + (roadOffset % (stripeH * 2)); y < canvas.height; y += stripeH * 2) {
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(roadL - 8, y, 4, stripeH);
        ctx.fillRect(roadR + 4, y, 4, stripeH);
      }

      // Lane Divider Dashes
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -roadOffset;

      for (let l = 1; l < 4; l++) {
        const lx = roadL + l * laneWidth;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, canvas.height);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw Drops
      drops.forEach((d) => {
        ctx.save();
        ctx.translate(d.x, d.y);
        if (d.type === "coin") {
          ctx.fillStyle = "#facc15";
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ca8a04";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (d.type === "nitro") {
          ctx.fillStyle = "#06b6d4";
          ctx.fillRect(-5, -8, 10, 16);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(-3, -10, 6, 3);
        } else if (d.type === "shield") {
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.stroke();
        } else if (d.type === "repair") {
          ctx.fillStyle = "#22c55e";
          ctx.fillRect(-2.5, -8, 5, 16);
          ctx.fillRect(-8, -2.5, 16, 5);
        }
        ctx.restore();
      });

      // Draw Particles
      particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Traffic
      traffic.forEach((t) => {
        ctx.save();
        ctx.translate(t.x, t.y);

        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(-t.width / 2 + 3, -t.height / 2 + 3, t.width, t.height);

        // Body
        ctx.fillStyle = t.color;
        ctx.fillRect(-t.width / 2, -t.height / 2, t.width, t.height);

        // Windows
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(-t.width / 2 + 3, -t.height / 4, t.width - 6, t.height / 2);

        // Tail Lights
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(-t.width / 2 + 2, t.height / 2 - 3, 4, 3);
        ctx.fillRect(t.width / 2 - 6, t.height / 2 - 3, 4, 3);

        // Police Siren
        if (t.type === "police") {
          const flash = Math.sin(distance * 0.25) > 0;
          ctx.fillStyle = flash ? "#38bdf8" : "#ef4444";
          ctx.fillRect(-4, -5, 8, 4);
        }

        ctx.restore();
      });

      // Draw Player Sports Car
      if (!gameOver) {
        const model = CAR_MODELS[carIdx]!;
        ctx.save();
        ctx.translate(playerX, playerY);

        // Soft Headlight Glow (Linear Gradient)
        try {
          const grad = ctx.createLinearGradient(0, -pH / 2, 0, -pH / 2 - 120);
          grad.addColorStop(0, "rgba(254, 240, 138, 0.25)");
          grad.addColorStop(1, "rgba(254, 240, 138, 0.0)");

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(-pW / 2 + 2, -pH / 2);
          ctx.lineTo(-pW / 2 - 25, -pH / 2 - 120);
          ctx.lineTo(pW / 2 + 25, -pH / 2 - 120);
          ctx.lineTo(pW / 2 - 2, -pH / 2);
          ctx.closePath();
          ctx.fill();
        } catch {
          /* skip gradient if canvas throws */
        }

        // Car Shadow
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(-pW / 2 + 3, -pH / 2 + 4, pW, pH);

        // Wheels
        ctx.fillStyle = "#09090b";
        ctx.fillRect(-pW / 2 - 2, -pH / 2 + 6, 3, 10);
        ctx.fillRect(pW / 2 - 1, -pH / 2 + 6, 3, 10);
        ctx.fillRect(-pW / 2 - 2, pH / 2 - 16, 3, 10);
        ctx.fillRect(pW / 2 - 1, pH / 2 - 16, 3, 10);

        // Chassis
        ctx.fillStyle = model.chassis;
        ctx.fillRect(-pW / 2, -pH / 2, pW, pH);

        // Racing Stripe
        ctx.fillStyle = model.stripe;
        ctx.fillRect(-3, -pH / 2, 6, pH);

        // Front Windshield & Rear Window
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(-pW / 2 + 3, -pH / 3, pW - 6, pH / 1.9);

        // Spoiler Wing
        ctx.fillStyle = model.trim;
        ctx.fillRect(-pW / 2 + 1, pH / 2 - 4, pW - 2, 4);

        // Headlights
        ctx.fillStyle = "#fef08a";
        ctx.fillRect(-pW / 2 + 2, -pH / 2, 4, 3);
        ctx.fillRect(pW / 2 - 6, -pH / 2, 4, 3);

        // Tail Lights
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(-pW / 2 + 2, pH / 2 - 3, 5, 3);
        ctx.fillRect(pW / 2 - 7, pH / 2 - 3, 5, 3);

        // Shield Bubble
        if (hasShield) {
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 28, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      if (!gameOver) animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      cancelAnimationFrame(animId);
    };
  }, [gameKey, carIdx]);

  return (
    <GameShell
      id="racer"
      status={
        <>
          <Tag tone="blue">{speedKmh} KM/H</Tag>
          <Tag tone={health > 35 ? "green" : "red"}>ARMOR {health}%</Tag>
          <Tag tone="yellow">NITRO {nitro}% ⚡</Tag>
          <Tag tone="purple">{coins} 🪙</Tag>
        </>
      }
      toolbar={
        <div className="flex gap-1">
          <BrutButton
            className="text-[10px] py-1 px-2"
            onClick={() => setCarIdx((s) => (s + 1) % CAR_MODELS.length)}
          >
            🏎️ {CAR_MODELS[carIdx]!.name}
          </BrutButton>
          <BrutButton variant="go" onClick={resetGame} className="text-xs py-1 px-3">
            🔄 RESTART (R)
          </BrutButton>
        </div>
      }
    >
      <div className="flex h-full w-full flex-col items-center justify-between p-1 font-mono text-xs select-none">
        
        {/* Top HUD */}
        <div className="flex w-full max-w-sm items-center justify-between rounded border-2 border-lab-ink bg-stone-900 px-3 py-1 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400">NIGHT RACER</span>
            <span>SCORE: <b className="text-emerald-400">{score}</b></span>
          </div>
          {multiplier > 1 && (
            <span className="animate-bounce font-black text-rose-400">OVERTAKE x{multiplier}! 🔥</span>
          )}
        </div>

        {/* Canvas Frame */}
        <div className="relative my-1 flex items-center justify-center rounded-lg border-4 border-lab-ink bg-black p-1 shadow-2xl">
          <canvas
            ref={canvasRef}
            className="rounded"
            style={{ width: "320px", height: "350px", maxWidth: "90vw" }}
          />

          {gameOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-4 text-center text-white space-y-3 rounded">
              <h3 className="font-display text-3xl text-rose-500 font-bold">TOTAL WRECK! 💥</h3>
              <p className="text-xs text-stone-300">Distance: {distanceM}m · Coins: {coins} · Score: {score}</p>
              <BrutButton variant="go" onClick={resetGame} className="mt-2 text-xs py-1.5 px-4 font-bold">
                RETRY HIGHWAY RUN
              </BrutButton>
            </div>
          )}
        </div>

        {/* Mobile / Touch Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }))}
            className="brut-sm bg-card px-4 py-1 text-xs font-bold border border-lab-ink"
          >
            ◄ LEFT
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }))}
            className="brut-sm bg-sky-400 text-black px-5 py-1 text-xs font-bold border border-lab-ink"
          >
            ⚡ NITRO
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }))}
            className="brut-sm bg-card px-4 py-1 text-xs font-bold border border-lab-ink"
          >
            RIGHT ►
          </button>
        </div>

      </div>
    </GameShell>
  );
}
