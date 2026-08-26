import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import {
  clearIdentity,
  fetchMessages,
  fetchOnline,
  getSessionStart,
  heartbeat,
  joinAsName,
  markOffline,
  readIdentity,
  ROOM,
  sendMessage,
  type Identity,
  type LiveMessage,
  type LivePlayer,
} from "../../systems/liveChat";

import { BrutButton, Tag } from "../ui/brut";

function timeOf(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function LiveChat() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [ready, setReady] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [online, setOnline] = useState<LivePlayer[]>([]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIdentity(readIdentity());
    setReady(true);
  }, []);

  // load + realtime — only show messages from this session onwards
  useEffect(() => {
    if (!identity) return;
    let alive = true;
    const sessionStart = getSessionStart();
    void fetchMessages(sessionStart).then((m) => alive && setMessages(m));
    const channel = supabase
      .channel("lab_chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "lab_messages", filter: `room=eq.${ROOM}` },
        (payload) => {
          const msg = payload.new as LiveMessage;
          // Ignore messages sent before this session started
          if (sessionStart && msg.created_at < sessionStart) return;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg].slice(-200)));
          if (msg.player_id !== identity.id) sound.play("pop");
        },
      )
      .subscribe();
    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, [identity]);

  // presence heartbeat
  useEffect(() => {
    if (!identity) return;
    const ping = () => {
      void heartbeat(identity.id);
      void fetchOnline().then(setOnline);
    };
    ping();
    const t = window.setInterval(ping, 20_000);
    return () => window.clearInterval(t);
  }, [identity]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  if (!ready) return <div className="mono-label p-4">connecting…</div>;

  if (!identity) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <h3 className="font-display text-3xl">LAB CHAT — LIVE</h3>
        <p className="max-w-sm text-sm opacity-80">
          Type a name. Session-only live chat — your identity and local chat data are automatically wiped from this machine when your session ends or tab closes.
        </p>
        <form
          className="flex w-full max-w-sm flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            setJoining(true);
            joinAsName(nameInput)
              .then((id) => {
                setIdentity(id);
                store.interacted();
                store.toast("system", "JOINED LAB CHAT", `You are ${id.name} (Session Only).`);
              })
              .catch((err: Error) => setError(err.message))
              .finally(() => setJoining(false));
          }}
        >
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            maxLength={24}
            placeholder="your name"
            className="brut-sm flex-1 bg-background px-2 py-2 text-sm outline-none"
          />
          <BrutButton type="submit" disabled={joining}>
            {joining ? "JOINING…" : "JOIN"}
          </BrutButton>
        </form>
        {error && <p className="mono-label text-lab-red">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-xl">LAB CHAT</h3>
          <Tag tone="green">LIVE</Tag>
          <Tag tone="yellow">SESSION ONLY</Tag>
        </div>
        <div className="flex items-center gap-2">
          <span className="mono-label opacity-70">
            {online.length} ONLINE · YOU: {identity.name}
          </span>
          <BrutButton
            className="text-[10px]"
            onClick={() => {
              void markOffline(identity.id);
              clearIdentity();
              setIdentity(null);
              setMessages([]);
              setOnline([]);
              store.toast("system", "SESSION WIPED", "LabChat identity & session data wiped from this machine.");
            }}
          >
            WIPE SESSION
          </BrutButton>

        </div>
      </div>

      {online.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {online.map((p) => (
            <span key={p.id} className="brut-sm bg-card px-2 py-[2px] text-[10px]">
              {p.name}
            </span>
          ))}
        </div>
      )}

      <div className="scroll-thin flex-1 space-y-2 overflow-y-auto border-3 border-lab-ink bg-background p-3">
        {messages.length === 0 && <p className="mono-label opacity-60">no messages yet. say something.</p>}
        {messages.map((m) => {
          const mine = m.player_id === identity.id;
          return (
            <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
              <p className={`brut-sm max-w-[80%] px-2 py-1 text-sm ${mine ? "bg-lab-green" : "bg-card"}`}>
                {!mine && <span className="mono-label mr-2 opacity-70">{m.name}</span>}
                {m.text}
                <span className="mono-label ml-2 opacity-60">{timeOf(m.created_at)}</span>
              </p>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const text = draft;
          setDraft("");
          sound.play("pop");
          store.interacted();
          store.reduceBoredom(3);
          void sendMessage(identity, text).catch((err: Error) => setError(err.message));
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
          placeholder="type to the whole lab…"
          className="brut-sm flex-1 bg-background px-2 py-2 text-sm outline-none"
        />
        <BrutButton type="submit">SEND</BrutButton>
      </form>
      {error && <p className="mono-label mt-1 text-lab-red">{error}</p>}
    </div>
  );
}
