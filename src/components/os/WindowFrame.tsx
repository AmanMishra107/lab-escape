import { useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { sound } from "../../systems/SoundSystem";

export function WindowFrame({
  title,
  onClose,
  onFocus,
  active,
  index,
  children,
}: {
  title: string;
  onClose: () => void;
  onFocus: () => void;
  active: boolean;
  index: number;
  children: ReactNode;
}) {
  const [pos, setPos] = useState({ x: 18 + index * 26, y: 14 + index * 22 });
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  return (
    <section
      className={`window-in absolute flex flex-col overflow-hidden bg-card ${active ? "brut z-30" : "brut-sm z-20"}`}
      style={{
        left: `min(${pos.x}px, calc(100% - 120px))`,
        top: pos.y,
        width: "min(94%, 780px)",
        height: "min(86%, 560px)",
      }}
      onPointerDown={onFocus}
      aria-label={`${title} window`}
    >
      <header
        className="flex cursor-grab touch-none items-center justify-between border-b-3 border-lab-ink bg-lab-ink px-2 py-1 text-lab-paper active:cursor-grabbing"
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setPos({ x: Math.max(0, e.clientX - drag.current.dx), y: Math.max(0, e.clientY - drag.current.dy) });
        }}
        onPointerUp={() => (drag.current = null)}
      >
        <span className="mono-label truncate">{title}</span>
        <button
          aria-label={`Close ${title}`}
          className="flex h-7 w-7 items-center justify-center border-2 border-lab-paper bg-lab-red text-lab-paper"
          onClick={(e) => {
            e.stopPropagation();
            sound.play("close");
            onClose();
          }}
        >
          <X size={14} strokeWidth={3} />
        </button>
      </header>
      <div className="scroll-thin min-h-0 flex-1 overflow-hidden p-3">{children}</div>
    </section>
  );
}
