import { useEffect, useRef, useState } from "react";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../../components/ui/brut";
import { GameShell } from "../GameShell";

export default function Pong() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [mode, setMode] = useState<"bot" | "local">("bot");
  const [botDiff, setBotDiff] = useState<"easy" | "normal" | "hard">("normal");
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 500;
    canvas.height = 300;

    let p1Y = 110, p2Y = 110;
    const padW = 10, padH = 80;
    let bx = 250, by = 150;
    let bvx = Math.random() > 0.5 ? 4 : -4;
    let bvy = (Math.random() - 0.5) * 6;

    let score1 = 0, score2 = 0;
    let keys: Record<string, boolean> = {};
    let animId: number;

    const onKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const loop = () => {
      // P1 movement
      if (keys["w"] || keys["W"]) p1Y = Math.max(0, p1Y - 6);
      if (keys["s"] || keys["S"]) p1Y = Math.min(canvas.height - padH, p1Y + 6);

      // P2 / Bot movement
      if (mode === "local") {
        if (keys["ArrowUp"]) p2Y = Math.max(0, p2Y - 6);
        if (keys["ArrowDown"]) p2Y = Math.min(canvas.height - padH, p2Y + 6);
      } else {
        const botSpeed = botDiff === "hard" ? 5 : botDiff === "normal" ? 3.5 : 2;
        const targetY = by - padH / 2;
        if (p2Y < targetY) p2Y = Math.min(canvas.height - padH, p2Y + botSpeed);
        else if (p2Y > targetY) p2Y = Math.max(0, p2Y - botSpeed);
      }

      // Ball movement
      bx += bvx;
      by += bvy;

      // Top/Bottom bounce
      if (by <= 0 || by >= canvas.height - 10) bvy *= -1;

      // P1 Paddle Collision
      if (bx <= 20 && by + 10 >= p1Y && by <= p1Y + padH) {
        bvx = Math.abs(bvx) + 0.2;
        bvy += (Math.random() - 0.5) * 2;
        sound.play("pop");
      }

      // P2 Paddle Collision
      if (bx >= canvas.width - 30 && by + 10 >= p2Y && by <= p2Y + padH) {
        bvx = -Math.abs(bvx) - 0.2;
        bvy += (Math.random() - 0.5) * 2;
        sound.play("pop");
      }

      // Score check
      if (bx < 0) {
        score2 += 1;
        setP2Score(score2);
        bx = 250; by = 150; bvx = 4;
        sound.play("error");
      } else if (bx > canvas.width) {
        score1 += 1;
        setP1Score(score1);
        bx = 250; by = 150; bvx = -4;
        sound.play("success");
      }

      // Win check (First to 10)
      if (score1 >= 10 || score2 >= 10) {
        const wonP1 = score1 >= 10;
        setGameOver(true);
        setWinner(wonP1 ? "PLAYER 1 WINS!" : mode === "bot" ? "BOT WINS!" : "PLAYER 2 WINS!");
        store.submitGameResult("pong", {
          gameId: "pong",
          score: score1 * 30,
          completed: true,
          won: wonP1,
          difficulty: botDiff,
          xpEarned: wonP1 ? 200 : 60,
          achievementsUnlocked: wonP1 && mode === "bot" && botDiff === "hard" ? ["pong_champion"] : [],
        });
        return;
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Center dash line
      ctx.strokeStyle = "#27272a";
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(250, 0); ctx.lineTo(250, 300);
      ctx.stroke();

      // Paddles
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(10, p1Y, padW, padH);
      ctx.fillStyle = "#f43f5e";
      ctx.fillRect(canvas.width - 20, p2Y, padW, padH);

      // Ball
      ctx.fillStyle = "#facc15";
      ctx.fillRect(bx, by, 10, 10);

      if (!gameOver) animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      cancelAnimationFrame(animId);
    };
  }, [mode, botDiff]);

  return (
    <GameShell id="pong" status={<Tag tone="blue">PONG MATCH</Tag>}>
      <div className="flex h-full w-full flex-col justify-between p-2 font-mono text-xs">
        <div className="brut bg-stone-900 text-white p-2 flex justify-between items-center border-2 border-lab-ink">
          <span>P1: <b className="text-sky-400">{p1Score}</b></span>
          <div className="flex gap-1">
            <BrutButton className={`text-[9px] py-0.5 ${mode === "bot" ? "bg-amber-400 text-black" : ""}`} onClick={() => setMode("bot")}>🤖 BOT</BrutButton>
            <BrutButton className={`text-[9px] py-0.5 ${mode === "local" ? "bg-sky-400 text-black" : ""}`} onClick={() => setMode("local")}>👥 2P</BrutButton>
          </div>
          <span>P2: <b className="text-rose-400">{p2Score}</b></span>
        </div>

        <div className="relative flex-1 my-1 bg-black border-3 border-lab-ink rounded overflow-hidden flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
          {gameOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 text-white p-4 text-center space-y-3">
              <h3 className="font-display text-3xl text-emerald-400">{winner}</h3>
              <BrutButton variant="go" onClick={() => window.location.reload()}>
                PLAY AGAIN
              </BrutButton>
            </div>
          )}
        </div>

        <div className="border-t-2 border-lab-ink pt-1 text-[10px] text-center text-stone-600">
          CONTROLS: P1 (W / S), P2 (UP / DOWN ARROWS)
        </div>
      </div>
    </GameShell>
  );
}
