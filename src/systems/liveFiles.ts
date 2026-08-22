import { supabase } from "@/integrations/supabase/client";

export interface SharedCodeFile {
  id: string;
  fileName: string;
  assignmentName: string;
  author: string;
  language: "cpp" | "c" | "java" | "python" | "javascript" | "html" | "sql" | "txt";
  code: string;
  description?: string;
  created_at: string;
  expires_at: string; // ISO string set to 7 days from creation
}

const ROOM_FILES = "shared_code_files";
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Local browser cross-tab channel for 0ms instant multi-tab sync on same machine
export const fileSyncChannel = typeof window !== "undefined" && "BroadcastChannel" in window
  ? new BroadcastChannel("lab_files_cross_tab_sync")
  : null;

/**
 * Smartly detects programming language and extension from user filename and source code content.
 */
export function detectLanguageAndExtension(rawName: string, code: string): {
  fileName: string;
  language: SharedCodeFile["language"];
} {
  const trimmedName = rawName.trim();
  const trimmedCode = code.trim();

  // 1. Check if user provided an explicit extension in filename
  const hasDot = trimmedName.includes(".");
  let ext = hasDot ? trimmedName.split(".").pop()?.toLowerCase() ?? "" : "";
  let baseName = hasDot ? trimmedName.substring(0, trimmedName.lastIndexOf(".")) : trimmedName;
  if (!baseName) baseName = "code_file";

  // 2. Auto-detect from code body if no explicit extension or extension is txt
  let detectedLang: SharedCodeFile["language"] = "txt";
  let detectedExt = "txt";

  const codeLower = trimmedCode.toLowerCase();

  if (codeLower.includes("#include") || codeLower.includes("std::") || codeLower.includes("cout <<") || codeLower.includes("cin >>") || codeLower.includes("int main")) {
    detectedLang = "cpp";
    detectedExt = "cpp";
  } else if (codeLower.includes("import java") || codeLower.includes("public class") || codeLower.includes("system.out.print")) {
    detectedLang = "java";
    detectedExt = "java";
  } else if (codeLower.includes("def ") || codeLower.includes("import ") || codeLower.includes("print(") || codeLower.includes("if __name__")) {
    detectedLang = "python";
    detectedExt = "py";
  } else if ((codeLower.includes("select ") && codeLower.includes("from ")) || codeLower.includes("create table") || codeLower.includes("insert into")) {
    detectedLang = "sql";
    detectedExt = "sql";
  } else if (codeLower.includes("<html>") || codeLower.includes("<!doctype") || codeLower.includes("<div") || codeLower.includes("<script>")) {
    detectedLang = "html";
    detectedExt = "html";
  } else if (codeLower.includes("const ") || codeLower.includes("let ") || codeLower.includes("function ") || codeLower.includes("console.log") || codeLower.includes("=>")) {
    detectedLang = "javascript";
    detectedExt = "js";
  }

  // 3. Override if explicit extension matches a known language
  if (ext === "cpp" || ext === "c" || ext === "hpp" || ext === "h") {
    detectedLang = "cpp";
    detectedExt = ext;
  } else if (ext === "java") {
    detectedLang = "java";
    detectedExt = "java";
  } else if (ext === "py") {
    detectedLang = "python";
    detectedExt = "py";
  } else if (ext === "js" || ext === "ts" || ext === "jsx" || ext === "tsx") {
    detectedLang = "javascript";
    detectedExt = ext;
  } else if (ext === "html" || ext === "htm") {
    detectedLang = "html";
    detectedExt = "html";
  } else if (ext === "sql") {
    detectedLang = "sql";
    detectedExt = "sql";
  } else if (ext === "txt") {
    if (detectedLang === "txt") {
      detectedExt = "txt";
    }
  }

  // 4. Construct final filename with extension
  const finalFileName = hasDot ? `${baseName}.${ext}` : `${baseName}.${detectedExt}`;

  return {
    fileName: finalFileName,
    language: detectedLang,
  };
}

/**
 * Checks if a shared code file has passed its 1-week expiration date.
 */
export function isFileExpired(file: SharedCodeFile): boolean {
  if (!file.expires_at) return false;
  const expiry = new Date(file.expires_at).getTime();
  if (isNaN(expiry)) return false;
  return Date.now() > expiry;
}

/**
 * Calculates human-readable time remaining until 1-week auto-purge.
 */
export function getExpiryRemaining(expiresAtIso: string): string {
  const diff = new Date(expiresAtIso).getTime() - Date.now();
  if (diff <= 0) return "EXPIRED";
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `Expires in ${days}d ${hours}h`;
  const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return `Expires in ${hours}h ${mins}m`;
  return `Expires in ${mins}m`;
}

/**
 * Fetch all active public assignment files from Supabase.
 * Filters out any files older than 1 week.
 */
export async function fetchGlobalFiles(): Promise<SharedCodeFile[]> {
  try {
    const { data, error } = await supabase
      .from("lab_messages")
      .select("*")
      .eq("room", ROOM_FILES)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) return [];

    const files: SharedCodeFile[] = [];
    for (const row of data) {
      try {
        const parsed = JSON.parse(row.text) as SharedCodeFile;
        // BIND file.id directly to row.id (the Supabase database primary key UUID)
        parsed.id = row.id || parsed.id;
        if (!isFileExpired(parsed)) {
          files.push(parsed);
        }
      } catch {
        /* skip invalid json */
      }
    }
    return files;
  } catch {
    return [];
  }
}

/**
 * Publish a new code assignment file to Supabase.
 * Automatically binds returned database UUID row ID.
 */
export async function publishGlobalFile(file: Omit<SharedCodeFile, "id" | "created_at" | "expires_at">): Promise<SharedCodeFile> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ONE_WEEK_MS);

  const fullFile: SharedCodeFile = {
    ...file,
    id: `code_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  };

  const payload = JSON.stringify(fullFile);

  // Insert into Supabase table & get returned row
  const { data, error } = await supabase
    .from("lab_messages")
    .insert({
      room: ROOM_FILES,
      name: file.author || "Anonymous Student",
      text: payload,
    })
    .select("*")
    .single();

  if (!error && data && data.id) {
    // Override file ID with actual database primary key row UUID
    fullFile.id = data.id;
  } else if (error) {
    console.error("Failed to publish code assignment file to Supabase:", error);
  }

  // Send via local BroadcastChannel for instant cross-tab sync
  fileSyncChannel?.postMessage({ type: "NEW_FILE", file: fullFile });

  return fullFile;
}

/**
 * Delete a published file directly from Supabase database table by primary key ID and broadcast deletion across all clients.
 */
export async function deleteGlobalFile(id: string): Promise<void> {
  // 1. Broadcast deletion across open tabs instantly
  fileSyncChannel?.postMessage({ type: "DELETE_FILE", id });

  try {
    // 2. Remove matching row directly from Supabase database table
    const { error } = await supabase.from("lab_messages").delete().eq("id", id);
    if (error) {
      console.warn("Delete by primary key ID warning, trying text match:", error);
      // Fallback: delete by text JSON containing id
      await supabase.from("lab_messages").delete().eq("room", ROOM_FILES).ilike("text", `%${id}%`);
    }
  } catch (err) {
    console.error("Failed to delete file from Supabase database:", err);
  }
}
