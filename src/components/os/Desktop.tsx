import { lazy, Suspense, type ComponentType } from "react";
import {
  Award,
  ClipboardList,
  FolderOpen,
  Gamepad2,
  Minus,
  Puzzle,
  Settings,
  Smartphone,
  TerminalSquare,
} from "lucide-react";
import { store, useLab } from "../../systems/GameState";
import type { AppId } from "../../systems/types";
import { GameErrorBoundary } from "../common/ErrorBoundary";
import { WindowFrame } from "./WindowFrame";

const TerminalApp = lazy(() => import("../apps/TerminalApp").then((m) => ({ default: m.TerminalApp })));
const GamesApp = lazy(() => import("../apps/GamesApp").then((m) => ({ default: m.GamesApp })));
const PhoneApp = lazy(() => import("../apps/PhoneApp").then((m) => ({ default: m.PhoneApp })));
const NoticesApp = lazy(() => import("../apps/NoticesApp").then((m) => ({ default: m.NoticesApp })));
const FilesApp = lazy(() => import("../apps/FilesApp").then((m) => ({ default: m.FilesApp })));
const PuzzlesApp = lazy(() => import("../apps/PuzzlesApp").then((m) => ({ default: m.PuzzlesApp })));
const AchievementsApp = lazy(() => import("../apps/AchievementsApp").then((m) => ({ default: m.AchievementsApp })));
const SettingsApp = lazy(() => import("../apps/SettingsApp").then((m) => ({ default: m.SettingsApp })));

const APPS: { id: AppId; label: string; icon: ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { id: "terminal", label: "TERMINAL.EXE", icon: TerminalSquare },
  { id: "games", label: "GAMES.EXE", icon: Gamepad2 },
  { id: "phone", label: "PHONE.APP", icon: Smartphone },
  { id: "notices", label: "NOTICES.TXT", icon: ClipboardList },
  { id: "files", label: "FILES.EXE", icon: FolderOpen },
  { id: "puzzles", label: "PUZZLES.BIN", icon: Puzzle },
  { id: "achievements", label: "TROPHY.SYS", icon: Award },
  { id: "settings", label: "CONFIG.SYS", icon: Settings },
];

function AppBody({ id }: { id: AppId }) {
  switch (id) {
    case "terminal":
      return <TerminalApp onExit={() => store.closeApp("terminal")} />;
    case "games":
      return <GamesApp />;
    case "phone":
      return <PhoneApp />;
    case "notices":
      return <NoticesApp />;
    case "files":
      return <FilesApp />;
    case "puzzles":
      return <PuzzlesApp />;
    case "achievements":
      return <AchievementsApp />;
    case "settings":
      return <SettingsApp />;
    default:
      return null;
  }
}

export function Desktop() {
  const openApps = useLab((s) => s.rt.openApps);
  const minimizedApps = useLab((s) => s.rt.minimizedApps ?? []);
  const activeApp = useLab((s) => s.rt.activeApp);

  return (
    <div className="relative h-full w-full overflow-hidden bg-screen pb-10">
      {/* Desktop App Icons */}
      <div className="grid h-full grid-cols-3 content-start gap-2 overflow-y-auto p-3 sm:grid-cols-4 lg:grid-cols-6">
        {APPS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onDoubleClick={() => store.openApp(id)}
            onClick={() => store.openApp(id)}
            className="brut-sm brut-press flex flex-col items-center gap-1 bg-card p-2 text-center"
          >
            <Icon size={22} strokeWidth={2.5} />
            <span className="mono-label text-[9px] leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* Render open non-minimized windows */}
      {openApps.map((id, i) => {
        const isMinimized = minimizedApps.includes(id);
        if (isMinimized) return null;

        return (
          <WindowFrame
            key={id}
            index={i}
            active={activeApp === id}
            title={APPS.find((a) => a.id === id)?.label ?? id}
            onFocus={() => store.focusApp(id)}
            onMinimize={() => store.minimizeApp(id)}
            onClose={() => store.closeApp(id)}
          >
            <GameErrorBoundary label={id.toUpperCase()}>
              <Suspense fallback={<p className="mono-label">LOADING...</p>}>
                <AppBody id={id} />
              </Suspense>
            </GameErrorBoundary>
          </WindowFrame>
        );
      })}

      {/* OS Taskbar at the bottom */}
      {openApps.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-40 flex items-center gap-1.5 overflow-x-auto border-t-3 border-lab-ink bg-lab-ink p-1.5 shadow-lg">
          <span className="mono-label text-[10px] text-lab-paper px-1 font-bold tracking-wider">
            TASKBAR:
          </span>
          {openApps.map((id) => {
            const isMinimized = minimizedApps.includes(id);
            const isActive = activeApp === id && !isMinimized;
            const appLabel = APPS.find((a) => a.id === id)?.label ?? id;

            return (
              <button
                key={id}
                onClick={() => store.toggleMinimizeApp(id)}
                className={`mono-label shrink-0 border-2 border-lab-paper px-2.5 py-1 flex items-center gap-1.5 transition-all text-xs ${isMinimized
                  ? "bg-stone-800 text-stone-300 border-dashed opacity-85 hover:opacity-100"
                  : isActive
                    ? "bg-lab-yellow text-lab-ink font-bold shadow-md"
                    : "bg-stone-900 text-lab-paper hover:bg-stone-800"
                  }`}
                title={isMinimized ? `Restore ${appLabel}` : `Minimize / Focus ${appLabel}`}
              >
                {isMinimized && <Minus size={12} className="text-amber-400 stroke-[3]" />}
                <span>{appLabel}</span>
                {isMinimized && (
                  <span className="text-[9px] bg-amber-400 text-black px-1 rounded font-mono font-bold uppercase">
                    MINIMIZED
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
