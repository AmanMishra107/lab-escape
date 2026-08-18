import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { useMatch } from "../../systems/multiplayer";
import { ModeBar, OnlineGate, type BotLevel, type PlayMode } from "../multiplayer/MatchLobby";

type Pick = "rock" | "paper" | "scissors";
const PICKS: Pick[] = ["rock", "paper", "scissors"];
const EMOJI: Record<Pick, string> = { rock: "🪨", paper: "📄", scissors: "✂️" };
const BEATS: Record<Pick, Pick> = { rock: "scissors", paper: "rock", scissors: "paper" };
const COUNTER: Record<Pick, Pick> = { rock: "paper", paper: "scissors", scissors: "rock" };

export default function RpsDuel() {
  const [mode, setMode] = useState<PlayMode>("bot");
  const [bot, setBot] = useState<BotLevel>("normal");
  const [mine, setMine] = useState<Pick | null>(null);
  const [theirs, setTheirs] = useState<Pick | null>(null);
  const [score, setScore] = useState({ me: 0, opp: 0 });
  const [round, setRound] = useState(1);
  const history = useRef<Pick[]>([]);
  const resolved = useRef(false);

  const handle = useCallback((event: string, data: any) => {
    if (event === "pick") setTheirs(data.pick as Pick);
    if (event === "reset") hardReset();
  }, []);
  const match = useMatch("rps", handle);

  function hardReset() {
    setMine(null);
    setTheirs(null);
    setScore({ me: 0, opp: 0 });
    setRound(1);
    history.current = [];
    resolved.current = false;
  }

  const choose = (p: Pick) => {
    if (mine || score.me >= 3 || score.opp >= 3) return;
    sound.play("click");
    setMine(p);
    history.current.push(p);
    if (mode === "online") match.send("pick", { pick: p });
    else {
      const level = bot;
      let botPick: Pick;
      const last = history.current[history.current.length - 2];
      if (level === "easy") botPick = PICKS[Math.floor(Math.random() * 3)]!;
      else if (level === "hard" && last) botPick = COUNTER[last];
      else botPick = Math.random() < 0.5 && last ? COUNTER[last] : PICKS[Math.floor(Math.random() * 3)]!;
      setTimeout(() => setTheirs(botPick), 600);
    }
  };

  useEffect(() => {
    if (!mine || !theirs || resolved.current) return;
    resolved.current = true;
    const t = setTimeout(() => {
      if (mine !== theirs) {
        const iWon = BEATS[mine] === theirs;
        setScore((s) => ({ me: s.me + (iWon ? 1 : 0), opp: s.opp + (iWon ? 0 : 1) }));
        sound.play(iWon ? "success" : "glitch");
      }
      setMine(null);
      setTheirs(null);
      setRound((r) => r + 1);
      resolved.current = false;
    }, 1100);
    return () => clearTimeout(t);
  }, [mine, theirs]);

  const over = score.me >= 3 || score.opp >= 3;
  useEffect(() => {
    if (!over) return;
    const won = score.me > score.opp;
    store.submitGameResult("rps", { score: score.me * 25, accuracy: score.me / 3, time: 0, completed: true });
    sound.play(won ? "success" : "glitch");
  }, [over, score.me, score.opp]);

  const waiting = mode === "online" && match.status !== "ready";

  return (
    <GameShell
      id="rps"
      status={
        <>
          <Tag tone="green">YOU {score.me}</Tag>
          <Tag tone="red">OPP {score.opp}</Tag>
          <Tag>ROUND {round}</Tag>
        </>
      }
      toolbar={
        <ModeBar mode={mode} setMode={setMode} bot={bot} setBot={setBot} match={match} right={<BrutButton variant="danger" onClick={() => { hardReset(); if (mode === "online") match.send("reset", {}); }}>RESET</BrutButton>} />
      }
    >
      {waiting ? (
        <OnlineGate match={match} />
      ) : (
        <div className="flex w-full max-w-lg flex-col items-center gap-5 p-3 text-center">
          <div className="flex w-full items-center justify-around">
            <div className="brut flex size-24 items-center justify-center bg-lab-paper text-5xl">{mine ? EMOJI[mine] : "❔"}</div>
            <span className="font-display text-2xl">VS</span>
            <div className="brut flex size-24 items-center justify-center bg-lab-paper text-5xl">
              {theirs && mine ? EMOJI[theirs] : theirs ? "🔒" : "❔"}
            </div>
          </div>
          <p className="mono-label">
            {over
              ? score.me > score.opp
                ? "MATCH WON — FIRST TO 3"
                : "MATCH LOST"
              : mine
                ? theirs
                  ? "REVEAL!"
                  : "WAITING FOR OPPONENT…"
                : "MAKE YOUR PICK"}
          </p>
          <div className="flex gap-3">
            {PICKS.map((p) => (
              <BrutButton key={p} disabled={!!mine || over} onClick={() => choose(p)} className="text-2xl">
                {EMOJI[p]}
              </BrutButton>
            ))}
          </div>
          {over && (
            <BrutButton variant="go" onClick={() => { hardReset(); if (mode === "online") match.send("reset", {}); }}>
              PLAY AGAIN
            </BrutButton>
          )}
        </div>
      )}
    </GameShell>
  );
}
