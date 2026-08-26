import { useEffect, useRef, useState } from "react";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../../components/ui/brut";
import { GameShell } from "../GameShell";

interface Block2D {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface SlicedChunk {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  vy: number;
  rot: number;
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

const LAYER_COLORS = [
  "#f43f5e", "#fb7185", "#f97316", "#fb923c", "#facc15", "#fde047",
  "#10b981", "#34d399", "#06b6d4", "#38bdf8", "#3b82f6", "#60a5fa",
  "#8b5cf6", "#a78bfa", "#ec4899", "#f472b6"
];

export default function Stack() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  const resetGame = () => {
    setScore(0);
    setCombo(0);
    setGameOver(false);
    setGameKey((k) => k + 1);
    sound.play("click");
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 340;
    canvas.height = 420;

    const blockHeight = 20;
    const baseWidth = 180;

    let stack: Block2D[] = [
      {
        x: (canvas.width - baseWidth) / 2,
        y: canvas.height - blockHeight * 2,
        width: baseWidth,
        height: blockHeight,
        color: LAYER_COLORS[0]!,
      },
    ];

    let curWidth = baseWidth;
    let curX = 0;
    let curDir = 1;
    let speed = 3.2;
    let curScore = 0;
    let curCombo = 0;
    let cameraOffsetY = 0;

    let debris: SlicedChunk[] = [];
    let particles: Particle[] = [];
    let animId: number;

    const spawnNextBlock = () => {
      curX = curDir === 1 ? -curWidth : canvas.width;
      speed = Math.min(7.0, 3.2 + curScore * 0.1);
    };

    spawnNextBlock();

    const dropBlock = () => {
      if (gameOver) return;
      const top = stack[stack.length - 1]!;
      const diff = curX - top.x;
      const tolerance = 4; // Perfect alignment threshold

      const currentY = top.y - blockHeight;

      if (Math.abs(diff) < tolerance) {
        // 🌟 PERFECT ALIGNMENT
        curX = top.x;
        curCombo++;
        curScore++;
        setScore(curScore);
        setCombo(curCombo);
        sound.play("powerup");

        // Bonus size expansion every 5 combos
        if (curCombo % 5 === 0) {
          curWidth = Math.min(baseWidth, curWidth + 12);
        }

        createConfetti(curX + curWidth / 2, currentY, LAYER_COLORS[curScore % LAYER_COLORS.length]!, 16);

        stack.push({
          x: curX,
          y: currentY,
          width: curWidth,
          height: blockHeight,
          color: LAYER_COLORS[curScore % LAYER_COLORS.length]!,
        });

        curDir *= -1;
        spawnNextBlock();
      } else if (diff > 0 && diff < curWidth) {
        // ✂️ OVERHANG ON RIGHT: slice off right part
        curCombo = 0;
        curScore++;
        setScore(curScore);
        setCombo(0);
        sound.play("pop");

        const overlap = curWidth - diff;
        const sliceWidth = diff;

        debris.push({
          x: curX + overlap,
          y: currentY,
          width: sliceWidth,
          height: blockHeight,
          color: LAYER_COLORS[curScore % LAYER_COLORS.length]!,
          vy: 2,
          rot: 0.05,
        });

        curWidth = overlap;
        stack.push({
          x: curX,
          y: currentY,
          width: curWidth,
          height: blockHeight,
          color: LAYER_COLORS[curScore % LAYER_COLORS.length]!,
        });

        curDir *= -1;
        spawnNextBlock();
      } else if (diff < 0 && Math.abs(diff) < curWidth) {
        // ✂️ OVERHANG ON LEFT: slice off left part
        curCombo = 0;
        curScore++;
        setScore(curScore);
        setCombo(0);
        sound.play("pop");

        const overlap = curWidth - Math.abs(diff);
        const sliceWidth = Math.abs(diff);

        debris.push({
          x: curX,
          y: currentY,
          width: sliceWidth,
          height: blockHeight,
          color: LAYER_COLORS[curScore % LAYER_COLORS.length]!,
          vy: 2,
          rot: -0.05,
        });

        curWidth = overlap;
        stack.push({
          x: top.x,
          y: currentY,
          width: curWidth,
          height: blockHeight,
          color: LAYER_COLORS[curScore % LAYER_COLORS.length]!,
        });

        curDir *= -1;
        spawnNextBlock();
      } else {
        // 💀 COMPLETE MISS
        sound.play("error");
        debris.push({
          x: curX,
          y: currentY,
          width: curWidth,
          height: blockHeight,
          color: LAYER_COLORS[curScore % LAYER_COLORS.length]!,
          vy: 3,
          rot: 0.08,
        });
        setGameOver(true);
        store.submitGameResult("stack", {
          gameId: "stack",
          score: curScore,
          completed: true,
          xpEarned: Math.round(curScore * 18),
          achievementsUnlocked: curScore >= 30 ? ["tower_architect"] : [],
        });
      }
    };

    function createConfetti(x: number, y: number, color: string, count: number) {
      for (let i = 0; i < count; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 20,
          color,
          size: 3.5,
        });
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        dropBlock();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    const gameLoop = () => {
      // 1. Move Active Block
      curX += speed * curDir;
      if (curDir === 1 && curX > canvas.width - curWidth + 30) {
        curDir = -1;
      } else if (curDir === -1 && curX < -30) {
        curDir = 1;
      }

      // 2. Update Falling Debris
      debris.forEach((d) => {
        d.y += d.vy;
        d.vy += 0.35;
      });
      debris = debris.filter((d) => d.y < canvas.height + 60);

      // 3. Update Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
      });
      particles = particles.filter((p) => p.life > 0);

