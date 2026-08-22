import { useEffect, useRef, useState, useCallback } from "react";
import { runCommand, COMMANDS } from "../../systems/terminal";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

// ── Banner ──────────────────────────────────────────────────────
const BANNER = [
  { text: "  ██╗      █████╗ ██████╗      ██████╗ ███████╗", color: "green" },
  { text: "  ██║     ██╔══██╗██╔══██╗    ██╔═══██╗██╔════╝", color: "green" },
  { text: "  ██║     ███████║██████╔╝    ██║   ██║███████╗", color: "green" },
  { text: "  ██║     ██╔══██║██╔══██╗    ██║   ██║╚════██║", color: "green" },
  { text: "  ███████╗██║  ██║██████╔╝    ╚██████╔╝███████║", color: "green" },
  { text: "  ╚══════╝╚═╝  ╚═╝╚═════╝      ╚═════╝ ╚══════╝", color: "green" },
  { text: "", color: "dim" },
  { text: "  LAB OS v0.98 SE — (C) 1998-2026 DEPT. OF COMPUTER SCIENCE", color: "cyan" },
  { text: "  Type HELP for a list of commands.", color: "dim" },
  { text: "  Hidden commands exist. Explore.", color: "yellow" },
  { text: "", color: "dim" },
];

// ── Types ────────────────────────────────────────────────────────
type LineColor = "green" | "yellow" | "red" | "cyan" | "dim" | "white" | "prompt";
interface Line { text: string; color?: LineColor }

function colorForText(text: string): LineColor {
  const t = text.toLowerCase();
  if (t.startsWith("  [failed]") || t.includes("error") || t.includes("denied") || t.includes("fatal") || t.startsWith("  ✗")) return "red";
  if (t.startsWith("  [success]") || t.includes("✓") || t.startsWith("  [+]") || t.startsWith("  [✓]")) return "green";
  if (t.includes("⚠") || t.includes("warning") || t.startsWith("  critical") || t.startsWith("  danger")) return "yellow";
  if (t.startsWith("╔") || t.startsWith("╠") || t.startsWith("╚") || t.startsWith("┌") || t.startsWith("├") || t.startsWith("└") || t.startsWith("═")) return "cyan";
  if (t.startsWith("  tip") || t.includes("hint") || t.startsWith("  note")) return "yellow";
  if (t === "" || t === " ") return "dim";
  return "white";
}

function toColoredLines(rawLines: string[]): Line[] {
  return rawLines.map(text => ({ text, color: colorForText(text) }));
}

function fmtTimestamp() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
}

const COLOR_CLASSES: Record<LineColor, string> = {
  green: "text-lab-green",
  yellow: "text-yellow-400",
  red: "text-red-400",
  cyan: "text-cyan-400",
  dim: "text-lab-green/50",
  white: "text-lab-green/90",
  prompt: "text-lab-green font-bold",
};

// ── Component ────────────────────────────────────────────────────
export function TerminalApp({ onExit }: { onExit?: () => void }) {
  const [lines, setLines] = useState<Line[]>(BANNER);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIndex, setHIndex] = useState(-1);
  const [suggestion, setSuggestion] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  // Tab completion
  const updateSuggestion = useCallback((val: string) => {
    if (!val.trim()) { setSuggestion(""); return; }
    const partial = val.toLowerCase().split(" ")[0] ?? "";
    const match = COMMANDS.find(c => !c.hidden && c.name.startsWith(partial) && c.name !== partial);
    setSuggestion(match ? match.name.slice(partial.length) : "");
  }, []);

  const submit = () => {
    const cmd = value.trim();
    setValue("");
    setSuggestion("");
    if (!cmd) return;
    setHistory(h => [...h, cmd]);
    setHIndex(-1);
    const out = runCommand(cmd);
    if (out[0] === "\u0000clear") { setLines([]); return; }
    if (out[0] === "\u0000exit") { onExit?.(); return; }
    sound.play("key");
    const ts = fmtTimestamp();
    const promptLine: Line = {
      text: `[${ts}] C:\\LAB> ${cmd}`,
      color: "prompt",
    };
    const outputLines = toColoredLines(out);
    const spacer: Line = { text: "", color: "dim" };
    setLines(l => [...l, promptLine, ...outputLines, spacer].slice(-400));
  };

  return (
    <div
      className="flex h-full min-h-0 cursor-text flex-col bg-screen font-mono text-sm"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Output area */}
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words px-3 pt-3 pb-1">
        {lines.map((l, i) => (
          <div
            key={i}
            className={`leading-5 ${COLOR_CLASSES[l.color ?? "white"]}`}
          >
            {l.text || "\u00a0"}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input row */}
      <div className="border-t border-lab-green/30 px-3 py-2">
        {/* Autocomplete hint */}
        {suggestion && (
          <div className="mb-1 text-xs text-lab-green/40 select-none">
            Tab → complete: {value}{suggestion}
          </div>
        )}
        <form
          className="flex items-center gap-1"
          onSubmit={e => { e.preventDefault(); submit(); }}
        >
          <span className="shrink-0 text-lab-green font-bold select-none text-xs sm:text-sm">
            <span className="hidden sm:inline">[{fmtTimestamp()}] </span>C:\LAB&gt;
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              id="term-in"
              ref={inputRef}
              value={value}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              aria-label="Terminal command input"
              onChange={e => {
                const v = e.target.value.slice(0, 120);
                setValue(v);
                updateSuggestion(v);
                sound.play("key");
              }}
              onKeyDown={e => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  if (suggestion) {
                    const parts = value.split(" ");
                    parts[0] = (parts[0] ?? "") + suggestion;
                    setValue(parts.join(" "));
                    setSuggestion("");
                  }
                }
                if (e.key === "ArrowUp" && history.length) {
                  e.preventDefault();
                  const i = hIndex < 0 ? history.length - 1 : Math.max(0, hIndex - 1);
                  setHIndex(i);
                  setValue(history[i] ?? "");
                  updateSuggestion(history[i] ?? "");
                }
                if (e.key === "ArrowDown" && history.length) {
                  e.preventDefault();
                  const i = Math.min(history.length - 1, hIndex + 1);
                  setHIndex(i);
                  setValue(history[i] ?? "");
                  updateSuggestion(history[i] ?? "");
                }
                if (e.key === "Escape") store.setRt({ activeApp: null });
              }}
              className="w-full bg-transparent text-lab-green caret-transparent outline-none"
            />
            {/* Blinking block caret */}
            <span className="caret pointer-events-none inline-block h-[1.1em] w-[0.55em] bg-lab-green animate-pulse" aria-hidden />
          </div>
        </form>

        {/* Status bar */}
        <div className="mt-1 flex gap-4 text-[10px] text-lab-green/40 select-none">
          <span>TAB: autocomplete</span>
          <span>↑↓: history</span>
          <span>ESC: close</span>
          <span className="ml-auto">LAB OS v0.98 SE</span>
        </div>
      </div>
    </div>
  );
}
