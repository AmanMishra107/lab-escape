import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { useAutoPause, useRafLoop } from "../../hooks/useGameLoop";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

const W = 760;
const H = 320;
const GROUND = 250;

const OBSTACLES = ["PROF", "ASSGN", "75%", "CHAIR", "CABLE"];
const PICKUPS = ["☕", "A+", "✓", "WiFi"];

interface Ent {
  x: number;
  kind: "obs" | "pick";
  label: string;
  y: number;
  taken?: boolean;
}

export default function Runner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hidden = useAutoPause();
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const st = useRef({ y: GROUND, v: 0, speed: 5, ents: [] as Ent[], dist: 0, started: 0 });

  const reset = useCallback(() => {
    st.current = { y: GROUND, v: 0, speed: 5, ents: [], dist: 0, started: performance.now() };
    setScore(0);
    setOver(false);
    setRunning(true);
  }, []);

  const jump = useCallback(() => {
    if (!running) return reset();
    if (st.current.y >= GROUND) {
      st.current.v = -13;
      sound.play("key");
    }
  }, [running, reset]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump]);

  const end = useCallback((final: number) => {
    setRunning(false);
    setOver(true);
    sound.play("error");
    store.submitGameResult("runner", {
      score: final,
      accuracy: Math.min(1, final / 400),
      time: performance.now() - st.current.started,
      completed: true,
    });
  }, []);

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue("--lab-ink") || "#111";
    ctx.fillStyle = css.getPropertyValue("--screen") || "#123";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = css.getPropertyValue("--lab-green") || "#3d5";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, GROUND + 30);
    ctx.lineTo(W, GROUND + 30);
    ctx.stroke();

    const s = st.current;
    // student
    ctx.fillStyle = css.getPropertyValue("--lab-yellow") || "#fd0";
    ctx.strokeStyle = ink;
    ctx.fillRect(80, s.y - 34, 28, 34);
    ctx.strokeRect(80, s.y - 34, 28, 34);
    ctx.beginPath();
    ctx.arc(94, s.y - 46, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 16px monospace";
    s.ents.forEach((e) => {
      if (e.taken) return;
      ctx.fillStyle =
        e.kind === "obs" ? css.getPropertyValue("--lab-red") || "#f33" : css.getPropertyValue("--lab-blue") || "#39f";
      const w = ctx.measureText(e.label).width + 16;
      ctx.fillRect(e.x, e.y - 30, w, 30);
      ctx.strokeRect(e.x, e.y - 30, w, 30);
      ctx.fillStyle = ink;
      ctx.fillText(e.label, e.x + 8, e.y - 9);
    });
  }, []);

  useRafLoop(
    (dt) => {
      const s = st.current;
      const step = dt / 16.6;
      s.v += 0.72 * step;
      s.y = Math.min(GROUND, s.y + s.v * step);
      if (s.y >= GROUND) s.v = 0;
      s.speed = Math.min(12, 5 + s.dist / 2200);
      s.dist += s.speed * step;
      s.ents.forEach((e) => (e.x -= s.speed * step));
      s.ents = s.ents.filter((e) => e.x > -120);
      const last = s.ents[s.ents.length - 1];
      if (!last || last.x < W - 220 - Math.random() * 160) {
        const pick = Math.random() < 0.35;
        s.ents.push({
          x: W + 40,
          kind: pick ? "pick" : "obs",
          label: pick ? PICKUPS[Math.floor(Math.random() * PICKUPS.length)]! : OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)]!,
          y: pick ? GROUND - 70 : GROUND,
        });
      }
      for (const e of s.ents) {
        if (e.taken) continue;
        const hit = e.x < 118 && e.x + 70 > 80 && s.y - 46 < e.y && s.y > e.y - 34;
        if (!hit) continue;
        if (e.kind === "obs") return end(score);
        e.taken = true;
        sound.play("pop");
        setScore((v) => v + 25);
      }
      setScore((v) => (Math.floor(s.dist) % 60 === 0 ? v + 1 : v));
      draw();
    },
    running && !hidden,
  );

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <GameShell
      id="runner"
      paused={running && hidden}
      status={<Tag tone={over ? "red" : "green"}>{over ? "CAUGHT" : `SCORE ${score}`}</Tag>}
      toolbar={
        <BrutButton variant="go" onClick={reset}>
          {running ? "RESTART" : "START RUN"}
        </BrutButton>
      }
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={jump}
        className="brut max-h-full w-auto max-w-full touch-none bg-screen"
      />
    </GameShell>
  );
}
