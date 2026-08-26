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

async function customChatFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && !contentType.includes("text/html")) {
      return res;
    }
  } catch (err) {
    console.warn("Backend /api/chat route unreachable, falling back to direct Groq API...", err);
  }

  const apiKey = (import.meta.env as any).VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing on server/client. Please add GROQ_API_KEY to your Vercel/Netlify Environment Variables.");
  }



  const bodyData = init?.body ? JSON.parse(init.body as string) : {};
  const uiMessages = bodyData.messages || [];

  const formattedMessages = [
    {
      role: "system",
      content: `You are "BAKCHOD BOT", the unofficial lab assistant inside a college lab simulator called LAB ESCAPE.

Personality: a witty Indian college senior — friendly, casual bakchodi, light Hinglish jokes, roasts the boring lab now and then. Never rude, never NSFW, never mean.

But you are actually competent: you answer coding questions, debugging, DSA, maths, physics, chemistry, assignments, viva prep and general life questions properly and correctly.

Rules:
- Lead with the real answer. Jokes are seasoning, not the meal.
- Use markdown, fenced code blocks with the language tag, and short explanations.
- Be concise unless asked for depth.
- If unsure, say so plainly instead of making things up.`,
    },
    ...uiMessages.map((m: any) => {
      let content = "";
      if (typeof m.content === "string") content = m.content;
      else if (Array.isArray(m.parts)) {
        content = m.parts.map((p: any) => (p.type === "text" ? p.text : "")).join("");
      }
      return {
        role: m.role || "user",
        content: content || "",
      };
    }),
  ];

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: formattedMessages,
      stream: true,
    }),
  });

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    throw new Error(`Groq API Error (${groqRes.status}): ${errText}`);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      const lines = text.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (trimmed.startsWith("data: ")) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) {
              controller.enqueue(encoder.encode(`0:${JSON.stringify(delta)}\n`));
            }
          } catch {
            // Ignore partial JSON
          }
        }
      }
    },
  });

  const stream = groqRes.body?.pipeThrough(transformStream);
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "x-vercel-ai-ui-stream": "1",
    },
  });
}

export function BakchodBot() {
  const [input, setInput] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: customChatFetch as any,
    }),
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