      // 4. Smooth Camera Tracking
      const topBlock = stack[stack.length - 1]!;
      const targetOffset = Math.max(0, 180 - topBlock.y);
      cameraOffsetY += (targetOffset - cameraOffsetY) * 0.1;

      // ==========================================
      // RENDER 2D TOWER
      // ==========================================
      ctx.fillStyle = "#0c101c";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Background Grid & Stars
      ctx.strokeStyle = "#1e293b33";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Draw Stack Blocks
      stack.forEach((b) => {
        const renderY = b.y + cameraOffsetY;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, renderY, b.width, b.height);

        // Highlight stripe
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.fillRect(b.x, renderY, b.width, 3);

        // Outline border
        ctx.strokeStyle = "#00000050";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(b.x, renderY, b.width, b.height);
      });

      // Draw Falling Debris
      debris.forEach((d) => {
        const renderY = d.y + cameraOffsetY;
        ctx.fillStyle = d.color;
        ctx.fillRect(d.x, renderY, d.width, d.height);
      });

      // Draw Particles
      particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y + cameraOffsetY, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Active Moving Block
      if (!gameOver) {
        const activeColor = LAYER_COLORS[(curScore + 1) % LAYER_COLORS.length]!;
        const activeY = topBlock.y - blockHeight + cameraOffsetY;

        ctx.fillStyle = activeColor;
        ctx.fillRect(curX, activeY, curWidth, blockHeight);

        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillRect(curX, activeY, curWidth, 3);

        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 1.8;
        ctx.strokeRect(curX, activeY, curWidth, blockHeight);
      }

      if (!gameOver) animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(animId);
    };
  }, [gameKey]);

  return (
    <GameShell
      id="stack"
      status={
        <>
          <Tag tone="blue">FLOORS: {score}</Tag>
          <Tag tone={combo > 2 ? "green" : "yellow"}>STREAK: {combo} 🌟</Tag>
        </>
      }
      toolbar={
        <BrutButton variant="go" onClick={resetGame} className="text-xs py-1">
          🔄 RESTART (R)
        </BrutButton>
      }
    >
      <div className="flex h-full w-full flex-col items-center justify-between p-1 font-mono text-xs select-none">
        
        {/* Top Header */}
        <div className="flex w-full max-w-xs items-center justify-between rounded border-2 border-lab-ink bg-stone-900 px-3 py-1 text-white shadow-sm">
          <span className="font-bold text-amber-400">TOWER STACK</span>
          <span className="text-[10px] text-stone-400">SPACE / CLICK TO DROP</span>
        </div>

        {/* 2D Canvas Frame */}
        <div
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }))}
          className="relative my-auto flex items-center justify-center rounded-lg border-4 border-lab-ink bg-black p-1 shadow-2xl cursor-pointer"
        >
          <canvas
            ref={canvasRef}
            className="rounded"
            style={{ width: "300px", height: "350px", maxWidth: "90vw" }}
          />

          {gameOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-4 text-center text-white space-y-3 rounded">
              <h3 className="font-display text-3xl text-rose-500 font-bold">TOWER COLLAPSED! 🏢</h3>
              <p className="text-xs text-stone-300">Total Height: {score} Floors Built</p>
              <BrutButton variant="go" onClick={resetGame} className="mt-2 text-xs py-1.5 px-4 font-bold">
                REBUILD SKYSCRAPER
              </BrutButton>
            </div>
          )}
        </div>

        {/* Touch Drop Button */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }))}
          className="brut bg-amber-400 text-black px-8 py-1.5 text-xs font-bold border-2 border-lab-ink shadow-md active:scale-95"
        >
          🔻 TAP TO DROP BLOCK
        </button>

      </div>
    </GameShell>
  );
}
