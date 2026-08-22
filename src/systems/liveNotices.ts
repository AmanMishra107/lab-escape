import { supabase } from "@/integrations/supabase/client";
import type { Notice } from "@/data/notices";

const ROOM_NOTICES = "shared_notices";

/**
 * Checks if a notice's expiration timestamp has passed.
 * Returns true if expired (should be hidden/removed).
 */
export function isNoticeExpired(notice: Notice): boolean {
  if (!notice.expires_at) return false;
  const expiryTime = new Date(notice.expires_at).getTime();
  if (isNaN(expiryTime)) return false;
  return Date.now() > expiryTime;
}

/**
 * Fetches all globally posted notices from Supabase (visible to everyone).
 */
export async function fetchGlobalNotices(): Promise<Notice[]> {
  try {
    const { data, error } = await supabase
      .from("lab_messages")
      .select("*")
      .eq("room", ROOM_NOTICES)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) return [];

    const notices: Notice[] = [];
    for (const row of data) {
      try {
        const parsed = JSON.parse(row.text) as Notice;
        parsed.id = parsed.id || row.id;
        if (!isNoticeExpired(parsed)) {
          notices.push(parsed);
        }
      } catch {
        /* skip invalid payload */
      }
    }

    return notices;
  } catch {
    return [];
  }
}

/**
 * Posts a notice to Supabase so it becomes visible to ALL players in real time.
 */
export async function postGlobalNotice(notice: Notice): Promise<void> {
  const payload = JSON.stringify(notice);
  const { error } = await supabase.from("lab_messages").insert({
    room: ROOM_NOTICES,
    name: notice.sign || "Student",
    text: payload,
  });

  if (error) {
    console.error("Failed to post global notice to Supabase:", error);
    throw error;
  }
}
