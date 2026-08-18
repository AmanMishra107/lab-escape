import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";
import { sound } from "../../systems/SoundSystem";

type Variant = "default" | "primary" | "danger" | "go" | "warn" | "ghost";

const VARIANTS: Record<Variant, string> = {
  default: "bg-card text-foreground",
  primary: "bg-lab-blue text-lab-ink",
  danger: "bg-lab-red text-lab-paper",
  go: "bg-lab-green text-lab-ink",
  warn: "bg-lab-yellow text-lab-ink",
  ghost: "bg-transparent text-foreground shadow-none border-transparent",
};

export function BrutButton({
  variant = "default",
  className,
  children,
  onClick,
  onMouseEnter,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...rest}
      onMouseEnter={(e) => {
        sound.play("hover");
        onMouseEnter?.(e);
      }}
      onClick={(e) => {
        sound.play("click");
        onClick?.(e);
      }}
      className={cn(
        "brut brut-press mono-label inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Panel({
  title,
  right,
  className,
  bodyClassName,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { title?: ReactNode; right?: ReactNode; bodyClassName?: string }) {
  return (
    <div {...rest} className={cn("brut bg-card", className)}>
      {title !== undefined && (
        <div className="flex items-center justify-between border-b-3 border-lab-ink bg-lab-ink px-3 py-1.5 text-lab-paper">
          <span className="mono-label">{title}</span>
          {right}
        </div>
      )}
      <div className={cn("p-3", bodyClassName)}>{children}</div>
    </div>
  );
}

export function Meter({
  value,
  max = 100,
  tone = "ink",
  label,
}: {
  value: number;
  max?: number;
  tone?: "ink" | "red" | "green" | "yellow" | "blue";
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const bg = {
    ink: "bg-lab-ink",
    red: "bg-lab-red",
    green: "bg-lab-green",
    yellow: "bg-lab-yellow",
    blue: "bg-lab-blue",
  }[tone];
  return (
    <div
      className="flex items-center gap-2"
      role="meter"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "meter"}
    >
      <div className="h-3 flex-1 border-2 border-lab-ink bg-background">
        <div className={cn("h-full", bg)} style={{ width: `${pct}%` }} />
      </div>
      <span className="mono-label tabular-nums">{Math.round(pct)}%</span>
    </div>
  );
}

export function Tag({ children, tone = "ink" }: { children: ReactNode; tone?: "ink" | "red" | "green" | "yellow" | "blue" }) {
  const cls = {
    ink: "bg-lab-ink text-lab-paper",
    red: "bg-lab-red text-lab-paper",
    green: "bg-lab-green text-lab-ink",
    yellow: "bg-lab-yellow text-lab-ink",
    blue: "bg-lab-blue text-lab-ink",
  }[tone];
  return <span className={cn("mono-label border-2 border-lab-ink px-1.5 py-0.5", cls)}>{children}</span>;
}
