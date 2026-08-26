import { useCallback, useEffect, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

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

// Authentic 2048 Tile Palette
const TILE_STYLE: Record<number, { bg: string; color: string; size: string }> = {
  0:    { bg: "#cdc1b4", color: "transparent", size: "text-2xl" },
  2:    { bg: "#eee4da", color: "#776e65",     size: "text-3xl" },
  4:    { bg: "#ede0c8", color: "#776e65",     size: "text-3xl" },
  8:    { bg: "#f2b179", color: "#f9f6f2",     size: "text-3xl" },
  16:   { bg: "#f59563", color: "#f9f6f2",     size: "text-3xl" },
  32:   { bg: "#f67c5f", color: "#f9f6f2",     size: "text-3xl" },
  64:   { bg: "#f65e3b", color: "#f9f6f2",     size: "text-3xl" },
  128:  { bg: "#edcf72", color: "#f9f6f2",     size: "text-2xl" },
  256:  { bg: "#edcc61", color: "#f9f6f2",     size: "text-2xl" },
  512:  { bg: "#edc850", color: "#f9f6f2",     size: "text-2xl" },
  1024: { bg: "#edc53f", color: "#f9f6f2",     size: "text-xl"  },
  2048: { bg: "#edc22e", color: "#f9f6f2",     size: "text-xl"  },
  4096: { bg: "#3c3a32", color: "#f9f6f2",     size: "text-lg"  },
};

function tileStyle(val: number) {
  return TILE_STYLE[val] ?? { bg: "#3c3a32", color: "#f9f6f2", size: "text-base" };
}

function init(): Board {
  return addTile(addTile(emptyBoard()));
}

export default function TwentyFortyEight() {
  const [board, setBoard] = useState<Board>(init);
  const [prevBoard, setPrevBoard] = useState<Board | null>(null);
  const [prevScore, setPrevScore] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [won, setWon] = useState(false);
  const [over, setOver] = useState(false);
  const [wonDismissed, setWonDismissed] = useState(false);

  const reset = () => {
    setBoard(init());
    setPrevBoard(null);
    setPrevScore(null);
    setScore(0);
    setWon(false);
    setOver(false);
    setWonDismissed(false);
    sound.play("click");
  };

  const undo = () => {
    if (!prevBoard || prevScore === null || over) return;
    setBoard(prevBoard);
    setScore(prevScore);
    setPrevBoard(null);
    setPrevScore(null);
    sound.play("click");
  };

  const doMove = useCallback(
    (dir: Direction) => {
      if (over) return;
      const result = move(board, dir);
      if (!result.moved) return;

      setPrevBoard(board);
      setPrevScore(score);

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
      if (!won && hasWon(next)) {
        setWon(true);
        sound.play("success");
      }
      if (isGameOver(next)) {
        setOver(true);
        sound.play("error");
        store.submitGameResult("twentyfortyeight", { score: ns, accuracy: 1, time: 1, completed: true });
      }
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
      if (e.key === "z" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undo(); }
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
        <div className="flex gap-1.5">
          {prevBoard && (
            <BrutButton onClick={undo} className="text-xs py-1">
              ↩ UNDO
            </BrutButton>
          )}
          <BrutButton variant="go" onClick={reset} className="text-xs py-1">
            NEW GAME
          </BrutButton>
        </div>
      }
    >
      <div className="flex h-full w-full flex-col items-center justify-between p-2 select-none font-mono">
        {/* Header HUD / Controls Info */}
        <div className="flex w-full max-w-sm items-center justify-between rounded border-2 border-lab-ink bg-stone-900 px-3 py-1.5 text-xs text-white shadow-sm">
          <span className="font-bold text-amber-400">2048 PUZZLE</span>
          <span className="text-[10px] text-stone-400">ARROWS / WASD / SWIPE</span>
        </div>

        {/* Win overlay */}
        {won && !wonDismissed && (
          <div className="brut bg-amber-300 border-2 border-lab-ink px-4 py-2 text-center text-black shadow-lg">
            <p className="font-display text-lg font-bold">🎉 YOU REACHED 2048!</p>
            <div className="flex gap-2 mt-1.5 justify-center">
              <BrutButton variant="go" className="text-xs py-1" onClick={() => setWonDismissed(true)}>KEEP GOING</BrutButton>
              <BrutButton variant="danger" className="text-xs py-1" onClick={reset}>NEW GAME</BrutButton>
            </div>
          </div>
        )}

        {/* Game over overlay */}
        {over && (
          <div className="brut bg-rose-600 border-2 border-lab-ink px-4 py-2 text-center text-white shadow-lg">
            <p className="font-display text-lg font-bold">GAME OVER</p>
            <p className="text-xs opacity-90">Final score: {score}</p>
            <BrutButton variant="go" className="mt-1.5 text-xs py-1" onClick={reset}>TRY AGAIN</BrutButton>
          </div>
        )}

        {/* 4x4 Grid Board */}
        <div
          className="relative rounded-lg p-3 shadow-2xl border-4 border-lab-ink my-auto"
          style={{ background: "#bbada0" }}
        >
          <div className="grid grid-cols-4 gap-2.5 w-64 h-64 sm:w-76 sm:h-76">
            {board.map((row, r) =>
              row.map((val, c) => {
                const s = tileStyle(val);
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`flex items-center justify-center font-display font-black rounded-md transition-all duration-100 select-none ${s.size}`}
                    style={{
                      background: s.bg,
                      color: s.color,
                      boxShadow: val ? "0 3px 6px rgba(0,0,0,0.18)" : "none",
                      transform: val ? "scale(1)" : "scale(0.98)",
                    }}
                  >
                    {val !== 0 ? val : ""}
                  </div>
                );
              }),
            )}
          </div>
        </div>

        {/* D-pad for touch / mobile */}
        <div className="grid grid-cols-3 gap-1.5 w-40">
          <div />
          <button
            type="button"
            onClick={() => doMove("up")}
            className="brut-sm bg-card hover:bg-stone-200 border-2 border-lab-ink py-1 text-sm font-bold active:scale-95"
          >
            ▲
          </button>
          <div />
          <button
            type="button"
            onClick={() => doMove("left")}
            className="brut-sm bg-card hover:bg-stone-200 border-2 border-lab-ink py-1 text-sm font-bold active:scale-95"
          >
            ◄
          </button>
          <button
            type="button"
            onClick={() => doMove("down")}
            className="brut-sm bg-card hover:bg-stone-200 border-2 border-lab-ink py-1 text-sm font-bold active:scale-95"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={() => doMove("right")}
            className="brut-sm bg-card hover:bg-stone-200 border-2 border-lab-ink py-1 text-sm font-bold active:scale-95"
          >
            ►
          </button>
        </div>
      </div>
    </GameShell>
  );
}

