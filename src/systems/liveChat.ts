import { supabase } from "@/integrations/supabase/client";

export interface LiveMessage {
  id: string;
  room: string;
  player_id: string | null;
  name: string;
  text: string;
  created_at: string;
}

export interface LivePlayer {
  id: string;
  name: string;
  last_seen: string;
}

const KEY = "lab_escape_identity_v1";
export const ROOM = "lab";

export interface Identity {
  id: string;
  name: string;
}

export function readIdentity(): Identity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Identity;
    return parsed && parsed.id && parsed.name ? parsed : null;
  } catch {
    return null;
  }
}

function writeIdentity(identity: Identity) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(identity));
  } catch {
    /* ignore */
  }
}

export function clearIdentity() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export async function joinAsName(rawName: string): Promise<Identity> {
  const name = rawName.trim().slice(0, 24);
  if (!name) throw new Error("Type a name first.");
  const { data, error } = await supabase
    .from("lab_players")
    .insert({ name })
    .select("id, name")
    .single();
  if (error) throw error;
  const identity: Identity = { id: data.id, name: data.name };
  writeIdentity(identity);
  return identity;
}

export async function heartbeat(id: string) {
  await supabase.from("lab_players").update({ last_seen: new Date().toISOString() }).eq("id", id);
}

export async function fetchOnline(): Promise<LivePlayer[]> {
  const since = new Date(Date.now() - 70_000).toISOString();
  const { data } = await supabase
    .from("lab_players")
    .select("id, name, last_seen")
    .gte("last_seen", since)
    .order("last_seen", { ascending: false })
    .limit(50);
  return (data ?? []) as LivePlayer[];
}

export async function fetchMessages(): Promise<LiveMessage[]> {
  const { data } = await supabase
    .from("lab_messages")
    .select("*")
    .eq("room", ROOM)
    .order("created_at", { ascending: false })
    .limit(100);
  return ((data ?? []) as LiveMessage[]).slice().reverse();
}

export async function sendMessage(identity: Identity, rawText: string) {
  const text = rawText.trim().slice(0, 500);
  if (!text) return;
  const { error } = await supabase
    .from("lab_messages")
    .insert({ room: ROOM, player_id: identity.id, name: identity.name, text });
  if (error) throw error;
}
