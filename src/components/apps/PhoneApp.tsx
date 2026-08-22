import { useEffect, useState } from "react";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton } from "../ui/brut";
import { BakchodBot } from "../live/BakchodBot";
import { LiveChat } from "../live/LiveChat";
import { fetchGlobalNotices, isNoticeExpired } from "../../systems/liveNotices";
import { supabase } from "@/integrations/supabase/client";
import { NOTICES, type Notice } from "../../data/notices";

const TABS = [
  { id: "live", name: "💬 LAB CHAT", subtitle: "real friends, real time", icon: "💬" },
  { id: "bot", name: "🤖 BAKCHOD BOT", subtitle: "AI tutor & code roast", icon: "🤖" },
  { id: "dialer", name: "📞 PHONE DIALER", subtitle: "contacts & hotline", icon: "📞" },
  { id: "sms", name: "📩 SMS MESSAGES", subtitle: "inbox & notifications", icon: "📩" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── SECRET CALL DATABASE ────────────────────────────────────────────────────
const SECRET_NUMBERS: Record<string, {
  label: string;
  screen: string;
  toast: string;
  egg?: string;
  xp?: number;
  color?: string;
}> = {
  "4040": {
    label: "Prof. R. Menon — AUTOMATED HOTLINE",
    screen: "📞 CONNECTED: PROF. MENON",
    toast: "Voice prompt: 'The escape passcode is 4040. Please do NOT share this with anyone. Goodbye.'",
    egg: "phone_hotline", xp: 30, color: "text-emerald-400",
  },
  "9876": {
    label: "Rahul (Lab Partner)",
    screen: "📞 CONNECTED: RAHUL",
    toast: "'BHAI finally you called! USB is in drawer tier 2. I am still in canteen send help.'",
    xp: 15, color: "text-sky-400",
  },
  "5555": {
    label: "Campus Canteen (Busy)",
    screen: "📞 BUSY TONE: CANTEEN",
    toast: "Auto-msg: 'Samosa counter currently experiencing 200% traffic. Call again never.'",
    color: "text-amber-400",
  },
  "9999": {
    label: "Lab 404 Security",
    screen: "📞 CONNECTED: SECURITY DISPATCH",
    toast: "'Lab 404 emergency line. State your badge number.' …you hang up immediately.",
    egg: "phone_security", xp: 10, color: "text-red-400",
  },
  "420": {
    label: "???",
    screen: "📞 CONNECTED: CHILL VIBES HOTLINE",
    toast: "A voice whispers: 'Relax bhai. The practical files will submit themselves... probably not.'",
    egg: "phone_420", xp: 20, color: "text-green-400",
  },
  "42": {
    label: "The Answer",
    screen: "📞 CONNECTED: DEEP THOUGHT SUPERCOMPUTER",
    toast: "Deep electronic voice: 'The answer to life, universe, and everything... is 42. Also submit your viva report.'",
    egg: "phone_42", xp: 42, color: "text-purple-400",
  },
  "404": {
    label: "Number Not Found",
    screen: "📞 ERROR 404: NUMBER NOT FOUND",
    toast: "This number does not exist. Much like your attendance record.",
    egg: "phone_404", xp: 5, color: "text-red-400",
  },
  "8008": {
    label: "LMAO",
    screen: "📞 REALLY BRO??",
    toast: "You typed 8008 on a calculator phone and giggled. The professor saw you. +5 shame points.",
    egg: "phone_8008", xp: 8, color: "text-pink-400",
  },
  "1337": {
    label: "ELITE HACKER HOTLINE",
    screen: "📞 CONNECTED: H4CK3R_CENTRAL",
    toast: "Robotic voice: 'Y0ur sk1llz are 1337. Deploy the payload.' You panic and hang up.",
    egg: "phone_leet", xp: 50, color: "text-lime-400",
  },
  "123": {
    label: "Too Easy...",
    screen: "📞 CONNECTED: WIFI ADMIN",
    toast: "'Bhai this is the wifi password. Do NOT share. The password is 123. Have a nice day.'",
    egg: "phone_wifi", xp: 12, color: "text-blue-400",
  },
  "911": {
    label: "Emergency Services",
    screen: "📞 CONNECTED: 911 DISPATCH",
    toast: "Operator: 'What is your emergency?' You: 'I have a segmentation fault.' Operator: 'Sir this is 911.'",
    egg: "phone_911", xp: 10, color: "text-red-500",
  },
  "100": {
    label: "Police Control Room",
    screen: "📞 CONNECTED: POLICE PCR",
    toast: "Officer: 'Haan bolo.' You: 'Mera practical delete ho gaya.' [Long silence] 'Beta, FIR nahi hogi.'",
    egg: "phone_police", xp: 10, color: "text-blue-600",
  },
  "143": {
    label: "❤️ Anonymous",
    screen: "📞 CONNECTED: SECRET ADMIRER",
    toast: "'I love you.' A crumpled chit appears under the desk. It just says 'I love your code output.'",
    egg: "phone_143", xp: 25, color: "text-pink-500",
  },
  "7777": {
    label: "LUCKY STREAK",
    screen: "🎰 JACKPOT LINE — CONNECTED",
    toast: "BINGO! Lucky streak! +50 XP bonus! 'You are one in a million. Now please do your assignment.'",
    egg: "phone_lucky", xp: 77, color: "text-yellow-400",
  },
  "0000": {
    label: "THE VOID",
    screen: "📞 DIALING INTO THE VOID…",
    toast: "[static] [silence] [distant keyboard typing] [a single tear rolls down] [call disconnects]",
    egg: "phone_void", xp: 15, color: "text-slate-400",
  },
  "1234": {
    label: "Too Predictable",
    screen: "📞 CONNECTED: PREDICTABILITY HOTLINE",
    toast: "'This is the most predictable number. Your passwords are probably also 1234. Shame.'",
    xp: 5, color: "text-amber-300",
  },
  "999": {
    label: "Matrix Operator",
    screen: "📞 CONNECTED: THE MATRIX",
    toast: "Trinity: 'Morpheus wants to speak with you. Red pill is in the stationery drawer.' You can't find it.",
    egg: "phone_matrix", xp: 30, color: "text-lime-300",
  },
  "786": {
    label: "Divine Helpline",
    screen: "📞 CONNECTED: BLESSED HOTLINE",
    toast: "'Beta, exam mein achhe number aayenge. But only if you stop playing games and study.'",
    egg: "phone_786", xp: 20, color: "text-amber-500",
  },
  "2048": {
    label: "2048 Helpline",
    screen: "📞 CONNECTED: GAME DEVELOPER",
    toast: "'Yes the game is impossible. That is a feature, not a bug. Have you tried turning it off and walking away?'",
    egg: "phone_2048", xp: 20, color: "text-orange-400",
  },
  "80085": {
    label: "LMAO (again)",
    screen: "📞 BRO REALLY??",
    toast: "You typed 80085. The phone auto-dials the principal. You slam it down. Your heart pounds. You're fine. Maybe.",
    egg: "phone_80085", xp: 8, color: "text-pink-400",
  },
  "3141": {
    label: "π Hotline",
    screen: "📞 CONNECTED: π COMPUTATION CENTER",
    toast: "Voice: '3.14159265358979323846...' The call never ends. You realise you are in an infinite loop.",
    egg: "phone_pi", xp: 31, color: "text-violet-400",
  },
};

const INCOMING_CALLS = [
  { name: "MOM 👩", msg: "Beta kha liya? Lab mein samosa mat khaana. Also submit the practical file." },
  { name: "UNKNOWN NUMBER", msg: "Congratulations! You have won a free laptop. Please share your OTP to claim it. 100% legit." },
  { name: "PROF. MENON 😰", msg: "I can see your screen from here. Please minimize that game immediately." },
  { name: "RAHUL (LAB PARTNER)", msg: "Bhai pass kar de ek baar. I will explain later. Trust me bro." },
  { name: "CANTEEN UNCLE 🍟", msg: "Samosa ready hai. Come fast, today's special: debug-flavoured chutney." },
  { name: "COLLEGE WIFI 📡", msg: "Your bandwidth quota has been exceeded. You watched 4K YouTube during practicals. Shame." },
  { name: "DAD 👨", msg: "Beta, placement season aane wala hai. Stop playing games and open LeetCode. NOW." },
  { name: "BACKBENCHER GROUP 🎉", msg: "Bhai proxy maar dete hain aaj! Sir ne abhi gate se bahar dekha. RUN." },
  { name: "GHOST 👻", msg: "[breathing] [keyboard clicking] [the lights flicker] [nothing]" },
  { name: "AMAZON DELIVERY 📦", msg: "Your package 'Motivation to Study' has been delayed by 3–5 business years." },
];

function PhoneDialer() {
  const [dialed, setDialed] = useState("");
  const [callActive, setCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [callColor, setCallColor] = useState("text-emerald-400");
  const [callLabel, setCallLabel] = useState<string | null>(null);
  const [history, setHistory] = useState<{ num: string; label: string; time: string }[]>([]);
  const [incomingCall, setIncomingCall] = useState<{ name: string; msg: string } | null>(null);
  const [incomingRinging, setIncomingRinging] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Random incoming call every 25–60 seconds
  useState(() => {
    const scheduleNext = () => {
      const delay = 25_000 + Math.random() * 35_000;
      setTimeout(() => {
        const pick = INCOMING_CALLS[Math.floor(Math.random() * INCOMING_CALLS.length)]!;
        setIncomingRinging(true);
        setIncomingCall(pick);
        sound.play("alert");
        // Auto-miss after 8 seconds
        setTimeout(() => {
          setIncomingRinging(false);
          scheduleNext();
        }, 8000);
      }, delay);
    };
    scheduleNext();
  });

  const now = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const handleDigit = (digit: string) => {
    sound.play("key");
    if (!callActive && dialed.length < 10) setDialed((p) => p + digit);
  };

  const handleCall = (num = dialed) => {
    if (!num || callActive) return;
    sound.play("open");
    store.interacted();
    setCallActive(true);
    setCallLabel(null);
    setCallColor("text-emerald-400");
    setCallStatus(`DIALING ${num}…`);

    const secret = SECRET_NUMBERS[num];
    setTimeout(() => {
      sound.play("alert");
      if (secret) {
        setCallStatus(secret.screen);
        setCallColor(secret.color ?? "text-emerald-400");
        setCallLabel(secret.label);
        store.toast("system", secret.label, secret.toast);
        if (secret.egg) store.findEgg(secret.egg);
        if (secret.xp) store.addXp(secret.xp, `Called ${num}`);
      } else {
        setCallStatus("📞 NO ANSWER: Number out of service.");
        setCallColor("text-slate-400");
        setCallLabel("Unknown / Disconnected");
        store.toast("system", "CALL ENDED", `No one picked up ${num}. Try another secret number?`);
      }
      setHistory((prev) => [
        { num, label: secret?.label ?? "Unknown", time: now() },
        ...prev.slice(0, 9),
      ]);
    }, 1800);
  };

  const handleEndCall = () => {
    sound.play("close");
    setCallActive(false);
    setCallStatus(null);
    setCallLabel(null);
  };

  const handlePickup = () => {
    if (!incomingCall) return;
    sound.play("pop");
    setIncomingRinging(false);
    store.toast("system", `📞 ${incomingCall.name}`, incomingCall.msg);
    setIncomingCall(null);
  };

  const handleReject = () => {
    sound.play("click");
    setIncomingRinging(false);
    setIncomingCall(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 lg:flex-row">

      {/* ── LEFT: Keypad + Display ───────────────────── */}
      <div className="flex flex-col gap-2 lg:w-56 shrink-0">

        {/* Incoming Call Banner */}
        {incomingRinging && incomingCall && (
          <div className="animate-pulse rounded border-2 border-lab-red bg-red-900 p-2 text-center">
            <p className="mono-label text-[9px] text-red-300">📳 INCOMING CALL</p>
            <p className="font-mono text-xs font-bold text-white">{incomingCall.name}</p>
            <div className="mt-1 flex gap-1">
              <button
                type="button"
                onClick={handlePickup}
                className="flex-1 rounded bg-emerald-500 py-1 font-mono text-[10px] font-bold text-black hover:bg-emerald-400"
              >
                ✅ ANSWER
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="flex-1 rounded bg-red-500 py-1 font-mono text-[10px] font-bold text-white hover:bg-red-400"
              >
                ❌ REJECT
              </button>
            </div>
          </div>
        )}

        {/* Display */}
        <div className="rounded border-2 border-lab-ink bg-slate-900 p-3 text-center">
          <p className="mono-label text-[9px] text-slate-500">DIALER OS v2.1 — LAB 404</p>
          <div className={`my-1 min-h-8 font-mono text-2xl font-bold tracking-widest ${callActive ? callColor : "text-emerald-400"}`}>
            {dialed || (callActive ? "" : "_ _ _")}
          </div>
          {callLabel && (
            <p className="mono-label text-[9px] text-slate-400 truncate">{callLabel}</p>
          )}
          {callStatus && (
            <p className={`mono-label mt-1 text-[10px] font-bold animate-pulse ${callColor}`}>
              {callStatus}
            </p>
          )}
          {!callActive && !callStatus && (
            <p className="mono-label text-[9px] text-slate-600">dial a secret number...</p>
          )}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-1.5 rounded border-2 border-lab-ink bg-card p-2">
          {["1","2","3","4","5","6","7","8","9","*","0","#"].map((btn) => (
            <button
              key={btn}
              type="button"
              onClick={() => handleDigit(btn)}
              className="brut-sm flex h-9 items-center justify-center bg-background font-mono text-base font-bold hover:bg-lab-yellow active:scale-95 transition-transform"
            >
              {btn}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-1.5">
          {!callActive ? (
            <button
              type="button"
              onClick={() => handleCall()}
              className="flex-1 rounded border-2 border-emerald-500 bg-emerald-500 py-2 font-mono text-xs font-bold text-black hover:bg-emerald-400 transition-colors"
            >
              📞 CALL
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEndCall}
              className="flex-1 animate-pulse rounded border-2 border-red-500 bg-red-600 py-2 font-mono text-xs font-bold text-white hover:bg-red-500"
            >
              🔴 END CALL
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setDialed((p) => p.slice(0, -1));
              sound.play("click");
            }}
            className="rounded border-2 border-lab-ink bg-card px-3 font-mono text-sm font-bold hover:bg-lab-yellow"
          >
            ⌫
          </button>
          <button
            type="button"
            onClick={() => { setDialed(""); setCallStatus(null); setCallLabel(null); sound.play("click"); }}
            className="rounded border-2 border-lab-ink bg-card px-2 font-mono text-[10px] font-bold hover:bg-red-100"
          >
            CLR
          </button>
        </div>
      </div>

      {/* ── RIGHT: Contacts + History + Hints ───────── */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">

        {/* Tabs */}
        <div className="flex gap-1 border-b-2 border-lab-ink pb-1">
          <button
            type="button"
            onClick={() => setShowHint(false)}
            className={`mono-label px-2 py-1 text-[10px] font-bold ${!showHint ? "bg-lab-ink text-lab-paper" : "bg-card hover:bg-slate-200"}`}
          >
            📋 CONTACTS
          </button>
          <button
            type="button"
            onClick={() => setShowHint(true)}
            className={`mono-label px-2 py-1 text-[10px] font-bold ${showHint ? "bg-lab-ink text-lab-paper" : "bg-card hover:bg-slate-200"}`}
          >
            🕵️ SECRET NUMBERS
          </button>
        </div>

        <div className="scroll-thin flex-1 space-y-1.5 overflow-y-auto pr-1">
          {!showHint ? (
            <>
              {/* Speed Dial Contacts */}
              {[
                { name: "HOD Professor", number: "4040", role: "Department Head", note: "Passcode Hotline", icon: "👨‍🏫" },
                { name: "Rahul (Lab Partner)", number: "9876", role: "Coding Buddy", note: "Stuck in canteen", icon: "🧑‍💻" },
                { name: "Campus Canteen", number: "5555", role: "Samosa Supply", note: "Always busy", icon: "🍟" },
                { name: "Lab 404 Security", number: "9999", role: "Security Dispatch", note: "Override helpline", icon: "🛡️" },
              ].map((c) => (
                <div key={c.number} className="flex items-center justify-between rounded border-2 border-lab-ink bg-card p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{c.icon}</span>
                    <div>
                      <p className="font-mono text-xs font-bold">{c.name}</p>
                      <p className="mono-label text-[9px] text-muted-foreground">{c.role} · EXT: {c.number}</p>
                      <p className="mono-label text-[9px] text-amber-600 font-bold">{c.note}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setDialed(c.number); handleCall(c.number); }}
                    className="brut-sm bg-lab-green px-2 py-1 text-[10px] font-bold text-black hover:bg-emerald-400"
                  >
                    📞 {c.number}
                  </button>
                </div>
              ))}

              {/* Call History */}
              {history.length > 0 && (
                <>
                  <div className="border-t-2 border-lab-ink pt-1">
                    <p className="mono-label text-[9px] font-bold text-foreground">RECENT CALLS</p>
                  </div>
                  {history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between rounded border border-slate-300 bg-background px-2 py-1">
                      <div>
                        <span className="font-mono text-[10px] font-bold">{h.num}</span>
                        <span className="mono-label ml-2 text-[9px] text-muted-foreground truncate">{h.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="mono-label text-[9px] opacity-60">{h.time}</span>
                        <button
                          type="button"
                          onClick={() => { setDialed(h.num); handleCall(h.num); }}
                          className="mono-label rounded bg-card px-1.5 py-0.5 text-[9px] hover:bg-lab-yellow border border-lab-ink"
                        >
                          ↩ REDIAL
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          ) : (
            /* Secret Numbers Hint Board */
            <div className="space-y-1">
              <div className="rounded border-2 border-amber-400 bg-amber-50 p-2 text-center">
                <p className="font-mono text-xs font-bold text-amber-800">🕵️ RUMOURED SECRET EXTENSIONS</p>
                <p className="mono-label text-[9px] text-amber-700">Overheard in the lab. Dial at your own risk.</p>
              </div>
              {[
                { num: "42", hint: "The answer to everything" },
                { num: "420", hint: "Chill vibes hotline" },
                { num: "404", hint: "Number not found" },
                { num: "1337", hint: "Elite hacker territory" },
                { num: "143", hint: "Someone left a chit on your desk" },
                { num: "7777", hint: "Lucky streak jackpot line" },
                { num: "911", hint: "Real emergencies only (segfaults don't count)" },
                { num: "999", hint: "Matrix operator" },
                { num: "0000", hint: "The void. Dial if you dare." },
                { num: "3141", hint: "Irrational. Infinite. Unavoidable." },
                { num: "8008", hint: "For the immature (you know why)" },
                { num: "786", hint: "Seek divine intervention before viva" },
                { num: "2048", hint: "Dev support for the impossible game" },
                { num: "123", hint: "Someone's wifi password probably" },
              ].map((s) => (
                <div key={s.num} className="flex items-center justify-between rounded border border-slate-300 bg-card px-2 py-1.5">
                  <div>
                    <span className="font-mono text-xs font-bold text-foreground">{s.num}</span>
                    <p className="mono-label text-[9px] text-muted-foreground">{s.hint}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setDialed(s.num); setShowHint(false); handleCall(s.num); }}
                    className="mono-label rounded border border-lab-ink bg-background px-2 py-0.5 text-[9px] font-bold hover:bg-lab-yellow"
                  >
                    DIAL
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PhoneSMS() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    // Seed with official lab notices first
    const official = NOTICES.filter((n) => !isNoticeExpired(n));
    if (alive) setNotices(official);

    // Then fetch live global notices from Supabase
    void fetchGlobalNotices().then((live) => {
      if (!alive) return;
      const map = new Map<string, Notice>();
      official.forEach((n) => map.set(n.id ?? n.title, n));
      live.forEach((n) => map.set(n.id ?? n.title, n));
      setNotices(Array.from(map.values()));
      setLoading(false);
    });
    setLoading(false);

    // Subscribe to real-time new notices
    const channel = supabase
      .channel("sms_notices_rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "lab_messages", filter: "room=eq.shared_notices" },
        (payload) => {
          try {
            const raw = payload.new as { id: string; text: string; created_at: string };
            const parsed = JSON.parse(raw.text) as Notice;
            parsed.id = parsed.id || raw.id;
            if (!isNoticeExpired(parsed)) {
              setNotices((prev) =>
                prev.some((n) => (n.id ?? n.title) === (parsed.id ?? parsed.title))
                  ? prev
                  : [parsed, ...prev],
              );
              sound.play("pop");
              store.toast("system", "📩 NEW NOTICE", `"${parsed.title}" received.`);
            }
          } catch { /* ignore */ }
        },
      )
      .subscribe();

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const toneStyle = (tone?: string) => {
    if (tone === "chaos") return "border-red-400 bg-red-50";
    if (tone === "warn") return "border-amber-400 bg-amber-50";
    return "border-slate-300 bg-card";
  };

  const senderIcon = (n: Notice) => {
    if (n.category === "event") return "📅";
    if (n.category === "assignment") return "📚";
    if (n.category === "project") return "🚀";
    if (n.tone === "chaos") return "🚨";
    if (n.tone === "warn") return "⚠️";
    return "📢";
  };

  const timeAgo = (iso?: string) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const liveCount = notices.filter((n) => n.isCustom).length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-lab-ink pb-1.5">
        <div className="flex items-center gap-2">
          <span className="mono-label text-xs font-bold text-foreground">📩 NOTICE INBOX</span>
          <span className="mono-label text-[9px] text-sky-600 font-bold">LIVE</span>
        </div>
        <div className="flex items-center gap-1.5">
          {liveCount > 0 && (
            <span className="brut-sm bg-lab-red px-1.5 py-0.5 text-[9px] font-bold text-white">
              {liveCount} NEW
            </span>
          )}
          <span className="brut-sm bg-lab-yellow px-1.5 py-0.5 text-[9px] font-bold text-black">
            {notices.length} MSG{notices.length !== 1 ? "S" : ""}
          </span>
        </div>
      </div>

      {/* Messages List */}
      <div className="scroll-thin flex-1 space-y-2 overflow-y-auto">
        {loading && (
          <p className="mono-label p-4 text-center text-xs opacity-60">Loading notices…</p>
        )}

        {!loading && notices.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
            <span className="text-3xl">📭</span>
            <p className="mono-label font-bold">NO NOTICES</p>
            <p className="text-xs opacity-60">Nothing from the board yet.</p>
          </div>
        )}

        {notices.map((n, i) => {
          const id = n.id ?? n.title + i;
          const expanded = expandedId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setExpandedId(expanded ? null : id)}
              className={`w-full rounded border-2 p-2.5 text-left transition-all hover:shadow-md ${toneStyle(n.tone)}`}
            >
              {/* Row header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base shrink-0">{senderIcon(n)}</span>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-bold leading-tight truncate">{n.sign}</p>
                    <p className="font-mono text-xs font-bold leading-tight truncate">{n.title}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  {n.date && (
                    <span className="mono-label text-[8px] opacity-70">{n.date}</span>
                  )}
                  {n.isCustom && (
                    <span className="mono-label text-[8px] font-bold text-sky-600">LIVE</span>
                  )}
                  <span className="mono-label text-[9px] opacity-50">{expanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Expanded body */}
              {expanded && (
                <div className="mt-2 border-t border-black/10 pt-2">
                  <p className="font-mono text-[11px] leading-relaxed whitespace-pre-line opacity-90">
                    {n.body}
                  </p>
                  {n.expires_at && (
                    <p className="mono-label mt-1.5 text-[8px] opacity-60">
                      AUTO-EXPIRES · {new Date(n.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="mono-label text-center text-[8px] opacity-40">
        Synced with lab bulletin board · notices auto-expire
      </p>
    </div>
  );
}

export function PhoneApp() {
  const [active, setActive] = useState<TabId>("live");

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 sm:flex-row">
      {/* Smartphone Sidebar App Switcher */}
      <div className="flex gap-1.5 overflow-x-auto border-b-3 border-lab-ink pb-2 sm:w-56 sm:flex-col sm:overflow-y-auto sm:border-b-0 sm:border-r-3 sm:pb-0 sm:pr-2">
        <div className="hidden sm:block px-2 py-1 bg-slate-900 text-slate-200 border-2 border-lab-ink rounded mb-1">
          <p className="mono-label text-[10px] font-bold text-sky-400">SMARTPHONE OS v4.0</p>
          <p className="mono-label text-[9px] text-slate-400">STATUS: CONNECTED</p>
        </div>

        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              sound.play("click");
              setActive(t.id);
            }}
            className={`brut-sm mono-label shrink-0 px-2.5 py-2 text-left transition-transform ${
              active === t.id ? "bg-lab-ink text-lab-paper scale-105" : "bg-card text-lab-ink hover:bg-slate-200"
            }`}
          >
            <span className="block font-bold text-xs">{t.name}</span>
            <span className="block text-[9px] normal-case opacity-70">{t.subtitle}</span>
          </button>
        ))}
      </div>

      {/* Main Active Screen */}
      <div className="flex min-h-0 flex-1 flex-col bg-background p-1">
        {active === "live" && <LiveChat />}
        {active === "bot" && <BakchodBot />}
        {active === "dialer" && <PhoneDialer />}
        {active === "sms" && <PhoneSMS />}
      </div>
    </div>
  );
}
