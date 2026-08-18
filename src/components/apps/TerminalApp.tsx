import { useEffect, useRef, useState } from "react";
import { runCommand } from "../../systems/terminal";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

const BANNER = [
  "LAB OS 0.98 SE — (C) 1998-2026 DEPT. OF COMPUTER SCIENCE",
  "Type HELP for a list of commands. Type nothing for the full lab experience.",
  "",
];

export function TerminalApp({ onExit }: { onExit?: () => void }) {
  const [lines, setLines] = useState<string[]>(BANNER);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIndex, setHIndex] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  const submit = () => {
    const cmd = value;
    setValue("");
    if (!cmd.trim()) return;
    setHistory((h) => [...h, cmd]);
    setHIndex(-1);
    const out = runCommand(cmd);
    if (out[0] === "\u0000clear") return setLines([]);
    if (out[0] === "\u0000exit") {
      onExit?.();
      return;
    }
    sound.play("key");
    setLines((l) => [...l, `C:\\LAB> ${cmd}`, ...out, ""].slice(-300));
  };

  return (
    <div
      className="flex h-full min-h-0 cursor-text flex-col bg-screen p-3 font-mono text-sm text-lab-green"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words">
        {lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
        <div ref={endRef} />
      </div>
      <form
        className="mt-2 flex items-center gap-2 border-t-2 border-lab-green/40 pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="term-in" className="shrink-0">
          C:\LAB&gt;
        </label>
        <input
          id="term-in"
          ref={inputRef}
          value={value}
          autoComplete="off"
          spellCheck={false}
          aria-label="Terminal command input"
          onChange={(e) => {
            setValue(e.target.value.slice(0, 120));
            sound.play("key");
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" && history.length) {
              e.preventDefault();
              const i = hIndex < 0 ? history.length - 1 : Math.max(0, hIndex - 1);
              setHIndex(i);
              setValue(history[i] ?? "");
            }
            if (e.key === "ArrowDown" && history.length) {
              e.preventDefault();
              const i = Math.min(history.length - 1, hIndex + 1);
              setHIndex(i);
              setValue(history[i] ?? "");
            }
            if (e.key === "Escape") store.setRt({ activeApp: null });
          }}
          className="w-full bg-transparent text-lab-green caret-transparent outline-none"
        />
        <span className="caret -ml-2 inline-block h-4 w-2 bg-lab-green" aria-hidden />
      </form>
    </div>
  );
}
