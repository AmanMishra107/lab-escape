import { useEffect, useRef, useState } from "react";
import { OBJECT_MAP } from "../../data/labObjects";
import { store, useLab } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import type { ObjectId } from "../../systems/types";
import { AchievementsApp } from "../apps/AchievementsApp";
import { InventoryApp } from "../apps/InventoryApp";
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
  useEffect(() => {
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    if (seconds >= 20) store.findEgg("window_stare");
  }, [seconds]);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="brut h-40 w-full max-w-md bg-lab-blue" aria-hidden>
        <div className="h-2/3 w-full bg-gradient-to-b from-lab-blue to-lab-yellow" />
        <div className="h-1/3 w-full bg-lab-green" />
      </div>
      <p className="mono-label">OUTSIDE: {seconds}s observed</p>
      <p className="max-w-sm text-sm">
        A bird lands. A senior walks past with confidence he has not earned. Somewhere, a canteen shutter opens.
      </p>
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

function DrawerPanel() {
  const [depth, setDepth] = useState(0);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <p className="mono-label">DRAWER — LAYER {depth + 1}</p>
      <p className="max-w-md text-sm">
        {depth === 0 && "Pens that do not work. A ruler. Somebody's ID card from 2018."}
        {depth === 1 && "Old lab manuals, stapled with hope."}
        {depth >= 2 && "A false bottom. Underneath: a chip labelled DO NOT LOSE."}
      </p>
      <div className="flex gap-2">
        <BrutButton
          variant="go"
          onClick={() => {
            const d = depth + 1;
            setDepth(d);
            store.interacted();
            if (d >= 2) {
              store.findEgg("drawer_bottom");
              store.giveItem("chip");
            }
            if (d === 1) store.giveItem("usb");
          }}
        >
          DIG DEEPER
        </BrutButton>
      </div>
    </div>
  );
}

function PrinterPanel() {
  const [prints, setPrints] = useState<string[]>([]);
  const pool = [
    "PRACTICAL FILE — page 1 of 47",
    "ATTENDANCE REPORT: emotionally reviewed",
    "STOP",
    "test page (1998)",
    "ERROR: paper jam in tray that does not exist",
  ];
  return (
    <div className="flex h-full flex-col gap-3">
      <BrutButton
        variant="warn"
        onClick={() => {
          sound.play("pop");
          store.interacted();
          const next = [...prints, pool[Math.floor(Math.random() * pool.length)]!];
          setPrints(next.slice(-6));
          if (next.length >= 3) {
            store.findEgg("printer_spam");
            store.giveItem("note");
          }
        }}
      >
        PRESS PRINT
      </BrutButton>
      <div className="brut-sm scroll-thin flex-1 overflow-y-auto bg-background p-3 font-mono text-sm">
        {prints.length === 0 ? "> tray empty. printer idle. printer waiting." : prints.map((p, i) => <div key={i}>&gt; {p}</div>)}
      </div>
    </div>
  );
}

function TrashPanel() {
  const [digs, setDigs] = useState(0);
  const finds = [
    "Half a samosa. Ambient temperature.",
    "Someone's viva notes, unusually detailed.",
    "A crumpled attendance slip with an illegible signature.",
    "A broken mouse. Left click still works.",
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <p className="mono-label">BIN CONTENTS</p>
      <p className="max-w-md text-sm">{digs === 0 ? "It smells like deadlines." : finds[Math.min(digs - 1, finds.length - 1)]}</p>
      <BrutButton
        onClick={() => {
          const d = digs + 1;
          setDigs(d);
          store.interacted();
          sound.play("click");
          if (d >= 2) store.findEgg("trash_dig");
          if (d === 3) store.giveItem("attendance_slip");
          if (d >= 4) store.giveItem("broken_mouse");
        }}
      >
        DIG THROUGH BIN
      </BrutButton>
    </div>
  );
}

function WhiteboardPanel() {
  const [erased, setErased] = useState(false);
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="brut flex-1 bg-lab-paper p-4">
        <p className="font-mono text-sm opacity-70">Today: Experiment 7 — “Observation”</p>
        <p className="mt-3 font-mono text-sm opacity-70">for(;;) { "{" } study(); { "}" }</p>
        <p className="mt-6 font-mono text-xs text-lab-red">corner, barely visible: 4040</p>
        {erased && (
          <p className="mt-4 font-mono text-sm">
            Under the smudges: last semester's answers. Cross-checked. All wrong.
          </p>
        )}
      </div>
      <BrutButton
        onClick={() => {
          setErased(true);
          store.findEgg("whiteboard_erase");
          store.interacted();
        }}
      >
        ERASE A CORNER
      </BrutButton>
    </div>
  );
}

function BackpackPanel() {
  const [zipped, setZipped] = useState(false);
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="min-h-0 flex-1 overflow-hidden">
        <InventoryApp />
      </div>
      <BrutButton
        onClick={() => {
          setZipped(true);
          store.findEgg("backpack_zip");
        }}
      >
        {zipped ? "…crumbs, confirmed" : "UNZIP THE LAST POCKET"}
      </BrutButton>
    </div>
  );
}

function ComputerPanel() {
  const booted = useRef(false);
  useEffect(() => {
    if (!booted.current) {
      booted.current = true;
      store.unlock("booted");
    }
  }, []);
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
      case "backpack":
        return <BackpackPanel />;
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
