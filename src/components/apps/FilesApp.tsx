import { useEffect, useMemo, useState } from "react";
import { FILE_TREE, type LabFile } from "../../data/files";
import {
  deleteGlobalFile,
  detectLanguageAndExtension,
  fetchGlobalFiles,
  fileSyncChannel,
  getExpiryRemaining,
  isFileExpired,
  publishGlobalFile,
  type SharedCodeFile,
} from "../../systems/liveFiles";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { supabase } from "@/integrations/supabase/client";
import { BrutButton, Tag } from "../ui/brut";
import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  FileCode,
  FolderOpen,
  Globe,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

export function FilesApp() {
  const [activeTab, setActiveTab] = useState<"public" | "system">("public");

  // Public shared files state (100% live database driven by real users)
  const [publicFiles, setPublicFiles] = useState<SharedCodeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<SharedCodeFile | null>(null);
  const [copied, setCopied] = useState(false);

  // Simplified Publish Form State (Name + Code Body)
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // System local files state
  const [folder, setFolder] = useState<LabFile | null>(null);
  const [openSystemFile, setOpenSystemFile] = useState<LabFile | null>(null);

  // Fetch real-time global files & subscribe to Supabase & BroadcastChannel
  useEffect(() => {
    let alive = true;

    void fetchGlobalFiles().then((live) => {
      if (!alive) return;
      setPublicFiles(live);
      setLoading(false);
    });

    // 1. Cross-Tab Sync via BroadcastChannel (0ms instant sync across browser tabs)
    const handleBroadcast = (e: MessageEvent) => {
      const msg = e.data;
      if (!msg || typeof msg !== "object" || !alive) return;
      if (msg.type === "NEW_FILE" && msg.file) {
        setPublicFiles((prev) => (prev.some((f) => f.id === msg.file.id) ? prev : [msg.file, ...prev]));
        sound.play("pop");
        store.toast("system", "📁 FILE SYNCED", `"${msg.file.fileName}" received from other tab.`);
      } else if (msg.type === "DELETE_FILE" && msg.id) {
        setPublicFiles((prev) => prev.filter((f) => f.id !== msg.id));
        setSelectedFile((curr) => (curr?.id === msg.id ? null : curr));
      }
    };
    fileSyncChannel?.addEventListener("message", handleBroadcast);

    // 2. Supabase Real-Time Real Network Sync
    const channel = supabase
      .channel("shared_files_rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "lab_messages", filter: "room=eq.shared_code_files" },
        (payload) => {
          try {
            const raw = payload.new as { id: string; text: string };
            const parsed = JSON.parse(raw.text) as SharedCodeFile;
            parsed.id = raw.id || parsed.id;
            if (!isFileExpired(parsed)) {
              setPublicFiles((prev) => (prev.some((f) => f.id === parsed.id) ? prev : [parsed, ...prev]));
              sound.play("pop");
              store.toast("system", "📁 NEW FILE PUBLISHED", `"${parsed.fileName}" published.`);
            }
          } catch {
            /* ignore */
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "lab_messages" },
        (payload) => {
          const deletedId = payload.old?.id;
          if (deletedId) {
            setPublicFiles((prev) => prev.filter((f) => f.id !== deletedId));
            setSelectedFile((curr) => (curr?.id === deletedId ? null : curr));
          }
        },
      )
      .subscribe();

    return () => {
      alive = false;
      fileSyncChannel?.removeEventListener("message", handleBroadcast);
      void supabase.removeChannel(channel);
    };
  }, []);

  // Delete Handler
  const handleDeleteFile = async (id: string, fileName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sound.play("close");
    setPublicFiles((prev) => prev.filter((f) => f.id !== id));
    if (selectedFile?.id === id) setSelectedFile(null);
    store.toast("system", "FILE DELETED", `"${fileName}" removed.`);

    await deleteGlobalFile(id);
  };

  // Filter public code files
  const filteredPublicFiles = useMemo(() => {
    return publicFiles.filter((f) => {
      if (isFileExpired(f)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mFile = f.fileName.toLowerCase().includes(q);
        const mAssign = f.assignmentName.toLowerCase().includes(q);
        const mAuthor = f.author.toLowerCase().includes(q);
        const mCode = f.code.toLowerCase().includes(q);
        return mFile || mAssign || mAuthor || mCode;
      }
      return true;
    });
  }, [publicFiles, searchQuery]);

  // Simplified Publish Handler (Just Name + Code Body)
  const handlePublishFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !codeInput.trim()) {
      store.toast("warn", "INCOMPLETE FILE", "Please enter a Name/Title and Code.");
      return;
    }

    setSubmitting(true);

    const { fileName, language } = detectLanguageAndExtension(nameInput, codeInput);
    const authorName = nameInput.trim().split(" ")[0] || "Student";

    const newFile = {
      fileName,
      assignmentName: "Student Shared Assignment",
      author: authorName,
      language,
      description: `Published code file (${language.toUpperCase()})`,
      code: codeInput,
    };

    try {
      const published = await publishGlobalFile(newFile);
      setPublicFiles((prev) => [published, ...prev.filter((f) => f.id !== published.id)]);
      sound.play("success");
      store.toast("system", "FILE PUBLISHED!", `"${published.fileName}" published & auto-expires in 1 week.`);

      setNameInput("");
      setCodeInput("");
      setShowPublishModal(false);
    } catch (err) {
      // Fallback local addition if network delay
      const fallbackFile = {
        ...newFile,
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      setPublicFiles((prev) => [fallbackFile, ...prev]);
      sound.play("success");
      store.toast("system", "SAVED LOCALLY", `"${fallbackFile.fileName}" published to vault.`);
      setNameInput("");
      setCodeInput("");
      setShowPublishModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    sound.play("pop");
    store.toast("system", "CODE COPIED", "Source code copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const systemItems = folder?.children ?? FILE_TREE;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 font-mono">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-lab-ink pb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-xl font-black">FILES.EXE — CODE & ASSIGNMENTS</h3>
          <Tag tone="green">
            <Globe size={11} className="inline mr-1" /> PUBLIC NETWORK
          </Tag>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("public");
              sound.play("click");
            }}
            className={`brut-sm mono-label px-2.5 py-1 text-xs transition-colors ${
              activeTab === "public" ? "bg-lab-ink text-lab-paper font-bold" : "bg-card hover:bg-stone-200"
            }`}
          >
            🌐 PUBLIC REPO
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("system");
              sound.play("click");
            }}
            className={`brut-sm mono-label px-2.5 py-1 text-xs transition-colors ${
              activeTab === "system" ? "bg-lab-ink text-lab-paper font-bold" : "bg-card hover:bg-stone-200"
            }`}
          >
            💻 C:\LAB SYSTEM
          </button>
        </div>
      </div>

      {/* ── TAB 1: PUBLIC ASSIGNMENT CODE VAULT ─────────────────────────────── */}
      {activeTab === "public" && (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          {/* Sub-header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-100 p-2 border-2 border-lab-ink rounded-sm">
            {/* Search Input */}
            <div className="brut-sm flex items-center gap-1.5 bg-background px-2 py-1 flex-1 max-w-xs">
              <Search size={14} className="opacity-60 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search file name or code..."
                className="w-full bg-transparent text-xs outline-none"
              />
            </div>

            {/* Simple Publish Button */}
            <BrutButton
              variant="go"
              className="text-xs"
              onClick={() => {
                setShowPublishModal(true);
                sound.play("click");
              }}
            >
              <Plus size={14} className="inline mr-1 stroke-[3]" /> PUBLISH FILE
            </BrutButton>
          </div>

          {/* Banner notification about 1-week auto refresh */}
          <div className="flex items-center justify-between bg-amber-100 border border-amber-400 px-2.5 py-1 text-[10px] text-amber-950 rounded-sm">
            <span className="flex items-center gap-1.5">
              <Clock size={12} className="text-amber-700 shrink-0" />
              <span>
                <strong>WEEKLY REFRESH:</strong> Shared files auto-purge after 1 week (7 days) from publication date.
              </span>
            </span>
            <span className="mono-label text-[9px] font-bold text-amber-700 hidden sm:inline">
              LIVE NETWORK
            </span>
          </div>

          {/* Code Files Grid */}
          <div className="scroll-thin flex-1 grid gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <p className="mono-label col-span-full p-6 text-center text-xs opacity-60">
                Loading shared public files...
              </p>
            ) : filteredPublicFiles.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-lab-ink bg-card">
                <FileCode size={36} className="text-amber-500 mb-2" />
                <p className="mono-label font-bold text-sm">NO PUBLIC FILES MATCHED</p>
                <p className="text-xs opacity-70 mt-1">Publish a code file for everyone!</p>
                <BrutButton variant="go" className="mt-3 text-xs" onClick={() => setShowPublishModal(true)}>
                  + PUBLISH FILE
                </BrutButton>
              </div>
            ) : (
              filteredPublicFiles.map((file) => (
                <div
                  key={file.id}
                  className="brut-sm brut-press flex flex-col justify-between p-3 bg-card border-2 border-lab-ink hover:bg-stone-50 transition-all text-left group"
                >
                  <div>
                    {/* Top Row: File extension badge + Expiry */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="mono-label bg-lab-ink text-lab-paper px-1.5 py-0.5 text-[9px] rounded font-bold uppercase">
                        {file.language}
                      </span>
                      <span className="mono-label text-[8px] text-amber-700 bg-amber-100 px-1 py-0.5 border border-amber-300 font-bold flex items-center gap-1">
                        <Clock size={9} /> {getExpiryRemaining(file.expires_at)}
                      </span>
                    </div>

                    {/* File Name & Author */}
                    <h4 className="font-display text-sm leading-tight text-foreground group-hover:text-sky-700 transition-colors truncate">
                      📄 {file.fileName}
                    </h4>
                    <p className="mono-label text-[9px] text-stone-600 font-bold mt-0.5 truncate">
                      BY: {file.author}
                    </p>
                  </div>

                  {/* Footer Buttons */}
                  <div className="mt-3 border-t border-stone-300 pt-2 flex items-center justify-between text-[10px]">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteFile(file.id, file.fileName, e)}
                      className="mono-label text-rose-600 hover:text-red-700 hover:underline flex items-center gap-1 font-bold text-[9px]"
                      title="Delete file"
                    >
                      <Trash2 size={11} /> DELETE
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(file);
                        sound.play("click");
                      }}
                      className="mono-label bg-lab-ink text-lab-paper px-2 py-0.5 text-[9px] font-bold rounded-sm hover:bg-sky-600 transition-colors"
                    >
                      VIEW CODE →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: LOCAL C:\LAB SYSTEM FILES (Includes DSA Folders & study_material) ── */}
      {activeTab === "system" && (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between border-b border-stone-300 pb-1">
            <span className="mono-label text-xs font-bold">C:\LAB\{folder?.name ?? ""}</span>
            {folder && (
              <BrutButton
                onClick={() => {
                  setFolder(null);
                  setOpenSystemFile(null);
                }}
                className="text-[10px] py-0.5 px-2"
              >
                ← UP LEVEL
              </BrutButton>
            )}
          </div>

          <div className="scroll-thin grid flex-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {systemItems.map((f) => (
              <button
                key={f.name}
                className={`brut-sm brut-press p-3 text-left ${
                  f.kind === "denied"
                    ? "bg-rose-100 border-rose-400 text-rose-950"
                    : f.kind === "locked"
                      ? "bg-muted"
                      : f.kind === "secret"
                        ? "bg-lab-yellow"
                        : "bg-card"
                }`}
                onClick={() => {
                  store.interacted();
                  if (f.kind === "denied") {
                    sound.play("error");
                    store.toast("warn", "SERVICE DENIED", "You are at college! Studying during lab hours is strictly prohibited.");
                    setOpenSystemFile(f);
                  } else if (f.kind === "locked") {
                    sound.play("error");
                    setOpenSystemFile(f);
                  } else if (f.kind === "folder") {
                    sound.play("click");
                    setFolder(f);
                    setOpenSystemFile(null);
                    if (f.name === "DO_NOT_OPEN") store.findEgg("file_do_not_open");
                  } else {
                    sound.play("click");
                    setOpenSystemFile(f);
                    if (f.egg) store.findEgg(f.egg);
                    if (f.kind === "secret") store.reduceBoredom(4);
                  }
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="mono-label text-xs">
                    {f.kind === "denied"
                      ? "⛔"
                      : f.kind === "folder"
                        ? "📁"
                        : f.kind === "locked"
                          ? "🔒"
                          : "📄"}{" "}
                    {f.name}
                  </span>
                  {f.kind === "denied" && <Tag tone="red">DENIED</Tag>}
                  {f.kind === "locked" && <Tag tone="red">LOCKED</Tag>}
                </div>
              </button>
            ))}
          </div>

          {openSystemFile && (
            <div className={`brut-sm max-h-56 overflow-y-auto p-3 font-mono text-xs border-t-2 border-lab-ink ${
              openSystemFile.kind === "denied" ? "bg-rose-900 text-rose-100" : "bg-background"
            }`}>
              <div className="flex items-center justify-between border-b border-current/20 pb-1 mb-2">
                <p className="mono-label font-bold text-sky-500 flex items-center gap-1">
                  {openSystemFile.kind === "denied" && <AlertTriangle size={14} className="text-rose-400" />}
                  {openSystemFile.name}
                </p>
                <button
                  type="button"
                  onClick={() => setOpenSystemFile(null)}
                  className="mono-label text-[10px] opacity-70 hover:opacity-100"
                >
                  [CLOSE X]
                </button>
              </div>

              <pre className="whitespace-pre-wrap leading-relaxed">
                {openSystemFile.kind === "locked"
                  ? openSystemFile.body
                  : openSystemFile.body?.trim()
                    ? openSystemFile.body
                    : "[file is empty]\n\n...menacingly empty."}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ── CODE VIEWER MODAL ──────────────────────────────────────────────── */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4">
          <div className="brut flex max-h-[90vh] w-full max-w-3xl flex-col bg-stone-900 text-lab-paper shadow-2xl border-3 border-lab-ink">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-stone-700 bg-stone-950 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileCode size={18} className="text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-display text-base font-bold text-amber-400 leading-tight truncate">
                    {selectedFile.fileName}
                  </h4>
                  <p className="mono-label text-[9px] text-stone-400 truncate">
                    By {selectedFile.author}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <BrutButton
                  variant="go"
                  className="text-[10px] py-1 px-2.5 flex items-center gap-1"
                  onClick={() => copyToClipboard(selectedFile.code)}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied ? "COPIED!" : "COPY CODE"}</span>
                </BrutButton>

                <BrutButton
                  variant="danger"
                  className="text-[10px] py-1 px-2.5 flex items-center gap-1"
                  onClick={() => handleDeleteFile(selectedFile.id, selectedFile.fileName)}
                >
                  <Trash2 size={12} />
                  <span>DELETE</span>
                </BrutButton>

                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="mono-label font-bold text-stone-400 hover:text-white px-2 py-1 ml-1"
                >
                  ✕ CLOSE
                </button>
              </div>
            </div>

            {/* Sub-bar Expiry & Info */}
            <div className="flex items-center justify-between border-b border-stone-800 bg-stone-900 px-3 py-1.5 text-[10px]">
              <span className="mono-label text-emerald-400 font-bold">
                LANG: {selectedFile.language.toUpperCase()}
              </span>
              <span className="mono-label text-amber-400 font-bold flex items-center gap-1">
                <Clock size={11} /> {getExpiryRemaining(selectedFile.expires_at)} (AUTO-PURGES IN 1 WEEK)
              </span>
            </div>

            {/* Code Body Viewer with line numbers */}
            <div className="scroll-thin min-h-0 flex-1 overflow-auto bg-black p-3 font-mono text-xs text-emerald-400 leading-relaxed select-text">
              <table className="w-full border-collapse">
                <tbody>
                  {selectedFile.code.split("\n").map((line, idx) => (
                    <tr key={idx} className="hover:bg-stone-900/50">
                      <td className="w-10 select-none text-right pr-4 text-stone-600 text-[10px] font-mono">
                        {idx + 1}
                      </td>
                      <td className="whitespace-pre break-all">{line || " "}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── SIMPLIFIED PUBLISH CODE FILE MODAL (NAME + CODE ONLY) ─────────── */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4">
          <div className="brut max-h-[90vh] w-full max-w-lg overflow-y-auto bg-card p-4 shadow-2xl scroll-thin border-3 border-lab-ink">
            <div className="flex items-center justify-between border-b-2 border-lab-ink pb-2 mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-display text-xl font-bold">PUBLISH FILE</h4>
                <Tag tone="green">1-WEEK AUTO PURGE</Tag>
              </div>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="mono-label font-bold text-sm hover:text-lab-red"
              >
                ✕ CLOSE
              </button>
            </div>

            <form onSubmit={handlePublishFile} className="space-y-3 text-xs">
              {/* Name Input */}
              <div>
                <label className="mono-label block text-[10px] mb-1">YOUR NAME / FILE NAME:</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Rahul — exp5_binary_search.cpp"
                  className="brut-sm w-full bg-background px-2 py-2 outline-none font-bold text-xs"
                />
              </div>

              {/* Source Code Area */}
              <div>
                <label className="mono-label block text-[10px] mb-1">FILE CONTENT / SOURCE CODE:</label>
                <textarea
                  required
                  rows={9}
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Paste or type your assignment code or notes here..."
                  className="brut-sm w-full resize-none bg-stone-900 text-emerald-400 p-2 font-mono text-xs outline-none scroll-thin"
                />
              </div>

              {/* Live Auto-Detection Badge */}
              {nameInput.trim() && (
                <div className="bg-sky-100 border border-sky-400 p-2 text-[10px] text-sky-950 font-mono flex items-center justify-between">
                  <span>
                    ✨ <strong>AUTO-DETECTED:</strong> {detectLanguageAndExtension(nameInput, codeInput).fileName}
                  </span>
                  <span className="mono-label bg-sky-600 text-white px-1.5 py-0.5 rounded font-bold text-[9px] uppercase">
                    {detectLanguageAndExtension(nameInput, codeInput).language}
                  </span>
                </div>
              )}

              {/* Expiry Notice */}
              <div className="bg-amber-100 border border-amber-400 p-2 text-[10px] text-amber-950 font-mono">
                ℹ️ <strong>Auto-Purge:</strong> Shared with everyone on network & auto-expires in <strong>1 week (7 days)</strong>.
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1">
                <BrutButton type="button" onClick={() => setShowPublishModal(false)}>
                  CANCEL
                </BrutButton>
                <BrutButton type="submit" variant="go" disabled={submitting}>
                  {submitting ? "PUBLISHING…" : "PUBLISH FILE"}
                </BrutButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
