import { useEffect, useRef, useState } from "react";
import { OBJECT_MAP } from "../../data/labObjects";
import { store, useLab } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import type { ObjectId } from "../../systems/types";
import { AchievementsApp } from "../apps/AchievementsApp";
import { NoticesApp } from "../apps/NoticesApp";
import { PhoneApp } from "../apps/PhoneApp";
import { Desktop } from "../os/Desktop";
import { BrutButton, Panel, Tag } from "../ui/brut";

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

function ClockPanel() {
  const remaining = useLab(() => store.remainingMs());
  const [clicks, setClicks] = useState(0);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <p className="mono-label">LAB TIME REMAINING</p>
      <button
        className="brut bg-lab-paper px-8 py-6 font-display text-5xl tabular-nums sm:text-7xl"
        onClick={() => {
          sound.play("click");
          store.interacted();
          const n = clicks + 1;
          setClicks(n);
          if (n >= 3) store.findEgg("clock_x3");
        }}
      >
        {fmt(remaining)}
      </button>
      <p className="mono-label opacity-70">The clock is not negotiable. You may still click it.</p>
    </div>
  );
}

function WindowPanel() {
  const [seconds, setSeconds] = useState(0);
  const [mode, setMode] = useState<"day" | "rain" | "night" | "sunset">("day");
  const [planes, setPlanes] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const [birds, setBirds] = useState<{ id: number; x: number; y: number; type: "bird" | "ufo" | "drone" }[]>([]);
  const [score, setScore] = useState(0);
  const [radioActive, setRadioActive] = useState(false);
  const [planeCount, setPlaneCount] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (seconds >= 20) store.findEgg("window_stare");
  }, [seconds]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (Math.random() < 0.6) {
        const id = Date.now();
        const types: ("bird" | "ufo" | "drone")[] = mode === "night" ? ["ufo", "bird"] : ["bird", "drone"];
        const type = types[Math.floor(Math.random() * types.length)]!;
        const newTarget = {
          id,
          x: -10,
          y: 15 + Math.random() * 65,
          type,
        };
        setBirds((prev) => [...prev.slice(-6), newTarget]);
      }
    }, 2800);
    return () => window.clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    const anim = window.setInterval(() => {
      setBirds((prev) =>
        prev
          .map((b) => ({ ...b, x: b.x + 2.5 }))
          .filter((b) => b.x < 110),
      );
      setPlanes((prev) =>
        prev
          .map((p) => ({ ...p, x: p.x + 3.5, y: p.y - 0.4 }))
          .filter((p) => p.x < 110),
      );
    }, 50);
    return () => window.clearInterval(anim);
  }, []);

  useEffect(() => {
    if (!radioActive) return;
    const interval = window.setInterval(() => {
      store.reduceBoredom(1);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [radioActive]);

  const throwPaperPlane = () => {
    sound.play("pop");
    store.interacted();
    store.reduceBoredom(8);
    store.addXp(10, "Paper plane launched");
    const count = planeCount + 1;
    setPlaneCount(count);

    if (count >= 3) {
      store.findEgg("paper_pilot");
      store.unlock("paper_pilot");
    }

    const planeTexts = [
      "24.5m ➔ Landed on canteen roof!",
      "38.1m ➔ Flew past HOD's office window!",
      "19.2m ➔ Caught in tree branch!",
      "45.0m ➔ Flew out of campus boundaries!",
    ];

    const text = planeTexts[Math.floor(Math.random() * planeTexts.length)]!;
    setPlanes((prev) => [...prev, { id: Date.now(), x: 10, y: 70, text }]);
  };

  const catchTarget = (id: number, type: string) => {
    sound.play(type === "ufo" ? "glitch" : "success");
    store.interacted();
    store.reduceBoredom(6);
    store.addXp(15, `Spotted ${type}`);
    setScore((s) => s + 1);
    setBirds((prev) => prev.filter((b) => b.id !== id));

    if (type === "ufo") {
      store.findEgg("ufo_spotter");
      store.unlock("ufo_spotter");
      store.toast("egg", "🛸 UFO SPOTTED!", "The aliens are monitoring Lab 404.");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-lab-ink bg-card p-2">
        <div className="flex items-center gap-1.5">
          <span className="mono-label text-[10px] opacity-70">WEATHER:</span>
          {[
            { key: "day", label: "☀️ DAY", bg: "bg-amber-300 text-black" },
            { key: "rain", label: "🌧️ STORM", bg: "bg-slate-700 text-white" },
            { key: "night", label: "🌌 NIGHT", bg: "bg-indigo-950 text-cyan-300" },
            { key: "sunset", label: "🌇 SUNSET", bg: "bg-rose-500 text-white" },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => {
                setMode(m.key as any);
                sound.play("click");
                store.reduceBoredom(3);
              }}
              className={`brut-sm mono-label px-2 py-0.5 text-[10px] transition-transform ${mode === m.key ? `${m.bg} font-bold scale-105 shadow-md` : "bg-card text-foreground opacity-80"
                }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Lo-Fi Radio */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setRadioActive((r) => !r);
              sound.play(radioActive ? "close" : "open");
              store.interacted();
            }}
            className={`brut-sm mono-label px-2 py-0.5 text-[10px] ${radioActive ? "bg-lab-green text-lab-ink font-bold animate-pulse" : "bg-card"
              }`}
          >
            📻 LO-FI RADIO: {radioActive ? "ON (REDUCING BOREDOM)" : "OFF"}
          </button>

          <Tag tone="yellow">OBSERVED: {seconds}s</Tag>
        </div>
      </div>

      {/* Outdoor View Display */}
      <div
        className={`relative min-h-0 flex-1 overflow-hidden border-3 border-lab-ink transition-colors duration-500 ${mode === "day"
            ? "bg-gradient-to-b from-sky-400 via-sky-200 to-amber-100"
            : mode === "rain"
              ? "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700"
              : mode === "night"
                ? "bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900"
                : "bg-gradient-to-b from-rose-500 via-amber-400 to-amber-200"
          }`}
      >
        {/* Rain animation overlay */}
        {mode === "rain" && (
          <div className="pointer-events-none absolute inset-0 opacity-40 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(255,255,255,0.6)_100%)] bg-[length:3px_40px] animate-pulse" />
        )}

        {/* Sun / Moon */}
        {mode === "day" && (
          <div className="absolute top-6 right-12 h-14 w-14 rounded-full bg-yellow-300 border-3 border-lab-ink shadow-[0_0_20px_rgba(253,224,71,0.8)]" />
        )}
        {mode === "night" && (
          <div className="absolute top-6 right-12 h-12 w-12 rounded-full bg-slate-100 border-3 border-lab-ink shadow-[0_0_25px_rgba(241,245,249,0.9)]">
            <div className="absolute top-2 left-2 h-3 w-3 rounded-full bg-slate-300 opacity-60" />
          </div>
        )}
        {mode === "sunset" && (
          <div className="absolute bottom-16 right-1/3 h-20 w-20 rounded-full bg-rose-400 border-3 border-lab-ink opacity-90 shadow-lg" />
        )}

        {/* Campus Skyline */}
        <svg
          viewBox="0 0 1000 300"
          className="pointer-events-none absolute bottom-0 w-full h-40"
          preserveAspectRatio="none"
        >
          <path d="M0 180 L120 90 L240 180 L400 70 L580 190 L750 100 L1000 200 V300 H0 Z" fill="#1e293b" opacity="0.8" />
          <path d="M0 220 L180 140 L350 220 L600 130 L800 210 L1000 160 V300 H0 Z" fill="#0f172a" />
          <rect x="150" y="160" width="70" height="140" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="520" y="140" width="90" height="160" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="780" y="170" width="60" height="130" fill="#0f172a" stroke="#334155" strokeWidth="2" />
        </svg>

        {/* Window Frame Grid Overlay */}
        <div className="pointer-events-none absolute inset-0 border-[12px] border-lab-ink">
          <div className="absolute top-0 bottom-0 left-1/2 w-3 -translate-x-1/2 bg-lab-ink" />
          <div className="absolute left-0 right-0 top-1/2 h-3 -translate-y-1/2 bg-lab-ink" />
        </div>

        {/* Flying Targets (Birds, Drones, UFOs) */}
        {birds.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => catchTarget(b.id, b.type)}
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 active:scale-95"
          >
            {b.type === "ufo" ? (
              <span className="brut-sm text-lg bg-emerald-400 text-black px-2 py-0.5 font-bold shadow-lg">
                🛸 UFO!
              </span>
            ) : b.type === "drone" ? (
              <span className="brut-sm text-xs bg-sky-300 text-black px-1.5 py-0.5 font-bold">
                🛸 DRONE
              </span>
            ) : (
              <span className="text-2xl drop-shadow-md">🕊️</span>
            )}
          </button>
        ))}

        {/* Flying Paper Planes */}
        {planes.map((p) => (
          <div
            key={p.id}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            className="pointer-events-none absolute z-20 flex items-center gap-1.5 -translate-x-1/2 -translate-y-1/2"
          >
            <span className="text-2xl">✈️</span>
            <span className="mono-label text-[10px] bg-lab-yellow text-lab-ink px-1.5 py-0.5 border border-lab-ink font-bold shadow-md">
              {p.text}
            </span>
          </div>
        ))}
      </div>

      {/* Dashboard Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-lab-ink bg-card p-2">
        <div className="flex items-center gap-2">
          <BrutButton variant="warn" className="text-xs" onClick={throwPaperPlane}>
            ✈️ THROW PAPER PLANE ({planeCount})
          </BrutButton>
          <span className="mono-label text-[10px] opacity-80 font-bold">
            SPOTTED: {score} TARGETS
          </span>
        </div>

        <p className="mono-label text-[10px] text-center opacity-70">
          Click flying birds & UFOs outside the window to score XP and obliterate boredom!
        </p>
      </div>
    </div>
  );
}

function DeskPanel() {
  const count = useLab((s) => s.rt.doNotClickCount);
  const [pixelFound, setPixelFound] = useState(false);
  const messages = ["DO NOT CLICK", "You clicked it.", "I told you not to.", "Bro.", "Stop.", "Fine."];
  return (
    <div className="grid h-full gap-3 sm:grid-cols-2">
      <Panel title="STICKY NOTES" className="bg-lab-yellow">
        <ul className="space-y-2 text-sm">
          <li>“wifi pwd: ask nobody”</li>
          <li>“fire exit code — check whiteboard corner”</li>
          <li>“practical file DUE (this is from last month)”</li>
          <li>“the printer knows”</li>
        </ul>
      </Panel>
      <div className="space-y-3">
        <Panel title="UNLABELLED BUTTON">
          <BrutButton
            variant={count >= 5 ? "danger" : "warn"}
            className="w-full"
            onClick={() => {
              const n = count + 1;
              store.setRt({ doNotClickCount: n });
              store.interacted();
              sound.play(n >= 5 ? "glitch" : "click");
              if (n >= 5) {
                store.glitchBurst(1);
                store.findEgg("do_not_click");
                store.unlock("do_not_click");
              }
            }}
          >
            {messages[Math.min(count, messages.length - 1)]}
          </BrutButton>
        </Panel>
        <Panel title="DESK SURFACE">
          <p className="text-sm">Scratched into the laminate: “I was here. Twice. Against my will.”</p>
          <button
            aria-label="A single pixel"
            className="mt-3 h-[3px] w-[3px] bg-lab-ink"
            onClick={() => {
              setPixelFound(true);
              store.findEgg("pixel");
            }}
          />
          {pixelFound && <p className="mono-label mt-2">PIXEL FOUND. Type FOUND in the hidden-object puzzle.</p>}
        </Panel>
      </div>
    </div>
  );
}

interface DrawerItem {
  id: string;
  name: string;
  icon: string;
  desc: string;
  clue?: string;
  collectibleId?: "usb" | "chip" | "attendance_slip";
}

function DrawerPanel() {
  const [activeTier, setActiveTier] = useState<0 | 1 | 2>(0);
  const [falseBottomOpened, setFalseBottomOpened] = useState(false);
  const [inspectedItem, setInspectedItem] = useState<DrawerItem | null>(null);

  const [collectedItems, setCollectedItems] = useState<string[]>([]);

  const TIERS = [
    { id: 0, label: "TOP DRAWER", title: "Stationery & Junk", icon: "✏️" },
    { id: 1, label: "MIDDLE DRAWER", title: "Lab Manuals & USB", icon: "📁" },
    { id: 2, label: "BOTTOM DRAWER", title: "False Bottom & Chip", icon: "🔒" },
  ] as const;

  const DRAWER_ITEMS: DrawerItem[][] = [
    // Top Drawer (Tier 0)
    [
      {
        id: "id_card",
        name: "Student ID Card (2018)",
        icon: "🆔",
        desc: "Belongs to a senior from 2018. The roll number in the corner reads 4040.",
        clue: "🔑 HINT: 4040 is the professor's passcode!",
      },
      {
        id: "broken_pen",
        name: "Dried Dry-Erase Pen",
        icon: "🖊️",
        desc: "Completely out of ink. Someone pressed too hard on the whiteboard.",
      },
      {
        id: "ruler",
        name: "Steel Metric Ruler",
        icon: "📏",
        desc: "30cm steel ruler. Useful for drawing straight lines or threatening wifi routers.",
      },
      {
        id: "candy",
        name: "Crumpled Candy Wrapper",
        icon: "🍬",
        desc: "A dusty wrapper from 2021. Smells vaguely like mango.",
      },
    ],
    // Middle Drawer (Tier 1)
    [
      {
        id: "lab_manual",
        name: "Physics Lab Manual 2024",
        icon: "📘",
        desc: "Stapled with hope and covered in coffee stains. Experiment 7 is bookmarked.",
      },
      {
        id: "usb_drive",
        name: "Bootable USB Flash Drive",
        icon: "💾",
        desc: "Red USB stick labeled 'LAB_RECOVERY_KEY'. Essential for computer diagnostics.",
        collectibleId: "usb",
      },
      {
        id: "attendance_slip",
        name: "Crumpled Attendance Slip",
        icon: "📜",
        desc: "Official attendance record. The HOD signature is surprisingly illegible.",
        collectibleId: "attendance_slip",
      },
    ],
    // Bottom Drawer (Tier 2)
    [
      {
        id: "manual_old",
        name: "Old Operating System Manual",
        icon: "📕",
        desc: "MS-DOS 6.22 Technical Reference Manual.",
      },
      {
        id: "false_latch",
        name: "Wooden False Bottom Compartment",
        icon: "🔒",
        desc: "The bottom wood panel feels loose. Slide the latch to open the hidden compartment!",
      },
    ],
  ];

  const handleCollect = (item: DrawerItem) => {
    if (!item.collectibleId) return;
    sound.play("success");
    store.interacted();

    if (!collectedItems.includes(item.id)) {
      setCollectedItems((prev) => [...prev, item.id]);
      store.giveItem(item.collectibleId);
      store.addXp(30, `Found ${item.name}`);
      store.reduceBoredom(15);
      store.toast("system", "ITEM COLLECTED", `${item.name} added to your Backpack!`);

      if (item.collectibleId === "chip") {
        store.findEgg("drawer_bottom");
      }
    }
  };

  const handleOpenFalseBottom = () => {
    sound.play("open");
    store.interacted();
    setFalseBottomOpened(true);
    store.addXp(25, "Unlocked false bottom");
    store.toast("system", "FALSE BOTTOM OPENED!", "Discovered secret hidden compartment!");
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Tier Selector Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-lab-ink bg-card p-2">
        <div className="flex items-center gap-1.5">
          <span className="mono-label text-[10px] opacity-70">CABINET TIER:</span>
          {TIERS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTier(t.id);
                setInspectedItem(null);
                sound.play("click");
                store.interacted();
              }}
              className={`brut-sm mono-label px-2.5 py-1 text-xs font-bold transition-transform ${activeTier === t.id
                  ? "bg-lab-ink text-lab-paper scale-105 shadow-md"
                  : "bg-lab-yellow text-lab-ink hover:bg-yellow-300"
                }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <span className="mono-label text-[10px] font-bold text-amber-700">
          LOCATION: UNDER DESK CABINET
        </span>
      </div>

      {/* Main Interactive Drawer Interior View */}
      <div className="grid h-full min-h-0 gap-3 lg:grid-cols-12">
        {/* Drawer Compartment Surface (7 cols) */}
        <div className="relative flex min-h-0 flex-col rounded border-3 border-lab-ink bg-amber-900 p-3 shadow-inner lg:col-span-7">
          <div className="mb-2 flex items-center justify-between border-b border-amber-700 pb-1 text-amber-100">
            <span className="mono-label text-xs font-bold text-amber-200">
              📂 {TIERS[activeTier].label} — {TIERS[activeTier].title.toUpperCase()}
            </span>
            <span className="mono-label text-[10px] opacity-80">CLICK ITEMS TO INSPECT</span>
          </div>

          {/* Drawer Interior Box */}
          <div className="relative min-h-0 flex-1 overflow-y-auto rounded border-2 border-amber-950 bg-amber-950/70 p-3 shadow-inner scroll-thin">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(DRAWER_ITEMS[activeTier] || []).map((item) => {
                const isCollected = collectedItems.includes(item.id);
                const isSelected = inspectedItem?.id === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setInspectedItem(item);
                      sound.play("click");
                    }}
                    className={`group relative flex flex-col items-center justify-center rounded border-2 p-3 text-center transition-all ${isSelected
                        ? "border-lab-yellow bg-amber-800 scale-105 ring-2 ring-lab-yellow"
                        : "border-amber-800 bg-amber-900/90 hover:border-amber-500 hover:bg-amber-800/80"
                      }`}
                  >
                    <span className="text-3xl transition-transform group-hover:scale-110">{item.icon}</span>
                    <span className="mono-label mt-2 text-[11px] font-bold text-amber-100 line-clamp-1">
                      {item.name}
                    </span>

                    {isCollected && (
                      <span className="absolute right-1 top-1 rounded bg-emerald-500 px-1 py-0.2 text-[8px] font-bold text-black">
                        COLLECTED
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* False Bottom Section in Tier 2 */}
            {activeTier === 2 && (
              <div className="mt-4 border-t-2 border-dashed border-amber-700 pt-3">
                {!falseBottomOpened ? (
                  <div className="flex flex-col items-center justify-center rounded border-2 border-dashed border-amber-500 bg-amber-900/80 p-4 text-center">
                    <span className="text-2xl">🔒</span>
                    <p className="mono-label mt-1 text-xs text-amber-200 font-bold">FALSE BOTTOM DETECTED</p>
                    <p className="mt-1 text-[11px] text-amber-300 opacity-90 max-w-xs">
                      There is a hidden compartment beneath the bottom drawer wood panel!
                    </p>
                    <BrutButton variant="warn" className="mt-2 text-xs" onClick={handleOpenFalseBottom}>
                      🔑 SLIDE LATCH & OPEN FALSE BOTTOM
                    </BrutButton>
                  </div>
                ) : (
                  <div className="rounded border-2 border-emerald-500 bg-emerald-950/80 p-3 shadow-lg">
                    <div className="flex items-center justify-between border-b border-emerald-700 pb-1 mb-2">
                      <span className="mono-label text-xs font-bold text-emerald-300">
                        ✨ SECRET FALSE BOTTOM COMPARTMENT
                      </span>
                      <span className="mono-label text-[9px] bg-emerald-500 text-black font-bold px-1.5 py-0.2 rounded">UNLOCKED</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">📟</span>
                        <div>
                          <p className="mono-label text-xs font-bold text-emerald-100">DO NOT LOSE CHIP</p>
                          <p className="text-[10px] text-emerald-300">Lab 404 Emergency Hardware Override Security Chip.</p>
                        </div>
                      </div>

                      <BrutButton
                        variant="go"
                        className="text-xs shrink-0"
                        disabled={collectedItems.includes("chip_item")}
                        onClick={() => {
                          handleCollect({
                            id: "chip_item",
                            name: "DO NOT LOSE CHIP",
                            icon: "📟",
                            desc: "Security override chip labeled DO NOT LOSE.",
                            collectibleId: "chip",
                          });
                        }}
                      >
                        {collectedItems.includes("chip_item") ? "✔ IN BAG" : "⚡ TAKE CHIP"}
                      </BrutButton>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Item Details Inspection Panel (5 cols) */}
        <div className="flex min-h-0 flex-col gap-2 lg:col-span-5">
          <Panel title="ITEM INSPECTION & CLUES" className="flex min-h-0 flex-1 flex-col">
            {inspectedItem ? (
              <div className="flex flex-1 flex-col justify-between p-1">
                <div>
                  <div className="flex items-center gap-3 border-b-2 border-lab-ink pb-2">
                    <span className="text-4xl">{inspectedItem.icon}</span>
                    <div>
                      <h4 className="font-display text-base font-bold text-foreground">{inspectedItem.name}</h4>
                      <Tag tone="yellow">DRAWER TIER {activeTier + 1}</Tag>
                    </div>
                  </div>

                  <p className="mt-3 font-mono text-xs leading-relaxed text-foreground opacity-90">
                    {inspectedItem.desc}
                  </p>

                  {inspectedItem.clue && (
                    <div className="mt-3 rounded border-2 border-lab-red bg-red-100 p-2 text-xs font-mono font-bold text-red-900">
                      {inspectedItem.clue}
                    </div>
                  )}
                </div>

                <div className="mt-4 border-t border-lab-ink pt-2">
                  {inspectedItem.collectibleId ? (
                    <BrutButton
                      variant="go"
                      className="w-full text-xs"
                      disabled={collectedItems.includes(inspectedItem.id)}
                      onClick={() => handleCollect(inspectedItem)}
                    >
                      {collectedItems.includes(inspectedItem.id) ? "✔ COLLECTED IN BACKPACK" : `🎒 TAKE ${inspectedItem.name.toUpperCase()}`}
                    </BrutButton>
                  ) : (
                    <p className="mono-label text-[10px] text-center opacity-60">
                      Item examined. No physical pickup required.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center opacity-60">
                <span className="text-4xl">🔍</span>
                <p className="mono-label mt-2 text-xs">Select any item in the drawer to inspect details & clues.</p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function PrinterPanel() {
  const [title, setTitle] = useState("PRACTICAL FILE 2026");
  const [text, setText] = useState(
    "EXPERIMENT 7: OBSERVATION & LOGIC CONTROL\n\nObjective: Escape Lab 404 before time expires.\nStatus: Practical file incomplete.\nPasscode Hint: Whiteboard top-right corner [4040].\n\nCode snippet:\nwhile (!escaped) {\n  solvePuzzles();\n  reduceBoredom();\n}"
  );
  const [prints, setPrints] = useState<string[]>([
    "SYS_INIT — Printer 2 Online (No Ink Required)",
    "PRACTICAL_FILE_V1.DOCX — Queue Ready",
  ]);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [jammed, setJammed] = useState(false);
  const [ejectedPaper, setEjectedPaper] = useState<string | null>(null);

  const TEMPLATES = [
    {
      label: "📄 LAB PRACTICAL",
      title: "LAB 404 PRACTICAL REPORT 2026",
      text: "COURSE: CS-404 COMPUTER SCIENCE PRACTICAL\nTITLE: SYSTEM DIAGNOSTICS & LOGIC PUZZLES\n\nSUMMARY:\nAll system tests executed successfully. Whiteboard passcode verified as 4040. Terminal access granted.\n\nCONCLUSION:\nStudent is ready for viva examination.",
    },
    {
      label: "📑 VIVA CHEAT SHEET",
      title: "PROFESSOR'S VIVA QUESTION BANK & KEY",
      text: "VIVA SHORTCUTS:\nQ1: What is the time complexity of QuickSort?\nA1: Average O(N log N), Worst O(N^2).\n\nQ2: What is the escape code for Lab 404?\nA2: 4040 (Reversed room number).\n\nQ3: What to answer if professor asks about practical file?\nA3: Say 'It's currently printing from Printer 2, sir!'",
    },
    {
      label: "📜 LEAVE APPLICATION",
      title: "EMERGENCY LEAVE APPLICATION",
      text: "To,\nThe HOD, Computer Science Department\nLab 404\n\nRespected Sir,\nI request permission to leave Lab 404 early today due to an urgent emergency: my code has compiled on the first try.\n\nThanking you,\nStudent #404",
    },
    {
      label: "🔍 ESCAPE DIAGNOSTIC",
      title: "LAB 404 SYSTEM ERROR LOG & ESCAPE SCHEMATIC",
      text: "CRITICAL ALERT: Emergency override protocol active.\n\n1. Locate Whiteboard passcode [4040].\n2. Enter code into Password puzzle in Puzzles app.\n3. Dig into desk drawer for USB & Chip.\n4. Run 'run lab_escape' on terminal desktop.\n\nSTATUS: ESCAPE HATCH UNLOCKED.",
    },
  ];

  const doPrint = () => {
    if (!text.trim()) return;
    if (jammed) {
      sound.play("error");
      store.toast("warn", "PAPER JAM!", "Clear the paper jam before printing again.");
      return;
    }

    sound.play("pop");
    store.interacted();
    setPrinting(true);
    setProgress(0);

    // Random chance of paper jam for fun interactive game mechanics (15%)
    const willJam = Math.random() < 0.15 && prints.length > 2;

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setPrinting(false);

          if (willJam) {
            setJammed(true);
            sound.play("error");
            store.glitchBurst(0.6);
            store.toast("warn", "PAPER JAM DETECTED!", "Printer 2 feed rollers jammed! Press 'CLEAR JAM'.");
          } else {
            sound.play("success");
            const entry = `${title || "UNTITLED"} — ${text.trim().split(/\s+/).length} words printed`;
            const next = [entry, ...prints];
            setPrints(next.slice(0, 8));
            setReady(true);
            setEjectedPaper(title || "PRINTED DOCUMENT");
            store.addXp(20, "Printed document");
            store.reduceBoredom(10);

            if (next.length >= 3) {
              store.findEgg("printer_spam");
              store.giveItem("note");
            }
          }
          return 100;
        }
        sound.play("key");
        return p + 20;
      });
    }, 150);
  };

  const handleClearJam = () => {
    sound.play("click");
    store.interacted();
    setJammed(false);
    store.toast("system", "PAPER JAM CLEARED", "Feed rollers aligned. Printer 2 is ready.");
    store.addXp(15, "Fixed paper jam");
  };

  const handleFeedPaper = () => {
    sound.play("open");
    store.interacted();
    store.reduceBoredom(5);
    store.toast("system", "PAPER FEED", "Blank continuous tractor-feed paper ejected.");
  };

  const doDownload = async () => {
    setBusy(true);
    try {
      const { downloadAsWord } = await import("../../lib/docx-export");
      await downloadAsWord(title || "Untitled", text, (title || "lab-print").toLowerCase().replace(/[^a-z0-9]+/g, "-"));
      sound.play("success");
      store.toast("system", "DOCX GENERATED", "Word document delivered to your downloads folder!");
    } catch {
      store.toast("warn", "EXPORT ERROR", "The document could not be generated.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-cols-12">
      {/* Left Column: Interactive Input & Templates (7 cols) */}
      <div className="flex min-h-0 flex-col gap-2 lg:col-span-7">
        {/* Document Quick Templates */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-lab-ink pb-2">
          <span className="mono-label text-[10px] opacity-70">PRESETS:</span>
          {TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setTitle(tmpl.title);
                setText(tmpl.text);
                setReady(false);
                sound.play("click");
              }}
              className="brut-sm mono-label bg-card px-2 py-0.5 text-[10px] font-bold hover:bg-lab-yellow transition-transform hover:scale-105"
            >
              {tmpl.label}
            </button>
          ))}
        </div>

        <Panel title="PRINTER 2 CONTENT INPUT" className="flex min-h-0 flex-1 flex-col">
          <input
            aria-label="Document title"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 60))}
            placeholder="Document title"
            className="brut-sm mb-2 w-full bg-background px-2.5 py-1.5 font-mono text-xs font-bold outline-none border-2 border-lab-ink"
          />
          <textarea
            aria-label="Content to print"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setReady(false);
            }}
            placeholder="Paste or type practical report code, viva notes, or leave applications here..."
            className="brut-sm scroll-thin min-h-36 w-full flex-1 resize-none bg-background p-2.5 font-mono text-xs outline-none border-2 border-lab-ink"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              <BrutButton variant="warn" onClick={doPrint} disabled={printing || jammed} className="text-xs">
                {printing ? `PRINTING (${progress}%)…` : "🖨️ PRESS PRINT"}
              </BrutButton>
              {ready && (
                <BrutButton variant="go" onClick={doDownload} disabled={busy} className="text-xs">
                  {busy ? "SPOOLING…" : "📥 DOWNLOAD .DOCX"}
                </BrutButton>
              )}
              {jammed && (
                <BrutButton variant="danger" onClick={handleClearJam} className="text-xs animate-bounce">
                  ⚠️ CLEAR PAPER JAM
                </BrutButton>
              )}
            </div>

            <span className="mono-label text-[10px] opacity-70">
              {text.trim().split(/\s+/).filter(Boolean).length} WORDS
            </span>
          </div>
        </Panel>
      </div>

      {/* Right Column: 2D Printer Graphic & Status (5 cols) */}
      <div className="flex min-h-0 flex-col gap-2 lg:col-span-5">
        <Panel title="PRINTER 2 HARDWARE STATUS" className="flex min-h-0 flex-1 flex-col">
          {/* Animated 2D Retro Printer Box */}
          <div className="relative mb-2 rounded border-3 border-lab-ink bg-slate-200 p-3 shadow-md">
            {/* Top Control Header */}
            <div className="mb-2 flex items-center justify-between border-b-2 border-slate-400 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="mono-label text-[10px] font-bold text-slate-800">DOT-MATRIX v2.4</span>
                <span className="brut-sm bg-lab-yellow px-1 py-0.2 text-[9px] font-bold text-black">PAPER ONLY</span>
              </div>

              {/* Status LEDs */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse border border-black" />
                  <span className="mono-label text-[9px] text-slate-700 font-bold">PWR</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`h-2.5 w-2.5 rounded-full border border-black ${printing ? "bg-sky-400 animate-ping" : "bg-sky-500"}`} />
                  <span className="mono-label text-[9px] text-slate-700 font-bold">ONL</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`h-2.5 w-2.5 rounded-full border border-black ${jammed ? "bg-red-600 animate-bounce" : "bg-slate-400 opacity-40"}`} />
                  <span className="mono-label text-[9px] text-slate-700 font-bold">JAM</span>
                </div>
              </div>
            </div>

            {/* Printing Progress Bar */}
            {printing && (
              <div className="mb-2 w-full overflow-hidden rounded border border-black bg-slate-100">
                <div
                  className="h-2 bg-gradient-to-r from-lab-blue to-lab-yellow transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* Tractor-feed Paper Ejection Box */}
            <div className="relative min-h-24 overflow-hidden rounded border-2 border-slate-400 bg-white p-2.5 font-mono text-[10px] shadow-inner">
              {/* Tractor feed holes side decoration */}
              <div className="absolute left-1 top-0 bottom-0 flex flex-col justify-around opacity-40">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-slate-800" />
                ))}
              </div>
              <div className="absolute right-1 top-0 bottom-0 flex flex-col justify-around opacity-40">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-slate-800" />
                ))}
              </div>

              {/* Paper Content Preview */}
              <div className="px-3">
                <p className="font-bold text-slate-900 border-b border-dashed border-slate-300 pb-1">
                  &gt; {title || "UNTITLED DOCUMENT"}
                </p>
                <p className="mt-1 text-slate-600 line-clamp-3 italic">
                  {text || "Waiting for print payload..."}
                </p>
                {ejectedPaper && (
                  <div className="mt-2 rounded bg-emerald-100 p-1 border border-emerald-400 text-[9px] text-emerald-800 font-bold flex items-center justify-between">
                    <span>✅ READY TO DOWNLOAD</span>
                    <button
                      type="button"
                      onClick={doDownload}
                      className="underline hover:text-emerald-950"
                    >
                      SAVE .DOCX
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Hardware Feed Button */}
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleFeedPaper}
                className="brut-sm mono-label bg-slate-300 px-2 py-1 text-[10px] font-bold text-slate-900 hover:bg-slate-400"
              >
                📄 FEED TRACTOR PAPER
              </button>
              <span className="mono-label text-[9px] text-slate-500">
                INK: 0% (DOCX EMULATOR)
              </span>
            </div>
          </div>

          {/* Print Log / Tray History */}
          <div className="flex min-h-0 flex-1 flex-col">
            <span className="mono-label text-[10px] opacity-70 mb-1">PRINT QUEUE & HISTORY:</span>
            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto rounded border-2 border-lab-ink bg-background p-2 font-mono text-[11px]">
              {prints.length === 0 ? (
                <div className="text-muted-foreground opacity-60">&gt; printer idle. tray waiting.</div>
              ) : (
                prints.map((p, i) => (
                  <div key={i} className="border-b border-muted py-0.5 last:border-none">
                    &gt; {p}
                  </div>
                ))
              )}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}


