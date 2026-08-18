import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { useAutoPause, useRafLoop } from "../../hooks/useGameLoop";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

const COLS = 22;
const ROWS = 18;
type P = { x: number; y: number };

export default function Snake() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hidden = useAutoPause();
  const [running, setRunning] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);

  const state = useRef({
    snake: [{ x: 8, y: 9 }] as P[],
    dir: { x: 1, y: 0 } as P,
    queued: [] as P[],
    food: { x: 14, y: 9 } as P,
    acc: 0,
    speed: 150,
    started: 0,
  });

  const reset = useCallback(() => {
    state.current = {
      snake: [{ x: 8, y: 9 }],
      dir: { x: 1, y: 0 },
      queued: [],
      food: { x: 14, y: 9 },
      acc: 0,
      speed: 150,
      started: performance.now(),
    };
    setScore(0);
    setOver(false);
    setRunning(true);
  }, []);

  const endGame = useCallback(
    (finalScore: number, ateSelf: boolean) => {
      setRunning(false);
      setOver(true);
      sound.play("error");
      if (ateSelf) store.findEgg("snake_self");
      const time = performance.now() - state.current.started;
      store.submitGameResult("snake", { score: finalScore, accuracy: Math.min(1, finalScore / 300), time, completed: true });
      if (finalScore >= 200) store.unlock("snake_god");
    },
    [],
  );

  const turn = useCallback((d: P) => {
    const q = state.current.queued;
    const last = q.length ? q[q.length - 1]! : state.current.dir;
    if (last.x === -d.x && last.y === -d.y) return;
    if (last.x === d.x && last.y === d.y) return;
    if (q.length < 2) q.push(d);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, P> = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 },
        s: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 },
      };
      const d = map[e.key] ?? map[e.key.toLowerCase()];
      if (d) {
        e.preventDefault();
        turn(d);
      }
      if (e.key === " ") {
        e.preventDefault();
        if (!running) reset();
        else setManualPause((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [turn, running, reset]);

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const cell = cv.width / COLS;
    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue("--lab-ink") || "#111";
    ctx.fillStyle = css.getPropertyValue("--screen") || "#123";
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, cv.height);
      ctx.stroke();
    }
    const { snake, food } = state.current;
    ctx.fillStyle = css.getPropertyValue("--lab-red") || "#f33";
    ctx.fillRect(food.x * cell + 2, food.y * cell + 2, cell - 4, cell - 4);
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? css.getPropertyValue("--lab-yellow") : css.getPropertyValue("--lab-green");
      ctx.fillRect(s.x * cell + 1, s.y * cell + 1, cell - 2, cell - 2);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(s.x * cell + 1, s.y * cell + 1, cell - 2, cell - 2);
    });
  }, []);

  useRafLoop(
    (dt) => {
      const st = state.current;
      st.acc += dt;
      if (st.acc < st.speed) return;
      st.acc = 0;
      const next = st.queued.shift();
      if (next) st.dir = next;
      const head = st.snake[0]!;
      const nh = { x: head.x + st.dir.x, y: head.y + st.dir.y };
      if (nh.x < 0 || nh.y < 0 || nh.x >= COLS || nh.y >= ROWS) {
        endGame(score, false);
        return;
      }
      if (st.snake.some((s) => s.x === nh.x && s.y === nh.y)) {
        endGame(score, true);
        return;
      }
      st.snake.unshift(nh);
      if (nh.x === st.food.x && nh.y === st.food.y) {
        sound.play("pop");
        setScore((s) => s + 10);
        st.speed = Math.max(65, st.speed - 4);
        let f: P;
        do {
          f = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
        } while (st.snake.some((s) => s.x === f.x && s.y === f.y));
        st.food = f;
      } else {
        st.snake.pop();
      }
      draw();
    },
    running && !hidden && !manualPause,
  );

  useEffect(() => {
    draw();
  }, [draw]);

  const touchStart = useRef<P | null>(null);

  return (
    <GameShell
      id="snake"
      paused={running && (hidden || manualPause)}
      status={<Tag tone={over ? "red" : "green"}>{over ? "GAME OVER" : `SCORE ${score}`}</Tag>}
      toolbar={
        <>
          <BrutButton variant="go" onClick={reset}>
            {over || !running ? "START" : "RESTART"}
          </BrutButton>
          <BrutButton onClick={() => setManualPause((p) => !p)} disabled={!running}>
            {manualPause ? "RESUME" : "PAUSE"}
          </BrutButton>
          <div className="ml-auto grid grid-cols-3 gap-1 sm:hidden">
            <span />
            <BrutButton aria-label="Up" onClick={() => turn({ x: 0, y: -1 })}>
              ▲
            </BrutButton>
            <span />
            <BrutButton aria-label="Left" onClick={() => turn({ x: -1, y: 0 })}>
              ◀
            </BrutButton>
            <BrutButton aria-label="Down" onClick={() => turn({ x: 0, y: 1 })}>
              ▼
            </BrutButton>
            <BrutButton aria-label="Right" onClick={() => turn({ x: 1, y: 0 })}>
              ▶
            </BrutButton>
          </div>
        </>
      }
    >
      <canvas
        ref={canvasRef}
        width={COLS * 24}
        height={ROWS * 24}
        className="brut max-h-full w-auto max-w-full touch-none bg-screen"
        onTouchStart={(e) => {
          const t = e.touches[0]!;
          touchStart.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          const s = touchStart.current;
          if (!s) return;
          const t = e.changedTouches[0]!;
          const dx = t.clientX - s.x;
          const dy = t.clientY - s.y;
          if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
          turn(Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) });
        }}
      />
    </GameShell>
  );
}
