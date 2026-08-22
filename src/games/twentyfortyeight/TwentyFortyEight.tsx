import { useCallback, useEffect, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

// ─── Game Logic ────────────────────────────────────────────────────────────────
type Row = [number, number, number, number];
type Board = [Row, Row, Row, Row];

function emptyBoard(): Board {
  return [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
}

function addTile(board: Board): Board {
  const empty: [number, number][] = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (board[r]![c] === 0) empty.push([r, c]);
  if (!empty.length) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)]!;
  const nb = board.map((row) => [...row]) as Board;
  nb[r!]![c!] = Math.random() < 0.9 ? 2 : 4;
  return nb;
}

function slideRow(row: Row): { row: Row; score: number } {
  const nums = row.filter((x) => x !== 0);
  let score = 0;
  const merged: number[] = [];
  let i = 0;
  while (i < nums.length) {
    if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
      const val = nums[i]! * 2;
      merged.push(val);
      score += val;
      i += 2;
    } else {
      merged.push(nums[i]!);
      i++;
    }
  }
  while (merged.length < 4) merged.push(0);
  return { row: merged as Row, score };
}

type Direction = "left" | "right" | "up" | "down";

function move(board: Board, dir: Direction): { board: Board; score: number; moved: boolean } {
  let nb = board.map((row) => [...row]) as Board;
  let totalScore = 0;
  let moved = false;

  const slideAndCheck = (row: Row): { row: Row; score: number } => {
    const original = [...row];
    const result = slideRow(row);
    if (result.row.some((v, i) => v !== original[i])) moved = true;
    totalScore += result.score;
    return result;
  };

  if (dir === "left") {
    nb = nb.map((row) => slideAndCheck(row).row) as Board;
  } else if (dir === "right") {
    nb = nb.map((row) => {
      const r = slideAndCheck([...row].reverse() as Row);
      return r.row.reverse() as Row;
    }) as Board;
  } else if (dir === "up") {
    for (let c = 0; c < 4; c++) {
      const col = [nb[0]![c], nb[1]![c], nb[2]![c], nb[3]![c]] as Row;
      const result = slideAndCheck(col);
      for (let r = 0; r < 4; r++) nb[r]![c] = result.row[r]!;
    }
  } else {
    for (let c = 0; c < 4; c++) {
      const col = [nb[3]![c], nb[2]![c], nb[1]![c], nb[0]![c]] as Row;
      const result = slideAndCheck(col);
      const rev = result.row.reverse();
      for (let r = 0; r < 4; r++) nb[r]![c] = rev[r]!;
    }
  }

  return { board: nb, score: totalScore, moved };
}

function isGameOver(board: Board): boolean {
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      if (board[r]![c] === 0) return false;
      if (c < 3 && board[r]![c] === board[r]![c + 1]) return false;
      if (r < 3 && board[r]![c] === board[r + 1]![c]) return false;
    }
  return true;
}

function hasWon(board: Board): boolean {
  return board.some((row) => row.includes(2048));
}

// ─── Tile Colours ───────────────────────────────────────────────────────────
const TILE_STYLE: Record<number, { bg: string; color: string; size: string }> = {
  0:    { bg: "#1e293b",  color: "#1e293b",  size: "text-2xl" },
  2:    { bg: "#eee4da",  color: "#776e65",  size: "text-2xl" },
  4:    { bg: "#ede0c8",  color: "#776e65",  size: "text-2xl" },
  8:    { bg: "#f2b179",  color: "#f9f6f2",  size: "text-2xl" },
  16:   { bg: "#f59563",  color: "#f9f6f2",  size: "text-2xl" },
  32:   { bg: "#f67c5f",  color: "#f9f6f2",  size: "text-2xl" },
  64:   { bg: "#f65e3b",  color: "#f9f6f2",  size: "text-2xl" },
  128:  { bg: "#edcf72",  color: "#f9f6f2",  size: "text-xl"  },
  256:  { bg: "#edcc61",  color: "#f9f6f2",  size: "text-xl"  },
  512:  { bg: "#edc850",  color: "#f9f6f2",  size: "text-xl"  },
  1024: { bg: "#edc53f",  color: "#f9f6f2",  size: "text-lg"  },
  2048: { bg: "#edc22e",  color: "#f9f6f2",  size: "text-lg"  },
};

function tileStyle(val: number) {
  return TILE_STYLE[val] ?? { bg: "#3c3a32", color: "#f9f6f2", size: "text-base" };
}

// ─── Component ─────────────────────────────────────────────────────────────
function init(): Board {
  return addTile(addTile(emptyBoard()));
}

