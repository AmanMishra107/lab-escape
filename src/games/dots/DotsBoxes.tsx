import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { useMatch } from "../../systems/multiplayer";
import { ModeBar, OnlineGate, type BotLevel, type PlayMode } from "../multiplayer/MatchLobby";

const N = 5; // dots per side -> 4x4 boxes
const B = N - 1;
const H_COUNT = N * B; // horizontal lines
const V_COUNT = B * N; // vertical lines
const TOTAL = H_COUNT + V_COUNT;

type Owner = 0 | 1 | 2;

const hIndex = (r: number, c: number) => r * B + c;
const vIndex = (r: number, c: number) => H_COUNT + r * N + c;

function boxSides(r: number, c: number) {
  return [hIndex(r, c), hIndex(r + 1, c), vIndex(r, c), vIndex(r, c + 1)];
}

function claimBoxes(lines: boolean[], boxes: Owner[], player: Owner) {
  let gained = 0;
  const nb = [...boxes];
  for (let r = 0; r < B; r++)
    for (let c = 0; c < B; c++) {
      const i = r * B + c;
      if (nb[i]) continue;
      if (boxSides(r, c).every((s) => lines[s])) {
        nb[i] = player;
        gained++;
      }
    }
  return { boxes: nb, gained };
}

function botPick(lines: boolean[], boxes: Owner[], level: BotLevel): number {
  const free = lines.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  if (!free.length) return -1;
  const sidesCount = (i: number) => {
    // how many boxes this line completes / how many boxes end with 3 sides
    let completes = 0;
    let gives = 0;
    for (let r = 0; r < B; r++)
      for (let c = 0; c < B; c++) {
        const s = boxSides(r, c);
        if (!s.includes(i) || boxes[r * B + c]) continue;
        const filled = s.filter((x) => lines[x]).length;
        if (filled === 3) completes++;
        if (filled === 2) gives++;
      }
    return { completes, gives };
  };
  if (level === "easy") return free[Math.floor(Math.random() * free.length)]!;
  const scored = free.map((i) => ({ i, ...sidesCount(i) }));
  const winning = scored.filter((s) => s.completes > 0);
  if (winning.length) return winning.sort((a, b) => b.completes - a.completes)[0]!.i;
  if (level === "normal" && Math.random() < 0.3) return free[Math.floor(Math.random() * free.length)]!;
  const safe = scored.filter((s) => s.gives === 0);
  const pool = safe.length ? safe : scored.sort((a, b) => a.gives - b.gives);
  return pool[Math.floor(Math.random() * pool.length)]!.i;
}

