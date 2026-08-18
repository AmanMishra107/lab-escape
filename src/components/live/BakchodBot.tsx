import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../ui/brut";

const SUGGESTIONS = [
  "explain recursion like I'm sleepy",
  "why is my for loop off by one?",
  "give me a viva answer for OSI model",
  "roast my time management",
];

function textOf(m: UIMessage) {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

export function BakchodBot() {
  const [input, setInput] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [messages, status]);

  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy]);

  const ask = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    sound.play("pop");
    store.interacted();
    store.reduceBoredom(3);
    setInput("");
    void sendMessage({ text: t });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-xl">BAKCHOD BOT</h3>
          <p className="text-[10px] uppercase tracking-tighter opacity-70">
            coding doubts • assignments • timepass
          </p>
        </div>
        <Tag tone="green">AI</Tag>
      </div>

      <div
        ref={boxRef}
        className="scroll-thin flex-1 space-y-2 overflow-y-auto border-3 border-lab-ink bg-background p-3"
      >
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="brut-sm bg-card px-2 py-1 text-sm">
              oye. ask me anything — code, DSA, physics, assignment panic, ya bas timepass. 🧪
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <BrutButton key={s} className="text-[10px]" onClick={() => ask(s)}>
                  {s}
                </BrutButton>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <p
              className={`brut-sm max-w-[85%] whitespace-pre-wrap px-2 py-1 text-sm ${
                m.role === "user" ? "bg-lab-green" : "bg-card"
              }`}
            >
              {textOf(m) || "…"}
            </p>
          </div>
        ))}

        {status === "submitted" && (
          <p className="mono-label brut-sm inline-block bg-card px-2 py-1">typing…</p>
        )}

        {error && (
          <p className="brut-sm bg-lab-red px-2 py-1 text-sm text-lab-paper">
            bot down: {error.message}
          </p>
        )}
      </div>

      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ask anything — code, doubts, bakchodi…"
          className="brut-sm min-w-0 flex-1 bg-background px-2 py-2 text-sm outline-none"
        />
        <BrutButton type="submit" variant="go" disabled={busy}>
          {busy ? "…" : "ASK"}
        </BrutButton>
      </form>
    </div>
  );
}