export default function TwentyFortyEight() {
  const [board, setBoard] = useState<Board>(init);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [won, setWon] = useState(false);
  const [over, setOver] = useState(false);
  const [wonDismissed, setWonDismissed] = useState(false);

  const reset = () => {
    setBoard(init());
    setScore(0);
    setWon(false);
    setOver(false);
    setWonDismissed(false);
  };

  const doMove = useCallback(
    (dir: Direction) => {
      if (over) return;
      const result = move(board, dir);
      if (!result.moved) return;
      sound.play("click");
      store.interacted();
      const next = addTile(result.board);
      setBoard(next);
      const ns = score + result.score;
      setScore(ns);
      setBest((b) => {
        const nb = Math.max(b, ns);
        if (nb > b) store.submitGameResult("twentyfortyeight", { score: nb, accuracy: 1, time: 1, completed: false });
        return nb;
      });
      if (!won && hasWon(next)) { setWon(true); sound.play("success"); }
      if (isGameOver(next)) { setOver(true); sound.play("error"); store.submitGameResult("twentyfortyeight", { score: ns, accuracy: 1, time: 1, completed: true }); }
    },
    [over, won, score, board],
  );

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
        a: "left", d: "right", w: "up", s: "down",
        A: "left", D: "right", W: "up", S: "down",
      };
      const dir = map[e.key];
      if (dir) { e.preventDefault(); doMove(dir); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doMove]);

  // Touch swipe
  useEffect(() => {
    let startX = 0, startY = 0;
    const onStart = (e: TouchEvent) => { startX = e.touches[0]!.clientX; startY = e.touches[0]!.clientY; };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0]!.clientX - startX;
      const dy = e.changedTouches[0]!.clientY - startY;
      if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? "right" : "left");
      else doMove(dy > 0 ? "down" : "up");
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => { window.removeEventListener("touchstart", onStart); window.removeEventListener("touchend", onEnd); };
  }, [doMove]);

  return (
    <GameShell
      id="twentyfortyeight"
      status={
        <>
          <Tag tone="blue">SCORE {score}</Tag>
          <Tag tone="yellow">BEST {best}</Tag>
        </>
      }
      toolbar={
        <BrutButton variant="go" onClick={reset}>NEW GAME</BrutButton>
      }
    >
      <div className="flex flex-col items-center gap-3 select-none">
        {/* Rules banner */}
        <p className="mono-label text-xs opacity-60 text-center">
          Slide tiles with Arrow keys / WASD. Merge matching numbers to reach 2048!
        </p>

        {/* Win overlay */}
        {won && !wonDismissed && (
          <div className="brut bg-lab-yellow px-6 py-3 text-center">
            <p className="font-display text-xl">🎉 YOU REACHED 2048!</p>
            <div className="flex gap-2 mt-2 justify-center">
              <BrutButton variant="go" onClick={() => setWonDismissed(true)}>KEEP GOING</BrutButton>
              <BrutButton variant="danger" onClick={reset}>NEW GAME</BrutButton>
            </div>
          </div>
        )}

        {/* Game over overlay */}
        {over && (
          <div className="brut bg-lab-red px-6 py-3 text-center">
            <p className="font-display text-xl text-white">GAME OVER</p>
            <p className="mono-label text-white">Final score: {score}</p>
            <BrutButton variant="go" className="mt-2" onClick={reset}>TRY AGAIN</BrutButton>
          </div>
        )}

        {/* Board */}
        <div
          className="brut p-2 grid gap-2"
          style={{ background: "#bbada0", gridTemplateColumns: "repeat(4, 5rem)", gridTemplateRows: "repeat(4, 5rem)" }}
        >
          {board.map((row, r) =>
            row.map((val, c) => {
              const s = tileStyle(val);
              return (
                <div
                  key={`${r}-${c}`}
                  className={`flex items-center justify-center font-display font-bold rounded ${s.size}`}
                  style={{
                    background: s.bg,
                    color: s.color,
                    width: "5rem",
                    height: "5rem",
                    transition: "background 0.1s",
                    boxShadow: val ? "0 2px 8px rgba(0,0,0,0.3)" : undefined,
                  }}
                >
                  {val !== 0 ? val : ""}
                </div>
              );
            }),
          )}
        </div>

        {/* D-pad for mobile */}
        <div className="grid grid-cols-3 gap-1 mt-1">
          <div />
          <BrutButton onClick={() => doMove("up")}>▲</BrutButton>
          <div />
          <BrutButton onClick={() => doMove("left")}>◄</BrutButton>
          <BrutButton onClick={() => doMove("down")}>▼</BrutButton>
          <BrutButton onClick={() => doMove("right")}>►</BrutButton>
        </div>
      </div>
    </GameShell>
  );
}
