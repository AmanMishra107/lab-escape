import { useRef, useState, type ReactNode } from "react";
import { Maximize2, Minimize2, Minus, X } from "lucide-react";
import { sound } from "../../systems/SoundSystem";

export function WindowFrame({
  title,
  onClose,
  onMinimize,
  onFocus,
  active,
  index,
  children,
}: {
  title: string;
  onClose: () => void;
  onMinimize?: () => void;
  onFocus: () => void;
  active: boolean;
  index: number;
  children: ReactNode;
}) {
  const [pos, setPos] = useState({ x: 18 + index * 26, y: 14 + index * 22 });
  const [isMaximized, setIsMaximized] = useState(false);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const toggleMaximize = () => {
    sound.play("click");
    setIsMaximized((m) => !m);
  };

  return (
    <section
      className={`window-in absolute flex flex-col overflow-hidden bg-card transition-all duration-150 ${active ? "brut z-30" : "brut-sm z-20"
        }`}
      style={
        isMaximized
          ? {
            left: 0,
            top: 0,
            width: "100%",
            height: "calc(100% - 44px)",
            borderRadius: 0,
          }
          : {
            left: `min(${pos.x}px, calc(100% - 120px))`,
            top: pos.y,
            width: "min(94%, 780px)",
            height: "min(86%, 560px)",
          }
      }
      onPointerDown={onFocus}
      aria-label={`${title} window`}
    >
      <header
        className="flex cursor-grab touch-none items-center justify-between border-b-3 border-lab-ink bg-lab-ink px-2 py-1 text-lab-paper select-none active:cursor-grabbing"
        onPointerDown={(e) => {
          if (isMaximized) return;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
        }}
        onPointerMove={(e) => {
          if (!drag.current || isMaximized) return;
          setPos({
            x: Math.max(0, e.clientX - drag.current.dx),
            y: Math.max(0, e.clientY - drag.current.dy),
          });
        }}
        onPointerUp={() => (drag.current = null)}
        onDoubleClick={toggleMaximize}
      >
        <span className="mono-label truncate font-bold">{title}</span>

        {/* Window action buttons: Minimize (_), Maximize/Restore (❐), Close (X) */}
        <div className="flex items-center gap-1">
          {onMinimize && (
            <button
              type="button"
              aria-label={`Minimize ${title}`}
              className="brut-press flex h-7 w-7 items-center justify-center border-2 border-lab-paper bg-lab-yellow text-lab-ink hover:brightness-110"
              onClick={(e) => {
                e.stopPropagation();
                sound.play("click");
                onMinimize();
              }}
              title="Minimize"
            >
              <Minus size={14} strokeWidth={3} />
            </button>
          )}

          <button
            type="button"
            aria-label={isMaximized ? `Restore ${title}` : `Maximize ${title}`}
            className="brut-press flex h-7 w-7 items-center justify-center border-2 border-lab-paper bg-lab-blue text-lab-paper hover:brightness-110"
            onClick={(e) => {
              e.stopPropagation();
              toggleMaximize();
            }}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? (
              <Minimize2 size={13} strokeWidth={3} />
            ) : (
              <Maximize2 size={13} strokeWidth={3} />
            )}
          </button>

          <button
            type="button"
            aria-label={`Close ${title}`}
            className="brut-press flex h-7 w-7 items-center justify-center border-2 border-lab-paper bg-lab-red text-lab-paper hover:brightness-110"
            onClick={(e) => {
              e.stopPropagation();
              sound.play("close");
              onClose();
            }}
            title="Close"
          >
            <X size={14} strokeWidth={3} />
          </button>
        </div>
      </header>

      <div className="scroll-thin min-h-0 flex-1 overflow-hidden p-3">{children}</div>
    </section>
  );
}
