import { useCallback, useEffect, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

type Mark = "X" | "O" | null;
type Mode = "friend" | "easy" | "normal" | "impossible";

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function winner(b: Mark[]): Mark | "draw" | null {
  for (const [a, c, d] of LINES) if (b[a!] && b[a!] === b[c!] && b[a!] === b[d!]) return b[a!];
  return b.every(Boolean) ? "draw" : null;
}

function minimax(b: Mark[], isAi: boolean): { score: number; move: number } {
  const w = winner(b);
  if (w === "O") return { score: 1, move: -1 };
  if (w === "X") return { score: -1, move: -1 };
  if (w === "draw") return { score: 0, move: -1 };
  let best = { score: isAi ? -2 : 2, move: -1 };
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    const nb = [...b];
    nb[i] = isAi ? "O" : "X";
    const { score } = minimax(nb, !isAi);
    if (isAi ? score > best.score : score < best.score) best = { score, move: i };
  }
  return best;
}

function aiMove(b: Mark[], mode: Mode): number {
  const empty = b.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  if (mode === "easy") return empty[Math.floor(Math.random() * empty.length)]!;
  if (mode === "normal" && Math.random() < 0.4) return empty[Math.floor(Math.random() * empty.length)]!;
  return minimax(b, true).move;
}

export default function TicTacToe() {
  const [mode, setMode] = useState<Mode>("normal");
  const [board, setBoard] = useState<Mark[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [record, setRecord] = useState({ w: 0, l: 0, d: 0 });
  const result = winner(board);

  const reset = useCallback(() => {
    setBoard(Array(9).fill(null));
    setTurn("X");
  }, []);

  useEffect(() => {
    if (!result) return;
    sound.play(result === "X" ? "success" : result === "draw" ? "pop" : "error");
    const score = result === "X" ? (mode === "impossible" ? 300 : mode === "normal" ? 150 : 60) : result === "draw" ? 80 : 20;
    setRecord((r) => ({
      w: r.w + (result === "X" ? 1 : 0),
      l: r.l + (result === "O" ? 1 : 0),
      d: r.d + (result === "draw" ? 1 : 0),
    }));
    store.submitGameResult("tictactoe", {
      score,
      accuracy: result === "X" ? 1 : result === "draw" ? 0.5 : 0,
      time: 1,
      completed: true,
    });
    if (mode === "impossible" && (result === "draw" || result === "X")) store.unlock("impossible");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  useEffect(() => {
    if (mode === "friend" || result || turn !== "O") return;
    const t = window.setTimeout(() => {
      const m = aiMove(board, mode);
      if (m >= 0) {
        setBoard((b) => {
          const nb = [...b];
          nb[m] = "O";
          return nb;
        });
        sound.play("click");
        setTurn("X");
      }
    }, 320);
    return () => window.clearTimeout(t);
  }, [turn, board, mode, result]);

  const play = (i: number) => {
    if (board[i] || result) return;
    if (mode !== "friend" && turn !== "X") return;
    sound.play("click");
    store.interacted();
    setBoard((b) => {
      const nb = [...b];
      nb[i] = turn;
      return nb;
    });
    setTurn(turn === "X" ? "O" : "X");
  };

  return (
    <GameShell
      id="tictactoe"
      status={
        <>
          <Tag tone="green">W {record.w}</Tag>
          <Tag tone="red">L {record.l}</Tag>
          <Tag tone="yellow">D {record.d}</Tag>
        </>
      }
      toolbar={
        <>
          {(["friend", "easy", "normal", "impossible"] as Mode[]).map((m) => (
            <BrutButton
              key={m}
              variant={m === mode ? "primary" : "default"}
              onClick={() => {
                setMode(m);
                reset();
              }}
            >
              {m.toUpperCase()}
            </BrutButton>
          ))}
          <BrutButton variant="go" onClick={reset}>
            NEW GAME
          </BrutButton>
        </>
      }
    >
      <div className="flex flex-col items-center gap-3">
        <p className="mono-label">
          {result === "draw"
            ? "DRAW. Respectable."
            : result === "X"
              ? "YOU WIN."
              : result === "O"
                ? "THE MACHINE WINS."
                : mode === "friend"
                  ? `TURN: ${turn}`
                  : turn === "X"
                    ? "YOUR MOVE"
                    : "THINKING..."}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {board.map((c, i) => (
            <button
              key={i}
              aria-label={`square ${i + 1}${c ? `, ${c}` : ", empty"}`}
              onClick={() => play(i)}
              className="brut brut-press flex h-20 w-20 items-center justify-center bg-card font-display text-4xl sm:h-24 sm:w-24"
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </GameShell>
  );
}
