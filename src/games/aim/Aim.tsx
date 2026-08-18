import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

const DURATION = 30_000;

export default function Aim() {
  const areaRef = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [size, setSize] = useState(64);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [left, setLeft] = useState(DURATION);
  const startedAt = useRef(0);

  const move = useCallback((h: number) => {
    setPos({ x: 8 + Math.random() * 84, y: 12 + Math.random() * 76 });
    setSize(Math.max(26, 64 - h * 1.6));
  }, []);

  const finish = useCallback(
    (h: number, m: number) => {
      setRunning(false);
      const accuracy = h + m ? h / (h + m) : 0;
      sound.play("success");
      store.submitGameResult("aim", {
        score: Math.max(0, Math.round(h * 20 * accuracy)),
        accuracy,
        time: DURATION,
        completed: true,
      });
      if (accuracy >= 0.9 && h >= 15) store.unlock("sharpshooter");
    },
    [],
  );

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => {
      const remaining = DURATION - (Date.now() - startedAt.current);
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        window.clearInterval(t);
        finish(hits, misses);
      }
    }, 100);
    return () => window.clearInterval(t);
  }, [running, hits, misses, finish]);

  const start = () => {
    setHits(0);
    setMisses(0);
    setLeft(DURATION);
    startedAt.current = Date.now();
    setRunning(true);
    move(0);
  };

  return (
    <GameShell
      id="aim"
      status={
        <>
          <Tag tone="green">HITS {hits}</Tag>
          <Tag tone="red">MISS {misses}</Tag>
          <Tag tone="blue">{(left / 1000).toFixed(1)}s</Tag>
        </>
      }
      toolbar={
        <BrutButton variant="go" onClick={start}>
          {running ? "RESTART" : "START 30s RUN"}
        </BrutButton>
      }
    >
      <div
        ref={areaRef}
        className="brut relative h-full w-full touch-none bg-screen"
        onPointerDown={() => {
          if (!running) return;
          setMisses((m) => m + 1);
          sound.play("error");
        }}
      >
        {running ? (
          <button
            aria-label="Target"
            className="absolute rounded-full border-4 border-lab-ink bg-lab-red"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: size, height: size, transform: "translate(-50%,-50%)" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              sound.play("pop");
              setHits((h) => {
                move(h + 1);
                return h + 1;
              });
            }}
          />
        ) : (
          <p className="mono-label absolute inset-0 flex items-center justify-center text-lab-green">
            30 SECONDS. CLICK THE DOT. IT SHRINKS.
          </p>
        )}
      </div>
    </GameShell>
  );
}
