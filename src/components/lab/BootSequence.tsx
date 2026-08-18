import { useEffect, useRef, useState } from "react";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton } from "../ui/brut";

const LINES = [
  "LAB-OS v4.04  (c) DEPT. OF COMPUTER SCIENCE",
  "POST ... ok",
  "checking attendance register .......... 74%",
  "mounting /dev/boredom ................. ok",
  "loading practical_file.pdf ............ corrupted",
  "wifi: connected (no internet)",
  "professor daemon ...................... idle",
  "clock synced: 4 hours remain",
  "",
  "SYSTEM READY. YOU ARE NOT.",
];

export function BootSequence({ onDone }: { onDone: () => void }) {
  const [shown, setShown] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => {
    let i = 0;
    timer.current = window.setInterval(() => {
      i += 1;
      setShown(LINES.slice(0, i));
      sound.play("key");
      if (i >= LINES.length) {
        window.clearInterval(timer.current);
        setReady(true);
      }
    }, 260);
    return () => window.clearInterval(timer.current);
  }, []);

  const enter = () => {
    sound.resume();
    sound.play("open");
    store.startSession();
    onDone();
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-lab-ink p-6 text-lab-green">
      <pre className="w-full max-w-xl whitespace-pre-wrap font-mono text-xs leading-relaxed sm:text-sm">
        {shown.map((l) => `> ${l}\n`).join("")}
        <span className="caret">_</span>
      </pre>
      <div className="flex flex-col items-center gap-2">
        <BrutButton
          variant="go"
          disabled={!ready}
          onClick={enter}
          className="px-8 py-4 font-display text-2xl"
        >
          ENTER THE LAB
        </BrutButton>
        <button className="mono-label text-lab-paper/60 underline" onClick={() => setShown(LINES) || setReady(true)}>
          skip
        </button>
      </div>
    </div>
  );
}
