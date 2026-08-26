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
const SESSION_START_KEY = "lab_escape_session_start_v1";
export const ROOM = "lab";

export interface Identity {
  id: string;
  name: string;
}

export function readIdentity(): Identity | null {
  if (typeof window === "undefined") return null;
  try {
    // Clean up legacy localStorage data so chats/identity are not permanently stored on this machine
    window.localStorage.removeItem(KEY);
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Identity;
    return parsed && parsed.id && parsed.name ? parsed : null;
  } catch {
    return null;
  }
}

function writeIdentity(identity: Identity) {
  try {
    // Save to sessionStorage so it automatically wipes when the session ends
    window.sessionStorage.setItem(KEY, JSON.stringify(identity));
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function clearIdentity() {
  try {
    window.sessionStorage.removeItem(KEY);
    window.sessionStorage.removeItem(SESSION_START_KEY);
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Records the current time as the session start — only messages after this are shown. */
export function recordSessionStart() {
  try {
    window.sessionStorage.setItem(SESSION_START_KEY, new Date().toISOString());
  } catch {
    /* ignore */
  }
}

/** Returns the ISO timestamp when this session started, or null if not set. */
export function getSessionStart(): string | null {
  try {
    return window.sessionStorage.getItem(SESSION_START_KEY);
  } catch {
    return null;
  }
}

export async function joinAsName(rawName: string): Promise<Identity> {
  const name = rawName.trim().slice(0, 24);
  if (!name) throw new Error("Type a name first.");
  // Record join time BEFORE fetching so no old messages slip through
  recordSessionStart();
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

/** Sets last_seen to epoch so the player is instantly removed from online lists. */
export async function markOffline(id: string) {
  await supabase
    .from("lab_players")
    .update({ last_seen: new Date(0).toISOString() })
    .eq("id", id);
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

export async function fetchMessages(since?: string | null): Promise<LiveMessage[]> {
  let query = supabase
    .from("lab_messages")
    .select("*")
    .eq("room", ROOM)
    .order("created_at", { ascending: false })
    .limit(100);

  // Only fetch messages that were created after this session started
  if (since) {
    query = query.gte("created_at", since);
  }

  const { data } = await query;
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
