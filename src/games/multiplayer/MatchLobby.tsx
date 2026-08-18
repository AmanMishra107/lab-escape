import { useState } from "react";
import { BrutButton, Tag } from "../../components/ui/brut";
import { makeRoomCode, type MatchApi } from "../../systems/multiplayer";

export type PlayMode = "bot" | "online";
export type BotLevel = "easy" | "normal" | "hard";

export function ModeBar({
  mode,
  setMode,
  bot,
  setBot,
  match,
  right,
}: {
  mode: PlayMode;
  setMode: (m: PlayMode) => void;
  bot: BotLevel;
  setBot: (b: BotLevel) => void;
  match: MatchApi;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <BrutButton variant={mode === "bot" ? "primary" : "default"} onClick={() => { match.leave(); setMode("bot"); }}>
        VS BOT
      </BrutButton>
      <BrutButton variant={mode === "online" ? "primary" : "default"} onClick={() => setMode("online")}>
        VS FRIEND
      </BrutButton>
      {mode === "bot" &&
        (["easy", "normal", "hard"] as BotLevel[]).map((b) => (
          <BrutButton key={b} variant={bot === b ? "warn" : "default"} onClick={() => setBot(b)}>
            {b.toUpperCase()}
          </BrutButton>
        ))}
      {mode === "online" && match.status !== "idle" && (
        <>
          <Tag tone={match.status === "ready" ? "green" : "yellow"}>
            ROOM {match.code} · {match.status === "ready" ? "CONNECTED" : "WAITING"}
          </Tag>
          {match.opponent && <Tag>VS {match.opponent.name}</Tag>}
        </>
      )}
      {right}
    </div>
  );
}

export function OnlineGate({ match, name = "PLAYER" }: { match: MatchApi; name?: string }) {
  const [input, setInput] = useState("");
  if (match.status === "ready") return null;
  return (
    <div className="brut mx-auto max-w-sm space-y-3 bg-card p-4 text-center">
      {match.status === "idle" ? (
        <>
          <p className="mono-label">PLAY WITH A FRIEND</p>
          <p className="text-sm">Create a room and share the code, or type your friend's code to join.</p>
          <BrutButton variant="go" className="w-full" onClick={() => match.join(makeRoomCode(), name)}>
            CREATE ROOM
          </BrutButton>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              placeholder="CODE"
              maxLength={8}
              className="brut mono-label min-h-11 w-full bg-background px-3 uppercase"
            />
            <BrutButton onClick={() => match.join(input, name)}>JOIN</BrutButton>
          </div>
        </>
      ) : (
        <>
          <p className="mono-label">ROOM CODE</p>
          <p className="font-display text-5xl tracking-widest">{match.code}</p>
          <p className="text-sm">Waiting for your friend to join…</p>
          <BrutButton variant="danger" onClick={match.leave}>
            CANCEL
          </BrutButton>
        </>
      )}
    </div>
  );
}
