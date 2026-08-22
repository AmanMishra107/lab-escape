import React, { useEffect, useState } from "react";
import {
  Award,
  Calendar as CalendarIcon,
  CheckCircle2,
  Coffee,
  FileText,
  Flame,
  FolderOpen,
  Gamepad2,
  HelpCircle,
  Laptop,
  Maximize2,
  Minimize2,
  Package,
  Play,
  Puzzle,
  RefreshCw,
  Save,
  Search,
  Settings as SettingsIcon,
  Smartphone,
  Sparkles,
  Terminal,
  Volume2,
  VolumeX,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { HINDI_MEMES_AND_SHAYARI } from "../../data/memesAndShayari";
import { RANDOM_EVENTS } from "../../data/events";
import { LAB_OBJECTS } from "../../data/labObjects";
import { store, useLab } from "../../systems/GameState";
import { writeSave } from "../../systems/SaveSystem";
import { sound } from "../../systems/SoundSystem";

function fmtTime(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

function fmtDate(d: Date) {
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const dayName = days[d.getDay()];
  const dayNum = String(d.getDate()).padStart(2, "0");
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName} | ${dayNum} ${monthName} ${year}`;
}

function fmtClock(d: Date) {
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${m}:${s} ${ampm}`;
}

// ── Indian Holidays Data (Verified 2026) ─────────────────────────
const INDIAN_HOLIDAYS: Record<string, { name: string; type: "national" | "festival" | "regional" | "semester" }> = {
  // ── January ────────────────────────────────────────────────────
  "2026-01-01": { name: "New Year's Day", type: "national" },
  "2026-01-13": { name: "Lohri 🔥", type: "festival" },
  "2026-01-14": { name: "Makar Sankranti / Pongal / Uttarayan", type: "festival" },
  "2026-01-23": { name: "Vasant Panchami (Saraswati Puja) + Netaji Jayanti", type: "festival" },
  "2026-01-26": { name: "Republic Day 🇮🇳", type: "national" },

  // ── February ────────────────────────────────────────────────────
  "2026-02-14": { name: "Valentine's Day (Unofficial Study Holiday 😂)", type: "regional" },
  "2026-02-15": { name: "Maha Shivaratri 🔱", type: "festival" },
  "2026-02-19": { name: "Chhatrapati Shivaji Maharaj Jayanti", type: "national" },

  // ── March ───────────────────────────────────────────────────────
  "2026-03-03": { name: "Holika Dahan (Eve of Holi) 🔥", type: "festival" },
  "2026-03-04": { name: "Holi — Festival of Colours 🎨", type: "festival" },
  "2026-03-21": { name: "Eid al-Fitr (Ramzan Eid) 🌙", type: "festival" },
  "2026-03-22": { name: "Gudi Padwa / Ugadi / Chetichand", type: "festival" },
  "2026-03-29": { name: "Ram Navami", type: "festival" },
  "2026-03-31": { name: "Mahavir Jayanti", type: "festival" },

  // ── April ───────────────────────────────────────────────────────
  "2026-04-02": { name: "Hanuman Jayanti", type: "festival" },
  "2026-04-03": { name: "Good Friday ✝️", type: "national" },
  "2026-04-05": { name: "Easter Sunday 🐣", type: "festival" },
  "2026-04-06": { name: "Easter Monday", type: "festival" },
  "2026-04-14": { name: "Dr. B.R. Ambedkar Jayanti 🙏 / Tamil New Year / Baisakhi 🌾", type: "national" },

  // ── May ─────────────────────────────────────────────────────────
  "2026-05-01": { name: "International Labour Day / Maharashtra Day", type: "national" },
  "2026-05-11": { name: "Buddha Purnima (Vesak) ☸️", type: "festival" },
  "2026-05-28": { name: "Eid al-Adha (Bakrid) 🐐🌙", type: "festival" },

  // ── June ────────────────────────────────────────────────────────
  "2026-06-26": { name: "Muharram / Islamic New Year 🌙", type: "festival" },

  // ── August ──────────────────────────────────────────────────────
  "2026-08-15": { name: "Independence Day 🇮🇳", type: "national" },
  "2026-08-19": { name: "Today — Lab Session 404 🖥️", type: "semester" },
  "2026-08-26": { name: "Onam (Thiruvonam) 🌺 / Milad-un-Nabi 🌙", type: "festival" },
  "2026-08-28": { name: "Raksha Bandhan 🧵", type: "festival" },

  // ── September ───────────────────────────────────────────────────
  "2026-09-04": { name: "Janmashtami (Krishna Jayanti) 🦚", type: "festival" },
  "2026-09-14": { name: "Ganesh Chaturthi 🐘", type: "festival" },
  "2026-09-24": { name: "Ganesh Visarjan (Anant Chaturdashi)", type: "festival" },

  // ── October ─────────────────────────────────────────────────────
  "2026-10-02": { name: "Gandhi Jayanti 🕊️", type: "national" },
  "2026-10-11": { name: "Sharad Navratri Begins 🪔", type: "festival" },
  "2026-10-19": { name: "Sharad Navratri Ends / Maha Navami", type: "festival" },
  "2026-10-20": { name: "Dussehra (Vijayadashami) 🏹", type: "festival" },
  "2026-10-31": { name: "Sardar Vallabhbhai Patel Jayanti", type: "national" },

  // ── November ────────────────────────────────────────────────────
  "2026-11-01": { name: "Kannada Rajyotsava / Kerala Piravi", type: "regional" },
  "2026-11-07": { name: "Chhath Puja (Sandhya Arghya) 🌅", type: "festival" },
  "2026-11-08": { name: "Diwali — Lakshmi Puja 🪔✨ (Main Day)", type: "festival" },
  "2026-11-09": { name: "Govardhan Puja / Padwa", type: "festival" },
  "2026-11-10": { name: "Bhai Dooj 🫂", type: "festival" },
  "2026-11-24": { name: "Guru Nanak Jayanti (Gurpurab) 🙏", type: "festival" },
  "2026-11-26": { name: "Constitution Day of India", type: "national" },

  // ── December ────────────────────────────────────────────────────
  "2026-12-25": { name: "Christmas Day 🎄", type: "national" },
  "2026-12-31": { name: "New Year's Eve 🎆", type: "festival" },
};

const HOLIDAY_TYPE_STYLES = {
  national: { dot: "bg-orange-500", badge: "bg-orange-100 text-orange-800 border-orange-300" },
  festival: { dot: "bg-rose-500", badge: "bg-rose-100 text-rose-800 border-rose-300" },
  regional: { dot: "bg-blue-500", badge: "bg-blue-100 text-blue-800 border-blue-300" },
  semester: { dot: "bg-purple-500", badge: "bg-purple-100 text-purple-800 border-purple-300" },
};

function IndianCalendarPopup({
  now, viewMonth, setViewMonth, onClose,
}: {
  now: Date;
  viewMonth: { y: number; m: number };
  setViewMonth: React.Dispatch<React.SetStateAction<{ y: number; m: number }>>;
  onClose: () => void;
}) {
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const { y, m } = viewMonth;
  const firstDay = new Date(y, m, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Collect holidays for this month view
  const monthHolidays = Object.entries(INDIAN_HOLIDAYS)
    .filter(([key]) => {
      const [ky, km] = key.split("-").map(Number);
      return ky === y && (km ?? 1) - 1 === m;
    })
    .sort(([a], [b]) => a.localeCompare(b));

  const prevMonth = () => setViewMonth(v => {
    const pm = v.m === 0 ? 11 : v.m - 1;
    const py = v.m === 0 ? v.y - 1 : v.y;
    return { y: py, m: pm };
  });
  const nextMonth = () => setViewMonth(v => {
    const nm = v.m === 11 ? 0 : v.m + 1;
    const ny = v.m === 11 ? v.y + 1 : v.y;
    return { y: ny, m: nm };
  });

  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) weeks.push([...week, ...Array(7 - week.length).fill(null)]);

  return (
    <div className="pointer-events-auto absolute right-0 top-full mt-1 z-50 w-[340px] brut border-3 border-lab-ink bg-card shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b-3 border-lab-ink bg-lab-ink px-3 py-2">
        <button onClick={prevMonth} className="text-lab-paper font-black text-lg hover:text-lab-yellow transition-colors px-1">‹</button>
        <div className="text-center">
          <p className="font-mono text-sm font-black text-lab-paper tracking-wider">{MONTHS[m]} {y}</p>
          <p className="font-mono text-[9px] text-stone-400 tracking-widest">INDIAN FESTIVAL CALENDAR</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={nextMonth} className="text-lab-paper font-black text-lg hover:text-lab-yellow transition-colors px-1">›</button>
          <button onClick={onClose} className="text-stone-400 hover:text-lab-paper font-black text-sm ml-1">✕</button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b-2 border-lab-ink/20 bg-stone-100">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
          <div key={d} className={`py-1 text-center font-mono text-[10px] font-black ${d === "Su" || d === "Sa" ? "text-lab-red" : "text-stone-500"}`}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="bg-stone-50">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-stone-200">
            {week.map((day, di) => {
              if (!day) return <div key={di} className="h-9 bg-stone-100/50" />;
              const dateKey = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const holiday = INDIAN_HOLIDAYS[dateKey];
              const isToday = dateKey === todayKey;
              const isWeekend = di === 0 || di === 6;
              return (
                <div
                  key={di}
                  className={`relative h-9 flex flex-col items-center justify-center border-r border-stone-200 last:border-r-0 transition-colors ${isToday ? "bg-lab-ink text-lab-paper" :
                    holiday ? "bg-rose-50 hover:bg-rose-100" :
                      isWeekend ? "bg-orange-50/50 hover:bg-orange-50" :
                        "hover:bg-stone-100"
                    }`}
                  title={holiday?.name}
                >
                  <span className={`font-mono text-[11px] font-bold ${isToday ? "text-lab-paper" :
                    isWeekend ? "text-lab-red" :
                      "text-lab-ink"
                    }`}>{day}</span>
                  {holiday && (
                    <span className={`absolute bottom-0.5 h-1.5 w-1.5 rounded-full ${HOLIDAY_TYPE_STYLES[holiday.type].dot}`} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 border-t-2 border-lab-ink/20 bg-stone-100 px-2 py-1.5">
        {(Object.entries(HOLIDAY_TYPE_STYLES) as [keyof typeof HOLIDAY_TYPE_STYLES, typeof HOLIDAY_TYPE_STYLES[keyof typeof HOLIDAY_TYPE_STYLES]][]).map(([type, s]) => (
          <div key={type} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${s.dot}`} />
            <span className="font-mono text-[9px] text-stone-600 capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Holidays list for this month */}
      {monthHolidays.length > 0 && (
        <div className="border-t-2 border-lab-ink/20 max-h-36 overflow-y-auto">
          <p className="bg-stone-800 px-3 py-1 font-mono text-[9px] font-black tracking-widest text-amber-400">THIS MONTH</p>
          {monthHolidays.map(([key, h]) => {
            const day = parseInt(key.split("-")[2] ?? "0");
            const s = HOLIDAY_TYPE_STYLES[h.type];
            return (
              <div key={key} className="flex items-start gap-2 border-b border-stone-100 px-3 py-1.5 last:border-b-0">
                <span className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[9px] font-black border ${s.badge}`}>
                  {String(day).padStart(2, "0")}
                </span>
                <span className="font-mono text-[10px] text-stone-800 leading-tight">{h.name}</span>
              </div>
            );
          })}
          {monthHolidays.length === 0 && (
            <p className="px-3 py-2 font-mono text-[10px] text-stone-500">No holidays this month. Study harder.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function HeroWorkspaceOverlay() {

  const remaining = useLab(() => store.remainingMs());
  const duration = useLab((s) => s.save.durationMs);
  const boredom = useLab((s) => s.save.boredom);
  const score = useLab((s) => s.save.score);
  const discovered = useLab((s) => s.save.discovered);
  const soundOn = useLab((s) => s.save.settings.sound);
  const openApps = useLab((s) => s.rt.openApps);
  const activeApp = useLab((s) => s.rt.activeApp);

  const [now, setNow] = useState(() => new Date());
  const [coffeeDrunk, setCoffeeDrunk] = useState(false);
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDesktopNav, setShowDesktopNav] = useState(false);
  const [showSystemStatus, setShowSystemStatus] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [calViewMonth, setCalViewMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timerRatio = Math.max(0, Math.min(100, (remaining / (duration || 1)) * 100));

  /* Quick Actions Handlers */
  const handleScanLab = () => {
    sound.play("click");
    store.glitchBurst(0.4);
    const undiscovered = LAB_OBJECTS.filter((o) => !discovered.includes(o.id));
    if (undiscovered.length > 0) {
      const pick = undiscovered[Math.floor(Math.random() * undiscovered.length)]!;
      store.discover(pick.id);
      store.toast("system", "LAB SCAN COMPLETE", `Discovered object: ${pick.label}!`);
    } else {
      store.toast("system", "LAB SCAN COMPLETE", "All 11 lab objects analyzed & mapped!");
    }
  };

  const handleRandomEvent = () => {
    sound.play("pop");
    const e = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)]!;
    store.toast(e.kind, e.title, e.body);
  };

  const handleSaveGame = () => {
    sound.play("click");
    writeSave(store.getSnapshot().save);
    store.toast("system", "GAME SAVED", "Progress & achievements saved to local disk!");
  };

  const handleCoffeeExe = () => {
    sound.play("pop");
    setCoffeeDrunk(true);
    store.reduceBoredom(25);
    store.addXp(50, "Caffeine boost");
    store.toast("system", "COFFEE.EXE EXECUTED", "Boredom reduced by 25%! Energy replenished.");
    setTimeout(() => setCoffeeDrunk(false), 30000);
  };

  const handleDoNotClick = () => {
    sound.play("error");
    store.glitchBurst(1.0);
    store.findEgg("do_not_click_button");
    store.toast("warn", "DO NOT CLICK!", "You were explicitly told not to click that.");
  };

  const handleExcuses = () => {
    sound.play("click");
    const excuses = [
      "My code was compiling.",
      "The wifi in lab 404 broke.",
      "The professor called an emergency meeting.",
      "I was debugging the boredom meter.",
      "It worked on my local machine!",
    ];
    const picked = excuses[Math.floor(Math.random() * excuses.length)]!;
    store.toast("system", "EXCUSES.TXT", picked);
  };

  const handleMemes = () => {
    sound.play("click");
    const memesOnly = HINDI_MEMES_AND_SHAYARI.filter((item) => item.category === "meme");
    const picked = memesOnly[Math.floor(Math.random() * memesOnly.length)]!;
    // Toast notification with 15 seconds (15000ms) timer to read
    store.toast("egg", `${picked.title} (15s TIMER)`, `${picked.body}\n— ${picked.author}`, 15000);
    store.findEgg("do_not_click_button");
  };

  const handleShayari = () => {
    sound.play("click");
    const shayariOnly = HINDI_MEMES_AND_SHAYARI.filter((item) => item.category === "shayari");
    const picked = shayariOnly[Math.floor(Math.random() * shayariOnly.length)]!;
    // Toast notification with 15 seconds (15000ms) timer to read
    store.toast("warn", `${picked.title} (15s TIMER)`, `${picked.body}\n— ${picked.author}`, 15000);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-2 pt-16 sm:p-3 sm:pt-16">
      {/* Top Overlay Grid: Left Navigation Sidebar & Top-Right Timer Card */}
      <div className="flex w-full items-start justify-between gap-3">
        {/* Left Sidebar Window (Desktop OS Nav) — Rendered on demand */}
        {showDesktopNav && (
          <div className="window-in brut pointer-events-auto w-48 shrink-0 border-3 border-lab-ink bg-card shadow-2xl z-50">
            <div className="flex items-center justify-between border-b-3 border-lab-ink bg-stone-800 px-2.5 py-1 text-lab-paper select-none">
              <span className="mono-label text-[10px] tracking-wider text-amber-400 font-bold">DESKTOP OS</span>
              <button
                onClick={() => setShowDesktopNav(false)}
                className="text-stone-300 hover:text-lab-red font-bold text-xs px-1"
                title="Close Window"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col p-1.5 gap-1">
              <button
                onClick={() => {
                  store.focusObject("computer");
                  store.setRt({ activeApp: null });
                  setShowDesktopNav(false);
                }}
                className="brut-sm brut-press flex items-center gap-2 bg-stone-900 px-2 py-1.5 text-left text-xs font-mono font-bold text-lab-paper hover:bg-stone-800"
              >
                <Laptop size={14} className="text-amber-400" />
                <span>DESKTOP</span>
              </button>
              <button
                onClick={() => { store.openApp("terminal"); setShowDesktopNav(false); }}
                className="brut-sm brut-press flex items-center gap-2 bg-stone-100 px-2 py-1.5 text-left text-xs font-mono font-bold text-lab-ink hover:bg-stone-200"
              >
                <Terminal size={14} className="text-emerald-600" />
                <span>TERMINAL</span>
              </button>
              <button
                onClick={() => { store.openApp("games"); setShowDesktopNav(false); }}
                className="brut-sm brut-press flex items-center gap-2 bg-stone-100 px-2 py-1.5 text-left text-xs font-mono font-bold text-lab-ink hover:bg-stone-200"
              >
                <Gamepad2 size={14} className="text-blue-600" />
                <span>GAMES</span>
              </button>
              <button
                onClick={() => { store.openApp("phone"); setShowDesktopNav(false); }}
                className="brut-sm brut-press flex items-center gap-2 bg-stone-100 px-2 py-1.5 text-left text-xs font-mono font-bold text-lab-ink hover:bg-stone-200 justify-between"
              >
                <div className="flex items-center gap-2">
                  <Smartphone size={14} className="text-purple-600" />
                  <span>PHONE</span>
                </div>
                <span className="rounded-full bg-lab-red px-1.5 py-0.2 text-[9px] font-bold text-white">3</span>
              </button>
              <button
                onClick={() => { store.openApp("files"); setShowDesktopNav(false); }}
                className="brut-sm brut-press flex items-center gap-2 bg-stone-100 px-2 py-1.5 text-left text-xs font-mono font-bold text-lab-ink hover:bg-stone-200"
              >
                <FolderOpen size={14} className="text-amber-600" />
                <span>FILES</span>
              </button>
              <button
                onClick={() => { store.openApp("puzzles"); setShowDesktopNav(false); }}
                className="brut-sm brut-press flex items-center gap-2 bg-stone-100 px-2 py-1.5 text-left text-xs font-mono font-bold text-lab-ink hover:bg-stone-200"
              >
                <Puzzle size={14} className="text-teal-600" />
                <span>PUZZLES</span>
              </button>
              <button
                onClick={() => { store.openApp("achievements"); setShowDesktopNav(false); }}
                className="brut-sm brut-press flex items-center gap-2 bg-stone-100 px-2 py-1.5 text-left text-xs font-mono font-bold text-lab-ink hover:bg-stone-200"
              >
                <Award size={14} className="text-yellow-600" />
                <span>TROPHIES</span>
              </button>
              <button
                onClick={() => { store.openApp("settings"); setShowDesktopNav(false); }}
                className="brut-sm brut-press flex items-center gap-2 bg-stone-100 px-2 py-1.5 text-left text-xs font-mono font-bold text-lab-ink hover:bg-stone-200"
              >
                <SettingsIcon size={14} className="text-gray-600" />
                <span>SETTINGS</span>
              </button>
            </div>
          </div>
        )}

        {/* Right Floating Windows (Calendar Date Card) */}
        <div className="flex flex-col items-end gap-2.5 ml-auto mt-1 sm:mt-2 relative">
          {/* Calendar Date Card — clickable */}
          <button
            onClick={() => setShowCalendar(s => !s)}
            className="brut pointer-events-auto flex items-center gap-1.5 border-3 border-lab-ink bg-card px-2 py-1 shadow-md brut-press hover:bg-stone-100 transition-colors sm:gap-2 sm:px-3 sm:py-1.5"
            title="Open Indian Festival Calendar"
          >
            <CalendarIcon size={14} className="text-lab-red stroke-[2.5] sm:size-4" />
            <span className="font-mono text-[10px] font-black tracking-wider text-lab-ink sm:text-xs">{fmtDate(now)}</span>
            <span className="font-mono text-[9px] text-stone-500">▼</span>
          </button>

          {/* Indian Festival Calendar Popup */}
          {showCalendar && (
            <IndianCalendarPopup
              now={now}
              viewMonth={calViewMonth}
              setViewMonth={setCalViewMonth}
              onClose={() => setShowCalendar(false)}
            />
          )}
        </div>
      </div>

      {/* Middle & Right Overlay Grid: System Status & Shortcuts (rendered on-demand via Taskbar toggles) */}
      <div className="flex w-full items-end justify-between gap-3 my-auto pointer-events-none">
        {/* Bottom Left: System Status Window (on demand) */}
        {showSystemStatus && (
          <div className="window-in brut pointer-events-auto w-56 border-3 border-lab-ink bg-card shadow-2xl z-50">
            <div className="flex items-center justify-between border-b-3 border-lab-ink bg-stone-900 px-2.5 py-1 text-lab-paper select-none">
              <span className="mono-label text-[10px] font-bold text-emerald-400">SYSTEM STATUS</span>
              <button onClick={() => setShowSystemStatus(false)} className="text-stone-300 hover:text-lab-red font-bold text-xs px-1">✕</button>
            </div>
            <div className="p-2.5 font-mono text-xs space-y-1.5">
              <div className="flex items-center justify-between border-b border-stone-300 pb-1">
                <span className="text-stone-600 font-bold">PROFESSOR</span>
                <span className="flex items-center gap-1 font-black text-emerald-700">
                  AWAY <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-stone-300 pb-1">
                <span className="text-stone-600 font-bold">WIFI</span>
                <span className="flex items-center gap-1 font-black text-rose-600">
                  CRITICAL <span className="h-2 w-2 rounded-full bg-rose-600" />
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-stone-300 pb-1">
                <span className="text-stone-600 font-bold">ATTENDANCE</span>
                <span className="flex items-center gap-1 font-black text-amber-600">
                  67% <span className="h-2 w-2 rounded-full bg-amber-500" />
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-stone-300 pb-1">
                <span className="text-stone-600 font-bold">MOTIVATION</span>
                <span className="flex items-center gap-1 font-black text-rose-600">
                  NOT FOUND <span className="h-2 w-2 rounded-full bg-rose-600" />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-600 font-bold">COFFEE</span>
                <span className={`flex items-center gap-1 font-black ${coffeeDrunk ? "text-emerald-600" : "text-amber-600"}`}>
                  {coffeeDrunk ? "FULL" : "LOW"}{" "}
                  <span className={`h-2 w-2 rounded-full ${coffeeDrunk ? "bg-emerald-500" : "bg-amber-500"}`} />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Right Overlay Group: Shortcuts Window (on demand) */}
        {showShortcuts && (
          <div className="window-in brut pointer-events-auto w-72 border-3 border-lab-ink bg-card shadow-2xl ml-auto z-50">
            <div className="flex items-center justify-between border-b-3 border-lab-ink bg-stone-900 px-2.5 py-1 text-lab-paper select-none">
              <span className="mono-label text-[10px] font-bold text-stone-300">SHORTCUTS</span>
              <button onClick={() => setShowShortcuts(false)} className="text-stone-300 hover:text-lab-red font-bold text-xs px-1">✕</button>
            </div>
            <div className="grid grid-cols-5 gap-1 p-2">
              <button
                onClick={handleExcuses}
                className="brut-sm brut-press flex flex-col items-center justify-center bg-stone-100 p-1 text-center hover:bg-stone-200"
                title="Excuses.txt"
              >
                <FileText size={15} className="text-blue-600" />
                <span className="mono-label mt-1 text-[7px] leading-tight font-bold">EXCUSES</span>
              </button>
              <button
                onClick={handleMemes}
                className="brut-sm brut-press flex flex-col items-center justify-center bg-stone-100 p-1 text-center hover:bg-stone-200"
                title="Hindi Slang Memes"
              >
                <Sparkles size={15} className="text-yellow-500 fill-yellow-400" />
                <span className="mono-label mt-1 text-[7px] leading-tight font-bold">MEMES</span>
              </button>
              <button
                onClick={handleShayari}
                className="brut-sm brut-press flex flex-col items-center justify-center bg-amber-100 p-1 text-center hover:bg-amber-200 border-amber-400"
                title="Desi Shayari"
              >
                <Flame size={15} className="text-rose-600 fill-rose-500" />
                <span className="mono-label mt-1 text-[7px] leading-tight font-black text-rose-700">SHAYARI</span>
              </button>
              <button
                onClick={handleCoffeeExe}
                className="brut-sm brut-press flex flex-col items-center justify-center bg-stone-100 p-1 text-center hover:bg-stone-200"
                title="Drink Coffee"
              >
                <Coffee size={15} className="text-amber-700" />
                <span className="mono-label mt-1 text-[7px] leading-tight font-bold">COFFEE</span>
              </button>
              <button
                onClick={handleDoNotClick}
                className="brut-sm brut-press flex flex-col items-center justify-center bg-lab-red p-1 text-center text-white hover:bg-red-700"
                title="DO NOT CLICK"
              >
                <X size={15} strokeWidth={3} />
                <span className="mono-label mt-1 text-[7px] leading-tight font-black">NO CLICK</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Row: System Notifications Ticker Bar & OS Taskbar */}
      <div className="w-full flex flex-col gap-1 mt-1 sm:gap-1.5 sm:mt-2">
        {/* System Notifications Ticker Bar — hidden on mobile to avoid vertical clutter */}
        <div className="hidden sm:flex brut pointer-events-auto items-center overflow-hidden border-3 border-lab-ink bg-card px-2 py-1 shadow-md">
          <div className="flex items-center gap-1.5 border-r-2 border-lab-ink pr-2 shrink-0">
            <span className="mono-label text-[9px] font-black text-stone-800 hidden md:block">SYSTEM NOTIFICATIONS</span>
            <span className="mono-label text-[9px] font-black text-stone-800 md:hidden">NOTICES</span>
            <div className="flex gap-0.5 text-[9px] font-mono opacity-70">_ □ ×</div>
          </div>
          <div className="overflow-hidden whitespace-nowrap px-2 text-[10px] font-mono font-bold text-stone-800 sm:px-3 sm:text-xs">
            <div className="inline-block animate-marquee">
              <span className="text-lab-red font-black">🚨 PROFESSOR DETECTED NEARBY!</span>
              <span className="mx-3 opacity-40">|</span>
              <span className="text-amber-600 font-bold">⚠️ ASSIGNMENT DUE SOON</span>
              <span className="mx-3 opacity-40">|</span>
              <span className="text-blue-600 font-bold">ℹ️ COFFEE LOW — CONSIDER REFILL</span>
              <span className="mx-3 opacity-40">|</span>
              <span className="text-emerald-600 font-bold">🎮 10 MINI-GAMES READY IN ARCADE</span>
            </div>
          </div>
        </div>

        {/* Bottom OS Taskbar */}
        <div className="brut pointer-events-auto flex items-center justify-between border-3 border-lab-ink bg-stone-900 p-1 text-lab-paper shadow-xl h-10 sm:h-11">
          {/* Start Menu Button & Taskbar Launcher Apps */}
          <div className="flex items-center gap-1 overflow-x-auto scroll-thin">
            <button
              onClick={() => setShowStartMenu((prev) => !prev)}
              className="brut-sm brut-press flex shrink-0 items-center gap-1 bg-emerald-600 px-2 py-0.5 text-[10px] font-mono font-black text-white hover:bg-emerald-500 shadow-sm sm:gap-1.5 sm:px-3 sm:py-1 sm:text-xs"
            >
              <Play size={11} fill="currentColor" />
              <span>START</span>
            </button>

            <button
              onClick={() => store.openApp("terminal")}
              className="brut-sm flex shrink-0 items-center gap-1 bg-stone-800 px-2 py-0.5 text-[10px] font-mono font-bold text-lab-paper hover:bg-stone-700"
            >
              <Terminal size={11} className="text-emerald-400" />
              <span className="hidden sm:inline">TERMINAL</span>
            </button>

            <button
              onClick={() => store.openApp("phone")}
              className="brut-sm flex shrink-0 items-center gap-1 bg-stone-800 px-2 py-0.5 text-[10px] font-mono font-bold text-lab-paper hover:bg-stone-700"
            >
              <Smartphone size={11} className="text-purple-400" />
              <span className="hidden sm:inline">PHONE</span>
              <span className="ml-0.5 rounded bg-lab-red px-1 text-[8px] text-white">3</span>
            </button>

            <button
              onClick={() => store.openApp("games")}
              className="brut-sm flex shrink-0 items-center gap-1 bg-stone-800 px-2 py-0.5 text-[10px] font-mono font-bold text-lab-paper hover:bg-stone-700"
            >
              <Gamepad2 size={11} className="text-blue-400" />
              <span className="hidden sm:inline">GAMES</span>
            </button>

            <button
              onClick={() => store.openApp("notices")}
              className="brut-sm flex shrink-0 items-center gap-1 bg-stone-800 px-2 py-0.5 text-[10px] font-mono font-bold text-lab-paper hover:bg-stone-700"
            >
              <FileText size={11} className="text-amber-400" />
              <span className="hidden sm:inline">NOTES</span>
            </button>

            {/* Taskbar OS Widget Toggles (Desktop / Status / Shortcuts) */}
            <div className="h-4 w-px bg-stone-700 mx-1 shrink-0 hidden sm:block" />

            <button
              onClick={() => setShowDesktopNav((prev) => !prev)}
              className={`brut-sm flex shrink-0 items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold transition-colors ${showDesktopNav ? "bg-amber-400 text-stone-900 font-black" : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                }`}
              title="Toggle Desktop OS Menu"
            >
              <Laptop size={11} />
              <span className="hidden md:inline">DESKTOP</span>
            </button>

            <button
              onClick={() => setShowSystemStatus((prev) => !prev)}
              className={`brut-sm flex shrink-0 items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold transition-colors ${showSystemStatus ? "bg-emerald-500 text-stone-900 font-black" : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                }`}
              title="Toggle System Status"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="hidden md:inline">STATUS</span>
            </button>

            <button
              onClick={() => setShowShortcuts((prev) => !prev)}
              className={`brut-sm flex shrink-0 items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold transition-colors ${showShortcuts ? "bg-blue-400 text-stone-900 font-black" : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                }`}
              title="Toggle Shortcuts Window"
            >
              <Sparkles size={11} className="text-yellow-400 fill-yellow-400" />
              <span className="hidden md:inline">SHORTCUTS</span>
            </button>
          </div>

          {/* Right Taskbar System Tray */}
          <div className="flex shrink-0 items-center gap-1.5 pl-1 pr-1 text-xs font-mono sm:gap-3 sm:pr-2">
            <button
              onClick={() => store.setSettings({ sound: !soundOn })}
              className="hover:text-amber-400 p-0.5"
              title={soundOn ? "Mute" : "Unmute"}
            >
              {!soundOn ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            <Wifi size={13} className="text-amber-400" />
            <span className="hidden font-bold text-lab-paper sm:inline">{fmtClock(now)}</span>
            <span className="font-bold text-lab-paper text-[10px] sm:hidden">
              {String(new Date().getHours()).padStart(2, "0")}:{String(new Date().getMinutes()).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* Start Menu Popup */}
      {showStartMenu && (
        <div className="brut pointer-events-auto absolute bottom-12 left-3 z-50 w-72 border-3 border-lab-ink bg-card p-3 shadow-2xl">
          <div className="flex items-center justify-between border-b-2 border-lab-ink pb-2 mb-2 bg-stone-900 p-2 text-lab-paper">
            <span className="font-mono text-xs font-black text-amber-400">LAB OS START MENU</span>
            <button onClick={() => setShowStartMenu(false)} className="text-lab-red font-bold text-xs">×</button>
          </div>
          <div className="space-y-1 font-mono text-xs">
            <button
              onClick={() => { store.openApp("games"); setShowStartMenu(false); }}
              className="w-full text-left p-1.5 hover:bg-stone-200 flex items-center gap-2 font-bold"
            >
              🎮 MINI-GAMES ARCADE
            </button>
            <button
              onClick={() => { store.openApp("terminal"); setShowStartMenu(false); }}
              className="w-full text-left p-1.5 hover:bg-stone-200 flex items-center gap-2 font-bold"
            >
              💻 COMMAND TERMINAL
            </button>
            <button
              onClick={() => { store.openApp("phone"); setShowStartMenu(false); }}
              className="w-full text-left p-1.5 hover:bg-stone-200 flex items-center gap-2 font-bold"
            >
              📱 LAB PHONE & APPS
            </button>
            <button
              onClick={() => { store.openApp("achievements"); setShowStartMenu(false); }}
              className="w-full text-left p-1.5 hover:bg-stone-200 flex items-center gap-2 font-bold"
            >
              🏆 ACHIEVEMENTS & STATS
            </button>
            <button
              onClick={() => { store.openApp("settings"); setShowStartMenu(false); }}
              className="w-full text-left p-1.5 hover:bg-stone-200 flex items-center gap-2 font-bold"
            >
              ⚙️ SETTINGS & SOUND
            </button>
            <hr className="border-lab-ink my-1" />
            <button
              onClick={() => { store.escapeEarly(); setShowStartMenu(false); }}
              className="w-full text-left p-1.5 bg-lab-red text-white hover:bg-red-700 flex items-center gap-2 font-bold"
            >
              🚪 SLIP OUT / ESCAPE EARLY
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
