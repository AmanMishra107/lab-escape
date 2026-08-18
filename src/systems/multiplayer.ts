import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { readIdentity } from "./liveChat";

export type MatchStatus = "idle" | "connecting" | "waiting" | "ready";

export interface MatchPeer {
  id: string;
  name: string;
}

export interface MatchApi {
  status: MatchStatus;
  /** true when this client is player 1 (deterministic on both sides) */
  isP1: boolean;
  me: MatchPeer;
  peers: MatchPeer[];
  opponent: MatchPeer | null;
  code: string | null;
  join: (code: string, name?: string) => void;
  leave: () => void;
  send: (event: string, payload: unknown) => void;
}

export function makeRoomCode() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i++) out += abc[Math.floor(Math.random() * abc.length)];
  return out;
}

function localId() {
  const existing = readIdentity();
  if (existing) return existing;
  let id = "";
  try {
    id = window.localStorage.getItem("lab_match_id") ?? "";
    if (!id) {
      id = Math.random().toString(36).slice(2, 10);
      window.localStorage.setItem("lab_match_id", id);
    }
  } catch {
    id = Math.random().toString(36).slice(2, 10);
  }
  return { id, name: "PLAYER" };
}

/**
 * Lightweight realtime match layer: presence + broadcast on a room channel.
 * No database writes — rooms are ephemeral.
 */
export function useMatch(gameId: string, onEvent: (event: string, payload: any, from: string) => void): MatchApi {
  const [status, setStatus] = useState<MatchStatus>("idle");
  const [peers, setPeers] = useState<MatchPeer[]>([]);
  const [code, setCode] = useState<string | null>(null);
  const chanRef = useRef<RealtimeChannel | null>(null);
  const cbRef = useRef(onEvent);
  cbRef.current = onEvent;

  const me = useMemo(() => {
    if (typeof window === "undefined") return { id: "ssr", name: "PLAYER" };
    return localId();
  }, []);

  const leave = useCallback(() => {
    if (chanRef.current) supabase.removeChannel(chanRef.current);
    chanRef.current = null;
    setStatus("idle");
    setPeers([]);
    setCode(null);
  }, []);

  const join = useCallback(
    (raw: string, name?: string) => {
      const room = raw.trim().toUpperCase().slice(0, 8);
      if (!room) return;
      if (chanRef.current) supabase.removeChannel(chanRef.current);
      setStatus("connecting");
      setCode(room);
      const displayName = (name ?? me.name ?? "PLAYER").slice(0, 16);
      const chan = supabase.channel(`match:${gameId}:${room}`, {
        config: { presence: { key: me.id }, broadcast: { self: false } },
      });
      chan
        .on("presence", { event: "sync" }, () => {
          const state = chan.presenceState() as Record<string, Array<{ name?: string }>>;
          const list: MatchPeer[] = Object.entries(state).map(([id, metas]) => ({
            id,
            name: metas[0]?.name ?? "PLAYER",
          }));
          list.sort((a, b) => a.id.localeCompare(b.id));
          setPeers(list);
          setStatus(list.length >= 2 ? "ready" : "waiting");
        })
        .on("broadcast", { event: "msg" }, ({ payload }) => {
          const p = payload as { event: string; data: unknown; from: string };
          if (!p || p.from === me.id) return;
          cbRef.current(p.event, p.data, p.from);
        })
        .subscribe(async (s) => {
          if (s === "SUBSCRIBED") {
            await chan.track({ name: displayName });
          }
        });
      chanRef.current = chan;
    },
    [gameId, me.id, me.name],
  );

  const send = useCallback(
    (event: string, payload: unknown) => {
      chanRef.current?.send({ type: "broadcast", event: "msg", payload: { event, data: payload, from: me.id } });
    },
    [me.id],
  );

  useEffect(() => () => {
    if (chanRef.current) supabase.removeChannel(chanRef.current);
  }, []);

  const isP1 = peers.length > 0 ? peers[0]!.id === me.id : true;
  const opponent = peers.find((p) => p.id !== me.id) ?? null;

  return { status, isP1, me, peers, opponent, code, join, leave, send };
}