export default function DotsBoxes() {
  const [mode, setMode] = useState<PlayMode>("bot");
  const [bot, setBot] = useState<BotLevel>("normal");
  const [lines, setLines] = useState<boolean[]>(() => Array(TOTAL).fill(false));
  const [boxes, setBoxes] = useState<Owner[]>(() => Array(B * B).fill(0) as Owner[]);
  const [turn, setTurn] = useState<Owner>(1);
  const stateRef = useRef({ lines, boxes });
  stateRef.current = { lines, boxes };

  const apply = useCallback((idx: number, player: Owner) => {
    setLines((prevLines) => {
      if (prevLines[idx]) return prevLines;
      const nl = [...prevLines];
      nl[idx] = true;
      setBoxes((prevBoxes) => {
        const { boxes: nb, gained } = claimBoxes(nl, prevBoxes, player);
        setTurn(gained > 0 ? player : player === 1 ? 2 : 1);
        if (gained) sound.play("success");
        return nb;
      });
      return nl;
    });
  }, []);

  const handle = useCallback(
    (event: string, data: any) => {
      if (event === "move") apply(data.idx, data.player);
      if (event === "reset") {
        setLines(Array(TOTAL).fill(false));
        setBoxes(Array(B * B).fill(0) as Owner[]);
        setTurn(1);
      }
    },
    [apply],
  );
  const match = useMatch("dots", handle);
  const myMark: Owner = mode === "online" ? (match.isP1 ? 1 : 2) : 1;

  const mine = boxes.filter((b) => b === myMark).length;
  const theirs = boxes.filter((b) => b && b !== myMark).length;
  const done = boxes.every((b) => b !== 0);

  useEffect(() => {
    if (!done) return;
    const won = mine > theirs;
    sound.play(won ? "success" : "glitch");
    store.submitGameResult("dots", { score: mine * 10, accuracy: mine / (B * B), time: 0, completed: true });
  }, [done, mine, theirs]);

  const click = (idx: number) => {
    if (done || lines[idx] || turn !== myMark) return;
    sound.play("click");
    apply(idx, myMark);
    if (mode === "online") match.send("move", { idx, player: myMark });
  };

  useEffect(() => {
    if (mode !== "bot" || done || turn !== 2) return;
    const t = setTimeout(() => {
      const idx = botPick(stateRef.current.lines, stateRef.current.boxes, bot);
      if (idx >= 0) apply(idx, 2);
    }, 380);
    return () => clearTimeout(t);
  }, [mode, turn, done, bot, apply, lines]);

  const reset = () => {
    setLines(Array(TOTAL).fill(false));
    setBoxes(Array(B * B).fill(0) as Owner[]);
    setTurn(1);
    if (mode === "online") match.send("reset", {});
  };

  const waiting = mode === "online" && match.status !== "ready";
  const S = 56;

  return (
    <GameShell
      id="dots"
      status={
        <>
          <Tag tone="green">YOU {mine}</Tag>
          <Tag tone="red">OPP {theirs}</Tag>
          <Tag tone={turn === myMark ? "green" : "yellow"}>
            {done ? (mine > theirs ? "YOU WIN" : mine === theirs ? "DRAW" : "YOU LOSE") : turn === myMark ? "YOUR TURN" : "OPPONENT"}
          </Tag>
        </>
      }
      toolbar={
        <ModeBar mode={mode} setMode={setMode} bot={bot} setBot={setBot} match={match} right={<BrutButton variant="danger" onClick={reset}>NEW GAME</BrutButton>} />
      }
    >
      {waiting ? (
        <OnlineGate match={match} />
      ) : (
        <svg viewBox={`-16 -16 ${(N - 1) * S + 32} ${(N - 1) * S + 32}`} className="h-full max-h-[420px] w-auto max-w-full">
          {boxes.map((o, i) => {
            const r = Math.floor(i / B);
            const c = i % B;
            if (!o) return null;
            return (
              <rect
                key={`b${i}`}
                x={c * S}
                y={r * S}
                width={S}
                height={S}
                className={o === myMark ? "fill-lab-green" : "fill-lab-red"}
                opacity={0.55}
              />
            );
          })}
          {Array.from({ length: N }, (_, r) =>
            Array.from({ length: B }, (_, c) => {
              const i = hIndex(r, c);
              return (
                <line
                  key={`h${i}`}
                  x1={c * S}
                  y1={r * S}
                  x2={(c + 1) * S}
                  y2={r * S}
                  strokeWidth={lines[i] ? 7 : 12}
                  className={lines[i] ? "stroke-lab-ink" : "cursor-pointer stroke-lab-ink/10 hover:stroke-lab-blue"}
                  onClick={() => click(i)}
                />
              );
            }),
          )}
          {Array.from({ length: B }, (_, r) =>
            Array.from({ length: N }, (_, c) => {
              const i = vIndex(r, c);
              return (
                <line
                  key={`v${i}`}
                  x1={c * S}
                  y1={r * S}
                  x2={c * S}
                  y2={(r + 1) * S}
                  strokeWidth={lines[i] ? 7 : 12}
                  className={lines[i] ? "stroke-lab-ink" : "cursor-pointer stroke-lab-ink/10 hover:stroke-lab-blue"}
                  onClick={() => click(i)}
                />
              );
            }),
          )}
          {Array.from({ length: N }, (_, r) =>
            Array.from({ length: N }, (_, c) => <circle key={`d${r}-${c}`} cx={c * S} cy={r * S} r={6} className="fill-lab-ink" />),
          )}
        </svg>
      )}
    </GameShell>
  );
}