function TrashPanel() {
  const [digs, setDigs] = useState(0);
  const [inspecting, setInspecting] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<number[]>([]);

  type TrashItem = {
    id: number;
    emoji: string;
    label: string;
    desc: string;
    x: number; // % position
    y: number;
    rot: number;
    scale: number;
    rarity: "common" | "rare" | "legendary";
  };

  const ALL_TRASH: TrashItem[] = [
    {
      id: 0,
      emoji: "📊",
      label: "Crumpled Bar Chart",
      desc: "DSA assignment. The bars are all the same height. The values are fake. The confidence was real.",
      x: 15, y: 30, rot: -18, scale: 1.3, rarity: "common",
    },
    {
      id: 1,
      emoji: "🖊️",
      label: "Dead Ballpoint Pen",
      desc: "Tried it on 4 pages. Drew spirals. Concluded: 'It's empty.' Left it anyway. This is that pen.",
      x: 55, y: 20, rot: 35, scale: 1.1, rarity: "common",
    },
    {
      id: 2,
      emoji: "📄",
      label: "Lab File Cover Page",
      desc: "The nicest page in the entire file. Took 45 minutes to design. The content inside: 3 lines of C code.",
      x: 35, y: 55, rot: 7, scale: 1.4, rarity: "common",
    },
    {
      id: 3,
      emoji: "🍪",
      label: "Half a Parle-G",
      desc: "The lab snack of champions. Survived 2 practicals. Now crumbles alone in the dark. Pour one out.",
      x: 70, y: 60, rot: -5, scale: 1.0, rarity: "common",
    },
    {
      id: 4,
      emoji: "📝",
      label: "Torn Attendance Sheet",
      desc: "Someone tried to add their own signature. The forgery is impressive. The attempt: legendary.",
      x: 25, y: 70, rot: 12, scale: 1.2, rarity: "rare",
    },
    {
      id: 5,
      emoji: "📐",
      label: "Broken Scale Ruler",
      desc: "The 30cm kind. Now 2 x 15cm kind. Still technically measures things if you're creative.",
      x: 60, y: 35, rot: -30, scale: 1.1, rarity: "common",
    },
    {
      id: 6,
      emoji: "💾",
      label: "Mystery Floppy Disk",
      desc: "Label: 'IMPORTANT DO NOT FORMAT'. Contents: unknown. No one has a floppy drive. No one will ever know.",
      x: 80, y: 25, rot: 15, scale: 1.2, rarity: "rare",
    },
    {
      id: 7,
      emoji: "📋",
      label: "Viva Preparation Notes",
      desc: "Page 1: 'What is a pointer? A variable that stores address'. Page 2: doodles of a stick figure crying.",
      x: 45, y: 75, rot: -8, scale: 1.3, rarity: "common",
    },
    {
      id: 8,
      emoji: "🖥️",
      label: "Printed 'Hello World'",
      desc: "First program. Printed at 300dpi. Submitted in a plastic folder. Got 9/10. Teacher said 'format is wrong'.",
      x: 12, y: 60, rot: 22, scale: 1.2, rarity: "common",
    },
    {
      id: 9,
      emoji: "☕",
      label: "Empty Vending Machine Cup",
      desc: "Dispensed something warm and brown. Was called coffee on the label. Jury is still out.",
      x: 75, y: 72, rot: -12, scale: 1.0, rarity: "common",
    },
    {
      id: 10,
      emoji: "🗒️",
      label: "Leave Application Draft #7",
      desc: "Reason attempted: 'medical emergency (boredom-related)'. Rejected. This is the version before final.",
      x: 30, y: 20, rot: -6, scale: 1.3, rarity: "rare",
    },
    {
      id: 11,
      emoji: "🔋",
      label: "Dead Calculator Battery",
      desc: "Gave up during the exam. The calculator showed 'MEMORY FULL'. You showed 'MEMORY EMPTY'.",
      x: 85, y: 48, rot: 45, scale: 0.9, rarity: "common",
    },
    {
      id: 12,
      emoji: "💡",
      label: "Dead Highlighter",
      desc: "Yellow. Then faint yellow. Then 'is this clear?'. Now it just makes paper slightly wet. RIP.",
      x: 50, y: 48, rot: -22, scale: 1.1, rarity: "common",
    },
    {
      id: 13,
      emoji: "🎲",
      label: "Lab Schedule Printout",
      desc: "Someone crossed out 'DSA Lab' and wrote 'FREE PERIOD'. Bold. Optimistic. Incorrect.",
      x: 18, y: 45, rot: 14, scale: 1.25, rarity: "legendary",
    },
    {
      id: 14,
      emoji: "🧻",
      label: "Flowchart on Toilet Paper",
      desc: "The only paper available during the 11pm deadline panic. It's a valid DFD. The professor asked why it's soft.",
      x: 65, y: 78, rot: 8, scale: 1.3, rarity: "legendary",
    },
  ];

  const RARITY_COLORS = {
    common: "border-stone-400 bg-stone-50",
    rare: "border-blue-400 bg-blue-50",
    legendary: "border-amber-400 bg-amber-50",
  };
  const RARITY_BADGE = {
    common: "bg-stone-200 text-stone-700",
    rare: "bg-blue-200 text-blue-800",
    legendary: "bg-amber-300 text-amber-900",
  };

  // Items become visible progressively as you dig
  const visibleCount = Math.min(4 + digs * 2, ALL_TRASH.length);
  const visibleItems = ALL_TRASH.slice(0, visibleCount);
  const inspectedItem = inspecting !== null ? ALL_TRASH[inspecting] : null;

  const handleDig = () => {
    const d = digs + 1;
    setDigs(d);
    store.interacted();
    sound.play("click");
    if (d >= 2) store.findEgg("trash_dig");
    if (d === 3) store.giveItem("attendance_slip");
    if (d >= 5) store.giveItem("broken_mouse");
    if (d >= 7) store.unlock("dumpster_diver");
    // Reveal a new item highlight
    const newReveal = Math.min(4 + d * 2 - 1, ALL_TRASH.length - 1);
    setRevealed(r => [...r, newReveal]);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-lab-ink/20 bg-stone-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🗑️</span>
          <div>
            <p className="font-mono text-xs font-black text-amber-400 tracking-widest">DESK TRASH BIN — LAB 404</p>
            <p className="font-mono text-[9px] text-stone-400">
              {visibleCount}/{ALL_TRASH.length} items discovered • {digs} dig{digs !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-black ${digs === 0 ? "bg-stone-600 text-stone-300" : digs < 4 ? "bg-yellow-600 text-yellow-100" : "bg-red-700 text-red-100"}`}>
            {digs === 0 ? "UNTOUCHED" : digs < 4 ? "DIGGING" : "DEEP DIVE"}
          </span>
        </div>
      </div>

      {/* Main trash bin area */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* Bin background — crinkled paper texture */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-200 via-stone-300 to-stone-400">
          {/* Bin walls */}
          <div className="absolute inset-x-4 bottom-0 top-8 border-4 border-t-0 border-stone-600 bg-stone-300/60 shadow-inner" />
          {/* Top rim */}
          <div className="absolute inset-x-2 top-6 h-4 border-4 border-stone-600 bg-stone-500" />
          {/* Bin label */}
          <div className="absolute left-1/2 top-2 -translate-x-1/2 rounded border-2 border-stone-600 bg-stone-100 px-3 py-0.5">
            <span className="font-mono text-[9px] font-black text-stone-700 tracking-widest">♻ PAPER WASTE</span>
          </div>
          {/* Ambient stink lines */}
          {digs > 2 && (
            <>
              <div className="absolute left-[30%] top-2 font-mono text-[10px] text-stone-500 opacity-60 animate-bounce" style={{ animationDelay: "0s" }}>〰️</div>
              <div className="absolute left-[55%] top-0 font-mono text-[10px] text-stone-500 opacity-40 animate-bounce" style={{ animationDelay: "0.4s" }}>〰️</div>
              <div className="absolute left-[70%] top-3 font-mono text-[10px] text-stone-500 opacity-50 animate-bounce" style={{ animationDelay: "0.8s" }}>〰️</div>
            </>
          )}
        </div>

        {/* Scattered trash items */}
        <div className="absolute inset-x-6 bottom-2 top-12">
          {visibleItems.map((item, i) => (
            <button
              key={item.id}
              onClick={() => { setInspecting(inspecting === item.id ? null : item.id); sound.play("click"); }}
              className={`absolute flex flex-col items-center gap-0.5 transition-all duration-300 hover:scale-125 hover:z-20 focus:outline-none ${inspecting === item.id ? "scale-125 z-20" : "z-10"
                } ${revealed.includes(i) ? "animate-bounce" : ""}`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: `rotate(${item.rot}deg) scale(${item.scale}) ${inspecting === item.id ? "scale(1.3)" : ""}`,
                animationDuration: "0.6s",
                animationIterationCount: revealed.includes(i) ? "3" : "0",
              }}
              title={item.label}
            >
              <span className="text-2xl drop-shadow-sm">{item.emoji}</span>
              {inspecting === item.id && (
                <span className={`-mt-0.5 whitespace-nowrap rounded border px-1 py-0.5 font-mono text-[8px] font-black ${RARITY_BADGE[item.rarity]}`}>
                  {item.rarity.toUpperCase()}
                </span>
              )}
            </button>
          ))}

          {/* Hidden items tease */}
          {visibleCount < ALL_TRASH.length && (
            <div className="absolute bottom-2 right-2 rounded border-2 border-dashed border-stone-500 bg-stone-200/70 px-2 py-1">
              <p className="font-mono text-[9px] text-stone-600">+{ALL_TRASH.length - visibleCount} more items hidden...</p>
            </div>
          )}
        </div>
      </div>

      {/* Inspect panel — shown when clicking an item */}
      {inspectedItem && (
        <div className={`border-t-3 border-lab-ink p-3 ${RARITY_COLORS[inspectedItem.rarity]}`}>
          <div className="flex items-start gap-3">
            <span className="text-3xl">{inspectedItem.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-mono text-sm font-black text-lab-ink">{inspectedItem.label}</p>
                <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-black ${RARITY_BADGE[inspectedItem.rarity]}`}>
                  {inspectedItem.rarity.toUpperCase()}
                </span>
              </div>
              <p className="font-mono text-[11px] text-stone-700 leading-relaxed">{inspectedItem.desc}</p>
            </div>
            <button onClick={() => setInspecting(null)} className="text-stone-400 hover:text-lab-ink font-black text-xs">✕</button>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="border-t-2 border-lab-ink/20 bg-stone-100 px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <p className="font-mono text-[10px] text-stone-500 leading-relaxed">
              {digs === 0 && "🤢 Smells like deadlines and regret. Proceed with caution."}
              {digs === 1 && "🧤 You found the surface layer. It gets worse below."}
              {digs === 2 && "😬 You are committed now. No going back."}
              {digs === 3 && "💀 This is someone's academic trauma you're digging through."}
              {digs >= 4 && digs < 6 && "🏆 Professional bin archaeologist. Respect."}
              {digs >= 6 && "🫡 You have seen things. Things that cannot be unseen."}
            </p>
          </div>
          <BrutButton
            variant={digs >= ALL_TRASH.length / 2 ? "danger" : "warn"}
            onClick={handleDig}
            disabled={visibleCount >= ALL_TRASH.length}
            className="shrink-0 text-xs"
          >
            {visibleCount >= ALL_TRASH.length ? "🗑️ BIN FULLY EXCAVATED" : `🤿 DIG DEEPER (${visibleCount}/${ALL_TRASH.length})`}
          </BrutButton>
        </div>

        {/* Legend */}
        <div className="mt-1.5 flex gap-3">
          {(["common", "rare", "legendary"] as const).map(r => (
            <div key={r} className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full border ${RARITY_COLORS[r].split(" ")[0]?.replace("border", "border")}`} style={{ background: r === "common" ? "#a8a29e" : r === "rare" ? "#93c5fd" : "#fcd34d" }} />
              <span className="font-mono text-[9px] text-stone-500 capitalize">{r}</span>
            </div>
          ))}
          <span className="ml-auto font-mono text-[9px] text-stone-400">Click items to inspect</span>
        </div>
      </div>
    </div>
  );
}


function WhiteboardPanel() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  type Tool = "brush" | "line" | "rect" | "circle" | "text" | "sticky";
  const [activeTool, setActiveTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#1e293b");
  const [lineWidth, setLineWidth] = useState(4);
  const [boardHeight, setBoardHeight] = useState(1600);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [textStamp, setTextStamp] = useState("LAB 404 ESCAPE");

  const startPos = useRef<{ x: number; y: number } | null>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const snapshot = useRef<ImageData | null>(null);

  const savedData = useLab((s) => s.rt.whiteboardData);

  // Initialize and load canvas background or saved image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const targetW = rect.width || 800;
    const targetH = boardHeight;

    canvas.width = targetW * 2;
    canvas.height = targetH * 2;
    ctx.scale(2, 2);

    if (savedData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);
      };
      img.src = savedData;
    } else {
      drawDefaultBoard(ctx, targetW, targetH);
    }
  }, [savedData, boardHeight]);

  const drawDefaultBoard = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    // Secret Corner Passcode (retained for puzzle hint)
    ctx.fillStyle = "#dc2626";
    ctx.font = "bold 14px 'JetBrains Mono', monospace";
    ctx.fillText("[CORNER CODE: 4040]", Math.max(20, w - 210), 35);
  };

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    store.setWhiteboardData(dataUrl);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]!.clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0]!.clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    startPos.current = coords;
    lastPos.current = coords;
    snapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    store.interacted();
    store.findEgg("whiteboard_erase");

    // Handle single-click tools like Text and Sticky Note
    if (activeTool === "text") {
      ctx.font = `bold ${lineWidth * 3 + 10}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = isEraser ? "#f8fafc" : color;
      ctx.fillText(textStamp || "LAB 404", coords.x, coords.y);
      sound.play("pop");
      saveCanvas();
      setIsDrawing(false);
    } else if (activeTool === "sticky") {
      // Stamp sticky note
      ctx.fillStyle = "#fef08a";
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2;
      ctx.fillRect(coords.x - 60, coords.y - 40, 120, 80);
      ctx.strokeRect(coords.x - 60, coords.y - 40, 120, 80);

      ctx.fillStyle = "#dc2626";
      ctx.font = "bold 11px 'JetBrains Mono', monospace";
      ctx.fillText("STICKY NOTE", coords.x - 45, coords.y - 20);
      ctx.fillStyle = "#1e293b";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillText(textStamp || "Check corner code 4040", coords.x - 52, coords.y + 5);

      sound.play("pop");
      saveCanvas();
      setIsDrawing(false);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPos.current || !startPos.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentPos = getCanvasCoords(e);

    if (activeTool === "brush") {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.strokeStyle = isEraser ? "#f8fafc" : color;
      ctx.lineWidth = isEraser ? lineWidth * 3 : lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      lastPos.current = currentPos;
    } else if (["line", "rect", "circle"].includes(activeTool)) {
      // Restore canvas snapshot for live shape preview
      if (snapshot.current) {
        ctx.putImageData(snapshot.current, 0, 0);
      }

      ctx.strokeStyle = isEraser ? "#f8fafc" : color;
      ctx.lineWidth = lineWidth;
      ctx.fillStyle = color;

      if (activeTool === "line") {
        ctx.beginPath();
        ctx.moveTo(startPos.current.x, startPos.current.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();
      } else if (activeTool === "rect") {
        const w = currentPos.x - startPos.current.x;
        const h = currentPos.y - startPos.current.y;
        ctx.strokeRect(startPos.current.x, startPos.current.y, w, h);
      } else if (activeTool === "circle") {
        const rx = Math.abs(currentPos.x - startPos.current.x) / 2;
        const ry = Math.abs(currentPos.y - startPos.current.y) / 2;
        const cx = (startPos.current.x + currentPos.x) / 2;
        const cy = (startPos.current.y + currentPos.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      startPos.current = null;
      lastPos.current = null;
      saveCanvas();
    }
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();

    drawDefaultBoard(ctx, rect.width || 800, boardHeight);
    sound.play("pop");
    store.interacted();
    saveCanvas();
  };

  const loadTemplate = (tmpl: "topology" | "formulas" | "escape") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || 800;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, boardHeight);

    if (tmpl === "topology") {
      ctx.font = "bold 16px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#1e293b";
      ctx.fillText("LAB 404 NETWORK TOPOLOGY & HARDWARE MAP", 30, 40);

      // Node boxes
      const nodes = [
        { label: "GATEWAY", x: 40, y: 80, col: "#2563eb" },
        { label: "MAIN CPU", x: 200, y: 80, col: "#16a34a" },
        { label: "TERMINAL 404", x: 380, y: 80, col: "#d97706" },
        { label: "ESCAPE DOOR", x: 560, y: 80, col: "#dc2626" },
      ];

      nodes.forEach((n) => {
        ctx.strokeStyle = n.col;
        ctx.lineWidth = 3;
        ctx.strokeRect(n.x, n.y, 120, 50);
        ctx.fillStyle = n.col;
        ctx.font = "bold 11px 'JetBrains Mono', monospace";
        ctx.fillText(n.label, n.x + 12, n.y + 30);
      });

      ctx.fillStyle = "#dc2626";
      ctx.font = "bold 14px 'JetBrains Mono', monospace";
      ctx.fillText("[CORNER CODE: 4040]", Math.max(20, w - 210), 35);
    } else if (tmpl === "formulas") {
      ctx.font = "bold 16px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#1e293b";
      ctx.fillText("VIVA EXAM FORMULAS & ALGORITHMS", 30, 40);

      ctx.font = "13px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#2563eb";
      ctx.fillText("1. Binary Search: O(log N) — mid = low + (high - low) / 2", 30, 80);
      ctx.fillText("2. QuickSort: Pivot partitioning, Average O(N log N)", 30, 110);
      ctx.fillText("3. Ohm's Law: V = I * R", 30, 140);
      ctx.fillText("4. Energy: E = mc²", 30, 170);

      ctx.fillStyle = "#dc2626";
      ctx.font = "bold 14px 'JetBrains Mono', monospace";
      ctx.fillText("[CORNER CODE: 4040]", Math.max(20, w - 210), 35);
    } else if (tmpl === "escape") {
      ctx.font = "bold 18px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#dc2626";
      ctx.fillText("🚨 EMERGENCY OVERRIDE & ESCAPE INSTRUCTIONS 🚨", 30, 45);

      ctx.font = "bold 13px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#1e293b";
      ctx.fillText("• Passcode to Professor's Laptop: 4040", 30, 90);
      ctx.fillText("• Door Keycard: Hidden in Desk Drawer Layer 2", 30, 120);
      ctx.fillText("• Terminal Command: run lab_escape", 30, 150);

      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 180, 320, 60);
      ctx.fillStyle = "#dc2626";
      ctx.fillText("MASTER CODE: 4040", 110, 215);
    }

    sound.play("success");
    store.interacted();
    saveCanvas();
  };

  const downloadBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = "smart_whiteboard_session.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
    sound.play("success");
  };

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
    }
  };

  const extendHeight = () => {
    setBoardHeight((h) => h + 600);
    sound.play("click");
  };

  const COLORS = [
    { name: "Ink Black", value: "#1e293b" },
    { name: "Marker Blue", value: "#2563eb" },
    { name: "Alert Red", value: "#dc2626" },
    { name: "Green", value: "#16a34a" },
    { name: "Yellow", value: "#eab308" },
    { name: "Purple", value: "#9333ea" },
    { name: "Cyan", value: "#06b6d4" },
  ];

  const TOOLS: { id: Tool; label: string; icon: string }[] = [
    { id: "brush", label: "PEN", icon: "✏️" },
    { id: "line", label: "LINE", icon: "📏" },
    { id: "rect", label: "RECT", icon: "🔲" },
    { id: "circle", label: "CIRCLE", icon: "⚪" },
    { id: "text", label: "TEXT", icon: "🔤" },
    { id: "sticky", label: "STICKY", icon: "📌" },
  ];

  const SIZES = [
    { label: "FINE", val: 2 },
    { label: "MEDIUM", val: 5 },
    { label: "BOLD", val: 12 },
    { label: "MARKER", val: 24 },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* Smart Whiteboard Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-lab-ink bg-card p-2">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1">
          <span className="mono-label text-[10px] opacity-70">TOOL:</span>
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTool(t.id);
                setIsEraser(false);
                sound.play("click");
              }}
              className={`brut-sm mono-label px-2 py-0.5 text-[10px] font-bold ${!isEraser && activeTool === t.id ? "bg-lab-blue text-white scale-105" : "bg-card text-foreground opacity-80"
                }`}
            >
              {t.icon} {t.label}
            </button>
          ))}

          {/* Eraser */}
          <button
            type="button"
            onClick={() => {
              setIsEraser((e) => !e);
              sound.play("click");
            }}
            className={`brut-sm mono-label px-2 py-0.5 text-[10px] font-bold ${isEraser ? "bg-lab-yellow text-lab-ink" : "bg-card"
              }`}
          >
            🧹 ERASER {isEraser ? "ON" : "OFF"}
          </button>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1">
          <span className="mono-label text-[10px] opacity-70">COLOR:</span>
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              aria-label={c.name}
              onClick={() => {
                setColor(c.value);
                setIsEraser(false);
                sound.play("click");
              }}
              style={{ background: c.value }}
              className={`h-5 w-5 rounded-sm border-2 transition-transform ${!isEraser && color === c.value
                  ? "border-lab-ink scale-125 shadow-md ring-2 ring-lab-blue"
                  : "border-gray-400 opacity-80 hover:opacity-100"
                }`}
            />
          ))}
        </div>

        {/* Thickness */}
        <div className="flex items-center gap-1">
          <span className="mono-label text-[10px] opacity-70">SIZE:</span>
          {SIZES.map((s) => (
            <button
              key={s.val}
              type="button"
              onClick={() => {
                setLineWidth(s.val);
                sound.play("click");
              }}
              className={`brut-sm mono-label px-1.5 py-0.5 text-[10px] ${lineWidth === s.val ? "bg-lab-blue text-lab-paper font-bold" : "bg-card"
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Preset Templates */}
        <div className="flex items-center gap-1">
          <span className="mono-label text-[10px] opacity-70">TEMPLATES:</span>
          <button
            type="button"
            onClick={() => loadTemplate("topology")}
            className="brut-sm mono-label px-1.5 py-0.5 text-[10px] bg-slate-200 hover:bg-slate-300 font-bold"
          >
            🧠 TOPOLOGY
          </button>
          <button
            type="button"
            onClick={() => loadTemplate("formulas")}
            className="brut-sm mono-label px-1.5 py-0.5 text-[10px] bg-slate-200 hover:bg-slate-300 font-bold"
          >
            📝 FORMULAS
          </button>
          <button
            type="button"
            onClick={() => loadTemplate("escape")}
            className="brut-sm mono-label px-1.5 py-0.5 text-[10px] bg-amber-200 hover:bg-amber-300 font-bold"
          >
            🔑 ESCAPE CODE
          </button>
        </div>

        {/* Canvas Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={scrollToTop}
            className="brut-sm mono-label px-1.5 py-0.5 text-[10px] bg-card hover:bg-muted"
          >
            ⬆ TOP
          </button>
          <button
            type="button"
            onClick={scrollToBottom}
            className="brut-sm mono-label px-1.5 py-0.5 text-[10px] bg-card hover:bg-muted"
          >
            ⬇ BOTTOM
          </button>
          <button
            type="button"
            onClick={extendHeight}
            className="brut-sm mono-label px-1.5 py-0.5 text-[10px] bg-lab-yellow text-lab-ink font-bold"
          >
            + EXTEND
          </button>
          <Tag tone="red">CODE: 4040</Tag>
          <BrutButton variant="danger" className="text-[10px] px-2 py-0.5" onClick={clearBoard}>
            CLEAR
          </BrutButton>
          <BrutButton variant="go" className="text-[10px] px-2 py-0.5" onClick={downloadBoard}>
            PNG
          </BrutButton>
        </div>
      </div>

      {/* Optional Stamp Input Bar for Text / Sticky tool */}
      {(activeTool === "text" || activeTool === "sticky") && (
        <div className="flex items-center gap-2 border-b border-lab-ink bg-amber-100 p-1.5">
          <span className="mono-label text-[10px] font-bold text-amber-900">
            {activeTool === "text" ? "🔤 TYPE TEXT TO STAMP:" : "📌 STICKY NOTE TEXT:"}
          </span>
          <input
            type="text"
            value={textStamp}
            onChange={(e) => setTextStamp(e.target.value)}
            className="brut-sm flex-1 bg-white px-2 py-0.5 font-mono text-xs outline-none"
            placeholder="Type text and click canvas to place..."
          />
          <span className="mono-label text-[9px] opacity-70">CLICK CANVAS TO STAMP</span>
        </div>
      )}

      {/* Scrollable Canvas Container */}
      <div
        ref={containerRef}
        className="scroll-thin relative min-h-0 flex-1 overflow-y-auto border-3 border-lab-ink bg-slate-50 shadow-inner"
      >
        <canvas
          ref={canvasRef}
          style={{ height: `${boardHeight}px` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full touch-none cursor-crosshair block"
        />
      </div>

      <p className="mono-label text-[10px] text-center opacity-60">
        Smart Whiteboard ({boardHeight}px tall) • Click & drag or choose tools/templates above.
      </p>
    </div>
  );
}



function ComputerPanel() {
  const loginAuthenticated = useLab((s) => s.rt.loginAuthenticated);
  const typedPassword = useLab((s) => s.rt.typedPassword || "");
  const booted = useRef(false);

  useEffect(() => {
    if (loginAuthenticated && !booted.current) {
      booted.current = true;
      store.unlock("booted");
    }
  }, [loginAuthenticated]);

  if (!loginAuthenticated) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center font-mono select-none">
        <div className="max-w-md rounded-lg border-3 border-lab-ink bg-card p-6 shadow-brut">
          <div className="text-4xl mb-2">🖥️</div>
          <h3 className="font-display text-xl font-bold text-foreground">
            CRT TERMINAL AUTHENTICATION
          </h3>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            Type passcode <span className="font-bold text-amber-600">4040</span> directly on your keyboard or click the desk keycaps below.
          </p>

          <div className="my-4 rounded border-2 border-emerald-500 bg-slate-950 p-3 text-emerald-400">
            <p className="mono-label text-[10px] text-slate-400">LIVE CRT SCREEN STATUS</p>
            <p className="mt-1 font-mono text-lg font-bold">
              PASS: [ <span className="text-sky-300">{"•".repeat(typedPassword.length)}_</span> ]
            </p>
          </div>

          <div className="flex gap-2">
            <BrutButton
              variant="go"
              className="flex-1 text-xs"
              onClick={() => {
                store.typeMonitorKey("4");
                store.typeMonitorKey("0");
                store.typeMonitorKey("4");
                store.typeMonitorKey("0");
              }}
            >
              ⚡ QUICK AUTO-TYPE 4040
            </BrutButton>
            <BrutButton
              variant="danger"
              className="text-xs"
              onClick={() => store.focusObject(null)}
            >
              ← BACK TO LAB
            </BrutButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="brut h-full w-full bg-lab-paper p-2">
      <div className="h-full w-full border-3 border-lab-ink">
        <Desktop />
      </div>
    </div>
  );
}

export function ObjectPanel({ id }: { id: ObjectId }) {
  const meta = OBJECT_MAP.get(id)!;
  const body = () => {
    switch (id) {
      case "computer":
        return <ComputerPanel />;
      case "phone":
        return <PhoneApp />;
      case "noticeboard":
        return <NoticesApp />;
      case "clock":
        return <ClockPanel />;
      case "window":
        return <WindowPanel />;
      case "desk":
        return <DeskPanel />;
      case "drawer":
        return <DrawerPanel />;
      case "printer":
        return <PrinterPanel />;
      case "trash":
        return <TrashPanel />;
      case "whiteboard":
        return <WhiteboardPanel />;
      default:
        return <AchievementsApp />;
    }
  };

  return (
    <div className="window-in flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b-3 border-lab-ink bg-lab-ink px-3 py-2 text-lab-paper">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg leading-none">{meta.label.toUpperCase()}</span>
          <Tag tone="yellow">{id}</Tag>
        </div>
        <BrutButton variant="danger" onClick={() => store.focusObject(null)}>
          ← BACK TO LAB
        </BrutButton>
      </div>
      <div className="min-h-0 flex-1 bg-background p-3">{body()}</div>
    </div>
  );
}
