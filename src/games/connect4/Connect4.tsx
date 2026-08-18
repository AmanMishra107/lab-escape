import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { useMatch } from "../../systems/multiplayer";
import { ModeBar, OnlineGate, type BotLevel, type PlayMode } from "../multiplayer/MatchLobby";

const COLS = 7;
const ROWS = 6;
type Cell = 0 | 1 | 2;

function emptyBoard(): Cell[] {
  return Array<Cell>(COLS * ROWS).fill(0);
}
const at = (b: Cell[], c: number, r: number) => b[r * COLS + c]!;

function drop(b: Cell[], col: number, p: Cell): Cell[] | null {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (at(b, col, r) === 0) {
      const nb = [...b];
      nb[r * COLS + col] = p;
      return nb;
    }
  }
  return null;
}

function winnerOf(b: Cell[]): Cell | "draw" | null {
  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = at(b, c, r);
      if (!v) continue;
      for (const [dc, dr] of dirs) {
        let n = 1;
        while (n < 4) {
          const nc = c + dc! * n;
          const nr = r + dr! * n;
          if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS || at(b, nc, nr) !== v) break;
          n++;
        }
        if (n === 4) return v;
      }
    }
  }
  return b.every((x) => x !== 0) ? "draw" : null;
}

function validCols(b: Cell[]) {
  return Array.from({ length: COLS }, (_, c) => c).filter((c) => at(b, c, 0) === 0);
}

function score(b: Cell[], me: Cell): number {
  const w = winnerOf(b);
  if (w === me) return 10000;
  if (w && w !== "draw") return -10000;
  let s = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (at(b, c, r) === me) s += 3 - Math.abs(c - 3);
  return s;
}

function negamax(b: Cell[], depth: number, me: Cell, turn: Cell, alpha: number, beta: number): { s: number; col: number } {
  const w = winnerOf(b);
  if (w || depth === 0) return { s: w ? score(b, me) : score(b, me), col: -1 };
  let best = { s: -Infinity, col: validCols(b)[0] ?? -1 };
  for (const c of validCols(b)) {
    const nb = drop(b, c, turn)!;
    const child = negamax(nb, depth - 1, me, turn === 1 ? 2 : 1, -beta, -alpha);
    const s = turn === me ? -(-child.s) : child.s;
    const val = turn === me ? child.s * (depth % 2 === 0 ? 1 : 1) : child.s;
    void s;
    const v = turn === me ? val : -val;
    if (v > best.s) best = { s: v, col: c };
    alpha = Math.max(alpha, v);
    if (alpha >= beta) break;
  }
  return best;
}

function botMove(b: Cell[], level: BotLevel, me: Cell): number {
  const cols = validCols(b);
  const opp: Cell = me === 1 ? 2 : 1;
  // immediate win / block always
  for (const c of cols) if (winnerOf(drop(b, c, me)!) === me) return c;
  for (const c of cols) if (winnerOf(drop(b, c, opp)!) === opp) return c;
  if (level === "easy") return cols[Math.floor(Math.random() * cols.length)]!;
  if (level === "normal" && Math.random() < 0.35) return cols[Math.floor(Math.random() * cols.length)]!;
  const depth = level === "hard" ? 5 : 3;
  const res = negamax(b, depth, me, me, -Infinity, Infinity);
  return res.col >= 0 ? res.col : cols[0]!;
}

export default function Connect4() {
  const [mode, setMode] = useState<PlayMode>("bot");
  const [bot, setBot] = useState<BotLevel>("normal");
  const [board, setBoard] = useState<Cell[]>(emptyBoard);
  const [turn, setTurn] = useState<Cell>(1);
  const [record, setRecord] = useState({ w: 0, l: 0, d: 0 });
  const boardRef = useRef(board);
  boardRef.current = board;

  const handle = useCallback((event: string, data: any) => {
    if (event === "move") {
      setBoard((b) => drop(b, data.col, data.player) ?? b);
      setTurn(data.player === 1 ? 2 : 1);
      sound.play("click");
    }
    if (event === "reset") {
      setBoard(emptyBoard());
      setTurn(1);
    }
  }, []);
  const match = useMatch("connect4", handle);

  const myMark: Cell = mode === "online" ? (match.isP1 ? 1 : 2) : 1;
  const result = winnerOf(board);

  useEffect(() => {
    if (!result) return;
    const won = result === myMark;
    setRecord((r) => ({
      w: r.w + (won ? 1 : 0),
      l: r.l + (result !== "draw" && !won ? 1 : 0),
      d: r.d + (result === "draw" ? 1 : 0),
    }));
    sound.play(won ? "success" : "glitch");
    store.submitGameResult("connect4", {
      score: won ? 100 : result === "draw" ? 40 : 10,
      accuracy: won ? 1 : 0.4,
      time: 0,
      completed: true,
    });
  }, [result, myMark]);

  const play = (col: number) => {
    if (result || at(board, col, 0) !== 0) return;
    if (turn !== myMark) return;
    const nb = drop(board, col, myMark);
    if (!nb) return;
    sound.play("click");
    setBoard(nb);
    setTurn(myMark === 1 ? 2 : 1);
    if (mode === "online") match.send("move", { col, player: myMark });
  };

  // bot turn
  useEffect(() => {
    if (mode !== "bot" || result || turn !== 2) return;
    const t = setTimeout(() => {
      const c = botMove(boardRef.current, bot, 2);
      const nb = drop(boardRef.current, c, 2);
      if (nb) {
        setBoard(nb);
        setTurn(1);
        sound.play("click");
      }
    }, 420);
    return () => clearTimeout(t);
  }, [mode, turn, result, bot]);

  const reset = () => {
    setBoard(emptyBoard());
    setTurn(1);
    if (mode === "online") match.send("reset", {});
  };

  const waiting = mode === "online" && match.status !== "ready";

  return (
    <GameShell
      id="connect4"
      status={
        <>
          <Tag tone={turn === myMark ? "green" : "yellow"}>
            {result ? (result === "draw" ? "DRAW" : result === myMark ? "YOU WIN" : "YOU LOSE") : turn === myMark ? "YOUR TURN" : "OPPONENT"}
          </Tag>
          <Tag>{record.w}W / {record.l}L / {record.d}D</Tag>
        </>
      }
      toolbar={
        <ModeBar
          mode={mode}
          setMode={setMode}
          bot={bot}
          setBot={setBot}
          match={match}
          right={<BrutButton variant="danger" onClick={reset}>NEW GAME</BrutButton>}
        />
      }
    >
      {waiting ? (
        <OnlineGate match={match} />
      ) : (
        <div className="brut bg-lab-blue p-2">
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: COLS }, (_, c) =>
              Array.from({ length: ROWS }, (_, r) => {
                const v = at(board, c, r);
                return (
                  <button
                    key={`${c}-${r}`}
                    onClick={() => play(c)}
                    style={{ gridColumn: c + 1, gridRow: r + 1 }}
                    className="brut flex size-9 items-center justify-center bg-lab-paper sm:size-11"
                  >
                    <span
                      className={`block size-6 rounded-full sm:size-8 ${
                        v === 1 ? "bg-lab-red" : v === 2 ? "bg-lab-yellow" : "bg-background"
                      } ${v ? "border-3 border-lab-ink" : ""}`}
                    />
                  </button>
                );
              }),
            )}
          </div>
        </div>
      )}
    </GameShell>
  );
}
