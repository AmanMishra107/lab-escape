import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

type Diff = "easy" | "medium" | "hard";
const CONFIG: Record<Diff, { c: number; r: number; m: number }> = {
  easy: { c: 9, r: 9, m: 10 },
  medium: { c: 12, r: 12, m: 24 },
  hard: { c: 16, r: 14, m: 44 },
};

interface Cell {
  mine: boolean;
  open: boolean;
  flag: boolean;
  n: number;
}

function build(diff: Diff, safeIndex: number): Cell[] {
  const { c, r, m } = CONFIG[diff];
  const total = c * r;
  const cells: Cell[] = Array.from({ length: total }, () => ({ mine: false, open: false, flag: false, n: 0 }));
  let placed = 0;
  while (placed < m) {
    const i = Math.floor(Math.random() * total);
    if (i === safeIndex || cells[i]!.mine) continue;
    cells[i]!.mine = true;
    placed++;
  }
  for (let i = 0; i < total; i++) {
    if (cells[i]!.mine) continue;
    const x = i % c;
    const y = Math.floor(i / c);
    let n = 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= c || ny >= r) continue;
        if (cells[ny * c + nx]!.mine) n++;
      }
    cells[i]!.n = n;
  }
  return cells;
}

export default function Minesweeper() {
  const [diff, setDiff] = useState<Diff>("easy");
  const [cells, setCells] = useState<Cell[]>([]);
  const [state, setState] = useState<"idle" | "playing" | "won" | "lost">("idle");
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);
  const cfg = CONFIG[diff];

  useEffect(() => {
    setCells([]);
    setState("idle");
    setElapsed(0);
  }, [diff]);

  useEffect(() => {
    if (state !== "playing") return;
    const t = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 500);
    return () => window.clearInterval(t);
  }, [state]);

  const finish = useCallback(
    (won: boolean, board: Cell[]) => {
      setState(won ? "won" : "lost");
      sound.play(won ? "success" : "error");
      const time = Date.now() - startedAt.current;
      const opened = board.filter((c) => c.open && !c.mine).length;
      const safeTotal = board.length - cfg.m;
      const base = won ? cfg.m * 20 + Math.max(0, 400 - Math.floor(time / 1000) * 2) : opened * 3;
      store.submitGameResult("minesweeper", {
        score: base,
        accuracy: safeTotal ? opened / safeTotal : 0,
        time,
        completed: won,
      });
      if (won && diff === "hard") store.unlock("sweeper");
    },
    [cfg.m, diff],
  );

  const open = (index: number) => {
    let board = cells;
    if (state === "idle" || board.length === 0) {
      board = build(diff, index);
      startedAt.current = Date.now();
      setState("playing");
      if (board[index]!.mine) store.findEgg("mine_first_click");
    } else if (state !== "playing") return;

    const next = board.map((c) => ({ ...c }));
    const cell = next[index]!;
    if (cell.flag || cell.open) return;
    if (cell.mine) {
      next.forEach((c) => {
        if (c.mine) c.open = true;
      });
      setCells(next);
      store.findEgg("mine_first_click");
      finish(false, next);
      return;
    }
    // flood fill
    const stack = [index];
    while (stack.length) {
      const i = stack.pop()!;
      const c = next[i]!;
      if (c.open || c.flag) continue;
      c.open = true;
      if (c.n === 0) {
        const x = i % cfg.c;
        const y = Math.floor(i / cfg.c);
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= cfg.c || ny >= cfg.r) continue;
            const ni = ny * cfg.c + nx;
            if (!next[ni]!.open && !next[ni]!.mine) stack.push(ni);
          }
      }
    }
    sound.play("click");
    setCells(next);
    const remaining = next.filter((c) => !c.mine && !c.open).length;
    if (remaining === 0) finish(true, next);
  };

  const flag = (index: number) => {
    if (state !== "playing") return;
    setCells((cs) => cs.map((c, i) => (i === index && !c.open ? { ...c, flag: !c.flag } : c)));
    sound.play("pop");
  };

  const flags = cells.filter((c) => c.flag).length;
  const longPress = useRef<number | null>(null);
  const view = cells.length ? cells : Array.from({ length: cfg.c * cfg.r }, () => ({ mine: false, open: false, flag: false, n: 0 }));

  return (
    <GameShell
      id="minesweeper"
      status={
        <>
          <Tag tone="red">MINES {cfg.m - flags}</Tag>
          <Tag tone="blue">{elapsed}s</Tag>
          {state === "won" && <Tag tone="green">CLEARED</Tag>}
          {state === "lost" && <Tag tone="red">BOOM</Tag>}
        </>
      }
      toolbar={
        <>
          {(Object.keys(CONFIG) as Diff[]).map((d) => (
            <BrutButton key={d} variant={d === diff ? "primary" : "default"} onClick={() => setDiff(d)}>
              {d.toUpperCase()}
            </BrutButton>
          ))}
          <BrutButton
            variant="go"
            onClick={() => {
              setCells([]);
              setState("idle");
              setElapsed(0);
            }}
          >
            NEW BOARD
          </BrutButton>
        </>
      }
    >
      <div
        className="grid max-h-full max-w-full gap-[2px] overflow-auto border-3 border-lab-ink bg-lab-ink p-[2px]"
        style={{ gridTemplateColumns: `repeat(${cfg.c}, minmax(0, 1fr))` }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {view.map((c, i) => (
          <button
            key={i}
            aria-label={`cell ${i + 1}${c.open ? `, ${c.mine ? "mine" : c.n + " neighbours"}` : c.flag ? ", flagged" : ""}`}
            className={`mono-label flex h-7 w-7 items-center justify-center text-[11px] sm:h-8 sm:w-8 ${
              c.open ? (c.mine ? "bg-lab-red text-lab-paper" : "bg-background") : "bg-muted hover:bg-secondary"
            }`}
            onContextMenu={(e) => {
              e.preventDefault();
              flag(i);
            }}
            onTouchStart={() => {
              longPress.current = window.setTimeout(() => {
                flag(i);
                longPress.current = null;
              }, 400);
            }}
            onTouchEnd={(e) => {
              if (longPress.current) {
                window.clearTimeout(longPress.current);
                longPress.current = null;
                e.preventDefault();
                open(i);
              }
            }}
            onClick={() => open(i)}
          >
            {c.open ? (c.mine ? "✱" : c.n || "") : c.flag ? "⚑" : ""}
          </button>
        ))}
      </div>
    </GameShell>
  );
}
