import { useEffect, useMemo, useState } from "react";
import { NOTICES, type Notice, type NoticeCategory } from "../../data/notices";
import { fetchGlobalNotices, isNoticeExpired, postGlobalNotice } from "../../systems/liveNotices";
import { supabase } from "@/integrations/supabase/client";
import { store, useLab } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../ui/brut";
import { Calendar, Plus, Search, AlertTriangle, BookOpen, Rocket, Megaphone, Clock, Globe } from "lucide-react";

export function NoticesApp() {
  const phase = useLab(() => store.phase());
  const customNotices = useLab((s) => s.rt.customNotices);

  // Global shared notices fetched from Supabase
  const [globalNotices, setGlobalNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search state
  const [categoryFilter, setCategoryFilter] = useState<NoticeCategory | "all" | "lab_rules">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State for posting new notice
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formSign, setFormSign] = useState("");
  const [formCategory, setFormCategory] = useState<NoticeCategory>("assignment");
  const [formExpiryMode, setFormExpiryMode] = useState<"1day" | "3days" | "7days" | "custom">("3days");
  const [formCustomDate, setFormCustomDate] = useState("");
  const [formTone, setFormTone] = useState<"normal" | "warn" | "chaos">("normal");
  const [submitting, setSubmitting] = useState(false);

  // Load global shared notices & subscribe to realtime updates
  useEffect(() => {
    let alive = true;
    void fetchGlobalNotices().then((list) => {
      if (alive) {
        setGlobalNotices(list);
        setLoading(false);
      }
    });

    const channel = supabase
      .channel("lab_notices_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "lab_messages", filter: "room=eq.shared_notices" },
        (payload) => {
          try {
            const raw = payload.new as { id: string; text: string };
            const parsed = JSON.parse(raw.text) as Notice;
            parsed.id = parsed.id || raw.id;
            if (!isNoticeExpired(parsed)) {
              setGlobalNotices((prev) => (prev.some((n) => n.id === parsed.id) ? prev : [parsed, ...prev]));
              sound.play("pop");
              store.toast("system", "NEW PUBLIC NOTICE", `"${parsed.title}" posted to the board.`);
            }
          } catch {
            /* ignore invalid payload */
          }
        },
      )
      .subscribe();

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  // Combine Official Lab Instructions + Global Public Notices + Local Notices
  const allNotices = useMemo(() => {
    const map = new Map<string, Notice>();

    // 1. Add official Lab Instructions ONLY (default)
    NOTICES.forEach((n) => map.set(n.id || n.title, n));

    // 2. Add local custom notices
    customNotices.forEach((n) => map.set(n.id || n.title, n));

    // 3. Add global shared public notices
    globalNotices.forEach((n) => map.set(n.id || n.title, n));

    return Array.from(map.values());
  }, [customNotices, globalNotices]);

  // Filter out expired notices & apply user filters
  const visibleNotices = useMemo(() => {
    return allNotices.filter((n) => {
      // 1. Automatic Expiry Removal: If date has passed, hide notice completely!
      if (isNoticeExpired(n)) {
        return false;
      }

      // Phase filter
      if (phase === "normal" || phase === "boredom") {
        if (n.tone === "chaos" && !n.isCustom) return false;
      }

      // Category filter
      if (categoryFilter === "lab_rules") {
        if (n.category !== "announcement" && !n.id?.startsWith("lab_inst")) return false;
      } else if (categoryFilter !== "all") {
        if (n.category !== categoryFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesBody = n.body.toLowerCase().includes(q);
        const matchesSign = n.sign.toLowerCase().includes(q);
        return matchesTitle || matchesBody || matchesSign;
      }

      return true;
    });
  }, [allNotices, phase, categoryFilter, searchQuery]);

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBody.trim()) {
      store.toast("warn", "INCOMPLETE NOTICE", "Please enter a title and notice details.");
      return;
    }

    setSubmitting(true);

    // Calculate Expiration Timestamp
    let expiresAtIso: string | undefined = undefined;
    let dateDisplay = "Active";

    const now = Date.now();
    if (formExpiryMode === "1day") {
      expiresAtIso = new Date(now + 24 * 60 * 60 * 1000).toISOString();
      dateDisplay = "Expires in 24 Hours";
    } else if (formExpiryMode === "3days") {
      expiresAtIso = new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString();
      dateDisplay = "Expires in 3 Days";
    } else if (formExpiryMode === "7days") {
      expiresAtIso = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
      dateDisplay = "Expires in 7 Days";
    } else if (formExpiryMode === "custom" && formCustomDate) {
      const customTime = new Date(formCustomDate).getTime();
      if (!isNaN(customTime)) {
        expiresAtIso = new Date(customTime).toISOString();
        dateDisplay = `Expires: ${new Date(customTime).toLocaleDateString()}`;
      }
    }

    const newNotice: Notice = {
      id: `public_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: formTitle.trim().toUpperCase(),
      body: formBody.trim(),
      sign: formSign.trim() ? `— ${formSign.trim()}` : "— Student Post",
      category: formCategory,
      date: dateDisplay,
      expires_at: expiresAtIso,
      tone: formTone,
      isCustom: true,
    };

    try {
      // 1. Save locally
      store.addCustomNotice(newNotice);

      // 2. Broadcast globally via Supabase to EVERYONE!
      await postGlobalNotice(newNotice);

      sound.play("success");
      store.toast("system", "NOTICE BROADCASTED", "Visible to everyone on the network!");

      // Reset form
      setFormTitle("");
      setFormBody("");
      setFormSign("");
      setFormCustomDate("");
      setShowCreateModal(false);
    } catch {
      // Fallback: still added locally if network is offline
      store.toast("system", "POSTED LOCALLY", "Saved to your notice board.");
      setShowCreateModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryBadge = (cat?: NoticeCategory) => {
    switch (cat) {
      case "event":
        return <span className="mono-label px-1.5 py-0.5 text-[9px] bg-lab-green text-lab-ink border border-lab-ink font-bold flex items-center gap-1"><Calendar size={10} /> EVENT</span>;
      case "assignment":
        return <span className="mono-label px-1.5 py-0.5 text-[9px] bg-lab-yellow text-lab-ink border border-lab-ink font-bold flex items-center gap-1"><BookOpen size={10} /> ASSIGNMENT</span>;
      case "project":
        return <span className="mono-label px-1.5 py-0.5 text-[9px] bg-lab-blue text-lab-paper border border-lab-ink font-bold flex items-center gap-1"><Rocket size={10} /> PROJECT</span>;
      case "announcement":
        return <span className="mono-label px-1.5 py-0.5 text-[9px] bg-card text-foreground border border-lab-ink font-bold flex items-center gap-1"><Megaphone size={10} /> LAB RULE</span>;
      default:
        return <span className="mono-label px-1.5 py-0.5 text-[9px] bg-card text-foreground border border-lab-ink font-bold">NOTICE</span>;
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-lab-ink pb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-xl">LAB BULLETIN BOARD</h3>
          <Tag tone="green"><Globe size={11} className="inline mr-1" /> PUBLIC</Tag>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="brut-sm flex items-center gap-1 bg-background px-2 py-1">
            <Search size={14} className="opacity-60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search instructions..."
              className="w-28 sm:w-36 bg-transparent text-xs outline-none"
            />
          </div>

          <BrutButton
            variant="go"
            className="text-xs"
            onClick={() => {
              setShowCreateModal(true);
              sound.play("click");
            }}
          >
            <Plus size={14} className="inline mr-1 stroke-[3]" /> POST PUBLIC NOTICE
          </BrutButton>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scroll-thin">
        {[
          { key: "all", label: "ALL NOTICES" },
          { key: "lab_rules", label: "📋 LAB INSTRUCTIONS" },
          { key: "assignment", label: "📚 ASSIGNMENTS" },
          { key: "event", label: "📅 EVENTS" },
          { key: "project", label: "🚀 PROJECTS" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setCategoryFilter(tab.key as any);
              sound.play("click");
            }}
            className={`mono-label shrink-0 border-2 border-lab-ink px-2.5 py-1 text-[10px] transition-transform ${
              categoryFilter === tab.key
                ? "bg-lab-yellow text-lab-ink font-bold shadow-md scale-105"
                : "bg-card text-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notice Board Cards Grid */}
      <div className="scroll-thin grid flex-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
        {loading ? (
          <p className="mono-label col-span-full p-4 text-center opacity-70">Loading public notice board...</p>
        ) : visibleNotices.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-lab-ink bg-card">
            <AlertTriangle className="mb-2 text-lab-yellow" size={32} />
            <p className="mono-label font-bold">NO ACTIVE NOTICES</p>
            <p className="text-xs opacity-70 mt-1">Expired notices are automatically removed. Post a new notice!</p>
            <BrutButton variant="go" className="mt-3 text-xs" onClick={() => setShowCreateModal(true)}>
              + POST PUBLIC NOTICE
            </BrutButton>
          </div>
        ) : (
          visibleNotices.map((n, i) => (
            <article
              key={n.id || n.title + i}
              className={`brut-sm relative flex flex-col justify-between p-3.5 transition-transform hover:scale-[1.01] ${
                n.tone === "chaos"
                  ? "bg-lab-red text-lab-paper"
                  : n.tone === "warn"
                    ? "bg-lab-yellow text-lab-ink"
                    : "bg-card text-foreground"
              }`}
              style={{ transform: `rotate(${((i % 3) - 1) * 0.6}deg)` }}
            >
              {/* Push Pin Icon */}
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-lab-red border-2 border-lab-ink shadow-sm" />
              </div>

              <div>
                {/* Header & Badges */}
                <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                  {getCategoryBadge(n.category)}
                  {n.date && (
                    <span className="mono-label text-[9px] opacity-80 font-semibold flex items-center gap-1">
                      <Clock size={10} /> {n.date}
                    </span>
                  )}
                </div>

                {/* Title & Body */}
                <h4 className="font-display text-base sm:text-lg leading-snug">{n.title}</h4>
                <p className="mt-1.5 whitespace-pre-line text-xs sm:text-sm leading-relaxed opacity-90">
                  {n.body}
                </p>
              </div>

              {/* Sign / Issued By Footer */}
              <div className="mt-3 flex items-center justify-between border-t border-current/20 pt-2 text-[10px]">
                <p className="mono-label opacity-80 font-bold">{n.sign}</p>
                {n.expires_at && (
                  <span className="mono-label text-[8px] opacity-70">
                    AUTO-REMOVES ON EXPIRY
                  </span>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {/* Modal Dialog: Post Public Notice */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="brut w-full max-w-md bg-card p-4 shadow-2xl">
            <div className="flex items-center justify-between border-b-2 border-lab-ink pb-2 mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-display text-xl">POST PUBLIC NOTICE</h4>
                <Tag tone="green">EVERYONE</Tag>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="mono-label font-bold text-sm hover:text-lab-red"
              >
                ✕ CLOSE
              </button>
            </div>

            <form onSubmit={handlePostNotice} className="space-y-3">
              {/* Category */}
              <div>
                <label className="mono-label block text-[10px] mb-1">CATEGORY:</label>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {[
                    { key: "assignment", label: "📚 ASSIGNMENT" },
                    { key: "event", label: "📅 EVENT" },
                    { key: "project", label: "🚀 PROJECT" },
                    { key: "announcement", label: "📢 ANNOUNCEMENT" },
                  ].map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setFormCategory(c.key as NoticeCategory)}
                      className={`brut-sm mono-label py-1 text-[10px] text-center ${
                        formCategory === c.key ? "bg-lab-yellow text-lab-ink font-bold" : "bg-background"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="mono-label block text-[10px] mb-1">TITLE / SUBJECT:</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Lab Experiment 5 Submission / Tech Fest 2026"
                  className="brut-sm w-full bg-background px-2 py-1.5 text-xs outline-none"
                />
              </div>

              {/* Expiry Date Selection (Auto-removes once date passes) */}
              <div>
                <label className="mono-label block text-[10px] mb-1">AUTOMATIC EXPIRY (AUTO-REMOVES ON EXPIRY):</label>
                <div className="grid grid-cols-4 gap-1 mb-1.5">
                  {[
                    { key: "1day", label: "24 HOURS" },
                    { key: "3days", label: "3 DAYS" },
                    { key: "7days", label: "7 DAYS" },
                    { key: "custom", label: "CUSTOM DATE" },
                  ].map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setFormExpiryMode(m.key as any)}
                      className={`brut-sm mono-label py-1 text-[9px] text-center ${
                        formExpiryMode === m.key ? "bg-lab-blue text-lab-paper font-bold" : "bg-background"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {formExpiryMode === "custom" && (
                  <input
                    type="datetime-local"
                    required
                    value={formCustomDate}
                    onChange={(e) => setFormCustomDate(e.target.value)}
                    className="brut-sm w-full bg-background px-2 py-1 text-xs outline-none"
                  />
                )}
              </div>

              {/* Content */}
              <div>
                <label className="mono-label block text-[10px] mb-1">NOTICE DETAILS / INSTRUCTIONS:</label>
                <textarea
                  required
                  rows={3}
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Type clear notice details, requirements, or guidelines..."
                  className="brut-sm w-full resize-none bg-background p-2 text-xs outline-none scroll-thin"
                />
              </div>

              {/* Issued By */}
              <div>
                <label className="mono-label block text-[10px] mb-1">ISSUED BY (SIGN):</label>
                <input
                  type="text"
                  value={formSign}
                  onChange={(e) => setFormSign(e.target.value)}
                  placeholder="e.g. Prof. Sharma / Lab Coordinator / Student Council"
                  className="brut-sm w-full bg-background px-2 py-1.5 text-xs outline-none"
                />
              </div>

              {/* Tone */}
              <div>
                <label className="mono-label block text-[10px] mb-1">PRIORITY TONE:</label>
                <div className="flex gap-2">
                  {[
                    { key: "normal", label: "Normal", bg: "bg-card" },
                    { key: "warn", label: "Important (Yellow)", bg: "bg-lab-yellow text-lab-ink" },
                    { key: "chaos", label: "Urgent (Red)", bg: "bg-lab-red text-lab-paper" },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setFormTone(t.key as any)}
                      className={`brut-sm mono-label flex-1 py-1 text-[10px] text-center ${t.bg} ${
                        formTone === t.key ? "ring-2 ring-lab-ink font-bold" : "opacity-75"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <BrutButton type="button" onClick={() => setShowCreateModal(false)}>
                  CANCEL
                </BrutButton>
                <BrutButton type="submit" variant="go" disabled={submitting}>
                  {submitting ? "BROADCASTING…" : "BROADCAST TO EVERYONE"}
                </BrutButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
