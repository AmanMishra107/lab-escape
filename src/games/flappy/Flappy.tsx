import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { useAutoPause, useRafLoop } from "../../hooks/useGameLoop";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

const W = 480;
const H = 640;
const GAP = 168;

interface Pipe {
  x: number;
  top: number;
  passed: boolean;
}

export default function Flappy() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hidden = useAutoPause();
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const st = useRef({ y: H / 2, v: 0, pipes: [] as Pipe[], t: 0, started: 0 });

  const reset = useCallback(() => {
    st.current = { y: H / 2, v: 0, pipes: [{ x: W + 60, top: 180, passed: false }], t: 0, started: performance.now() };
    setScore(0);
    setOver(false);
    setRunning(true);
  }, []);

  const flap = useCallback(() => {
    if (!running) return reset();
    st.current.v = -6.4;
    sound.play("key");
  }, [running, reset]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flap]);

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const css = getComputedStyle(document.documentElement);
    ctx.fillStyle = css.getPropertyValue("--screen") || "#123";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = css.getPropertyValue("--lab-green") || "#3d5";
    st.current.pipes.forEach((p) => {
      ctx.fillRect(p.x, 0, 62, p.top);
      ctx.fillRect(p.x, p.top + GAP, 62, H - p.top - GAP);
      ctx.strokeStyle = css.getPropertyValue("--lab-ink") || "#111";
      ctx.lineWidth = 4;
      ctx.strokeRect(p.x, 0, 62, p.top);
      ctx.strokeRect(p.x, p.top + GAP, 62, H - p.top - GAP);
    });
    // cursor "bird"
    ctx.save();
    ctx.translate(120, st.current.y);
    ctx.rotate(Math.max(-0.5, Math.min(0.9, st.current.v / 12)));
    ctx.fillStyle = css.getPropertyValue("--lab-paper") || "#eee";
    ctx.strokeStyle = css.getPropertyValue("--lab-ink") || "#111";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-10, -16);
    ctx.lineTo(-10, 18);
    ctx.lineTo(0, 8);
    ctx.lineTo(8, 22);
    ctx.lineTo(14, 18);
    ctx.lineTo(6, 4);
    ctx.lineTo(18, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }, []);

  const end = useCallback(
    (final: number) => {
      setRunning(false);
      setOver(true);
      sound.play("error");
      store.submitGameResult("flappy", {
        score: final,
        accuracy: Math.min(1, final / 20),
        time: performance.now() - st.current.started,
        completed: true,
      });
    },
    [],
  );

  useRafLoop(
    (dt) => {
      const s = st.current;
      const step = dt / 16.6;
      s.v = Math.min(11, s.v + 0.42 * step);
      s.y += s.v * step;
      s.t += dt;
      s.pipes.forEach((p) => (p.x -= 2.7 * step));
      if (s.pipes.length && s.pipes[s.pipes.length - 1]!.x < W - 220) {
        s.pipes.push({ x: W + 40, top: 70 + Math.random() * (H - GAP - 190), passed: false });
      }
      s.pipes = s.pipes.filter((p) => p.x > -80);
      for (const p of s.pipes) {
        if (!p.passed && p.x + 62 < 110) {
          p.passed = true;
          setScore((v) => v + 1);
          sound.play("pop");
        }
        const hitX = 110 < p.x + 62 && 134 > p.x;
        if (hitX && (s.y - 16 < p.top || s.y + 22 > p.top + GAP)) return end(score);
      }
      if (s.y > H - 12 || s.y < -40) return end(score);
      draw();
    },
    running && !hidden,
  );

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <GameShell
      id="flappy"
      paused={running && hidden}
      status={<Tag tone={over ? "red" : "green"}>{over ? "CRASHED" : `SCORE ${score}`}</Tag>}
      toolbar={
        <BrutButton variant="go" onClick={reset}>
          {running ? "RESTART" : "START"}
        </BrutButton>
      }
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={flap}
        className="brut max-h-full w-auto max-w-full touch-none bg-screen"
      />
    </GameShell>
  );
}
