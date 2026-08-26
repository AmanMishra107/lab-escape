import { useEffect, useState } from "react";
import { store, useLab } from "../../systems/GameState";

import type { Phase } from "../../systems/types";

interface KeyCapItem {
  char: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h?: number;
  isEnter?: boolean;
  isDel?: boolean;
  isPass?: boolean;
  isNav?: boolean;
}

/**
 * 90s Retro Editorial Line Art Laboratory Scene.
 * Harmonized with the Neo-Brutalist design system of LAB ESCAPE:
 * High contrast cyan wall wallpaper, retro cream panels, solid ink outlines,
 * interactive retro props, real-time live wall clock, notice board, and CRT workstation.
 */
export function LabArt({ phase, boot }: { phase: Phase; boot: boolean }) {
  const chaotic = phase === "chaos" || phase === "panic" || phase === "escape";
  const [time, setTime] = useState(() => new Date());

  const typedPassword = useLab((s) => s.rt.typedPassword || "");
  const loginAuthenticated = useLab((s) => s.rt.loginAuthenticated);
  const activePressedKey = useLab((s) => s.rt.activePressedKey);
  const stickyNotes = useLab((s) => s.rt.stickyNotes || []);


  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        return;
      }

      if (e.key === "Backspace") {
        store.typeMonitorKey("Backspace");
      } else if (e.key === "Enter") {
        store.typeMonitorKey("Enter");
      } else if (e.key.length === 1) {
        store.typeMonitorKey(e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hours = (time.getHours() % 12) + time.getMinutes() / 60;
  const minutes = time.getMinutes() + time.getSeconds() / 60;
  const seconds = time.getSeconds();

  const hourAngle = hours * 30;
  const minuteAngle = minutes * 6;
  const secondAngle = seconds * 6;

  return (
    <svg
      viewBox="0 0 1600 900"
      className="absolute inset-0 h-full w-full select-none"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <pattern id="floorTile" width="120" height="70" patternUnits="userSpaceOnUse">
          <rect width="120" height="70" fill="var(--color-floor)" />
          <path d="M0 0 H120 M0 0 V70" stroke="var(--color-lab-ink)" strokeWidth="3" opacity="0.35" />
        </pattern>
        <pattern id="hatchPattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="4" height="10" fill="var(--color-lab-ink)" opacity="0.12" />
        </pattern>
      </defs>

      {/* ─── 1. ROOM SHELL & WALL ─── */}
      <rect width="1600" height="900" fill="var(--color-wall)" />
      <rect y="560" width="1600" height="340" fill="url(#floorTile)" />
      <rect y="520" width="1600" height="42" fill="var(--color-wall-deep)" stroke="var(--color-lab-ink)" strokeWidth="4" />
      <rect width="1600" height="900" fill="none" stroke="var(--color-lab-ink)" strokeWidth="8" />

      {/* Tube light (Ceiling) */}
      <g className="tube-light">
        <rect x="560" y="20" width="420" height="26" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="5" />
        <rect x="600" y="46" width="340" height="14" fill="var(--color-lab-yellow)" opacity="0.6" />
      </g>



      {/* ─── 2. WINDOW WITH BLINDS ─── */}
      <g transform="translate(410 90)">
        <rect x="-10" y="-10" width="300" height="200" fill="var(--color-lab-ink)" />
        <rect x="0" y="0" width="280" height="180" fill="#7dd3fc" />
        {/* Sun */}
        <circle cx="210" cy="45" r="28" fill="#fef08a" stroke="var(--color-lab-ink)" strokeWidth="3.5" />
        {/* Landscape */}
        <path d="M0 130 L60 85 L115 130 L180 75 L280 140 L280 180 L0 180 Z" fill="#22c55e" stroke="var(--color-lab-ink)" strokeWidth="3.5" />
        <rect x="30" y="110" width="36" height="70" fill="var(--color-desk-dark)" stroke="var(--color-lab-ink)" strokeWidth="3.5" />
        {/* Window grid */}
        <path d="M140 0 V180 M0 90 H280" stroke="var(--color-lab-ink)" strokeWidth="6" />
        <rect x="0" y="0" width="280" height="180" fill="none" stroke="var(--color-lab-ink)" strokeWidth="6" />
        {/* Window Blinds */}
        <rect x="-4" y="-12" width="288" height="18" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="4" />
        {[18, 36, 54, 72].map((y) => (
          <line key={y} x1="4" y1={y} x2="276" y2={y} stroke="var(--color-lab-ink)" strokeWidth="2.5" opacity="0.85" />
        ))}
      </g>

      {/* ─── 3. CORK NOTICE BOARD ─── */}
      <g transform="translate(60 90)">
        {/* Wood frame */}
        <rect x="-10" y="-10" width="320" height="230" rx="4" fill="#a06030" stroke="var(--color-lab-ink)" strokeWidth="7" />
        <rect x="0" y="0" width="300" height="210" fill="#c49a6c" stroke="var(--color-lab-ink)" strokeWidth="4" />
        {/* Board Header Banner */}
        <rect x="80" y="12" width="140" height="28" fill="var(--color-lab-yellow)" stroke="var(--color-lab-ink)" strokeWidth="3" />
        <text x="150" y="31" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="900" fontSize="13" fill="var(--color-lab-ink)" letterSpacing="1">
          NOTICE BOARD
        </text>

        {/* Note 1: Attendance */}
        <g transform="translate(18 48) rotate(-2)">
          <rect width="124" height="74" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="3" />
          <text x="62" y="18" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold" fontSize="9" fill="var(--color-lab-ink)">ATTENDANCE UPDATE</text>
          <text x="62" y="34" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="9" fill="var(--color-lab-ink)">Emotionally Reviewed.</text>
          <text x="62" y="50" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="8" fill="#555">- Management</text>
          <circle cx="62" cy="5" r="4.5" fill="var(--color-lab-ink)" stroke="var(--color-lab-ink)" strokeWidth="2" />
        </g>

        {/* Note 2: Wifi Password */}
        <g transform="translate(156 46) rotate(3)">
          <rect width="120" height="66" fill="var(--color-lab-blue)" stroke="var(--color-lab-ink)" strokeWidth="3" />
          <text x="60" y="20" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold" fontSize="9" fill="#fff">WIFI PASSWORD</text>
          <text x="60" y="38" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="900" fontSize="11" fill="var(--color-lab-yellow)">ASK NOBODY</text>
          <circle cx="60" cy="5" r="4.5" fill="var(--color-lab-ink)" stroke="var(--color-lab-ink)" strokeWidth="2" />
        </g>

        {/* Note 3: Important */}
        <g transform="translate(32 130) rotate(1)">
          <rect width="236" height="66" fill="var(--color-lab-yellow)" stroke="var(--color-lab-ink)" strokeWidth="3" />
          <text x="118" y="20" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold" fontSize="10" fill="var(--color-lab-ink)">IMPORTANT</text>
          <text x="118" y="36" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="9" fill="var(--color-lab-ink)">Don't sleep in the lab. Seriously.</text>
          <circle cx="20" cy="6" r="4.5" fill="var(--color-lab-ink)" stroke="var(--color-lab-ink)" strokeWidth="2" />
          <circle cx="216" cy="6" r="4.5" fill="var(--color-lab-ink)" stroke="var(--color-lab-ink)" strokeWidth="2" />
        </g>
      </g>

      {/* ─── 4. SMART WHITEBOARD ─── */}
      <g transform="translate(730 72)">
        {/* Outer Aluminum Frame */}
        <rect x="-12" y="-12" width="484" height="274" rx="6" fill="#94a3b8" stroke="var(--color-lab-ink)" strokeWidth="7" />
        {/* Clean Whiteboard Surface */}
        <rect x="0" y="0" width="460" height="250" fill="#ffffff" stroke="var(--color-lab-ink)" strokeWidth="4" />

        {/* Secret Corner Passcode */}
        <rect x="250" y="165" width="195" height="42" fill="#fee2e2" stroke="#dc2626" strokeWidth="2.5" strokeDasharray="4 2" />
        <text x="347" y="190" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="900" fontSize="13" fill="#dc2626">
          [CORNER CODE: 4040]
        </text>

        {/* Marker Tray at bottom */}
        <rect x="40" y="248" width="380" height="12" fill="#64748b" stroke="var(--color-lab-ink)" strokeWidth="3" />
        {/* Markers on tray */}
        <rect x="70" y="242" width="45" height="8" rx="2" fill="#2563eb" stroke="var(--color-lab-ink)" strokeWidth="1.5" />
        <rect x="130" y="242" width="45" height="8" rx="2" fill="#dc2626" stroke="var(--color-lab-ink)" strokeWidth="1.5" />
        <rect x="190" y="242" width="45" height="8" rx="2" fill="#16a34a" stroke="var(--color-lab-ink)" strokeWidth="1.5" />
        <rect x="250" y="242" width="45" height="8" rx="2" fill="#1e293b" stroke="var(--color-lab-ink)" strokeWidth="1.5" />
        {/* Felt Eraser */}
        <rect x="320" y="238" width="55" height="12" rx="2" fill="#334155" stroke="var(--color-lab-ink)" strokeWidth="2" />
        <rect x="320" y="246" width="55" height="4" fill="#94a3b8" />
      </g>

      {/* ─── 5. PROMINENT FRAMED WALL SIGN: LAB 404 (TOP LEFT WALL) ─── */}
      <g transform="translate(90 20)">
        <rect width="210" height="58" rx="3" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="5" />
        <rect x="6" y="5" width="198" height="48" fill="none" stroke="var(--color-lab-ink)" strokeWidth="2.5" strokeDasharray="5 3" />
        <text x="105" y="28" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="900" fontSize="22" fill="var(--color-lab-ink)">
          LAB 404
        </text>
        <text x="105" y="46" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold" fontSize="8" fill="var(--color-lab-ink)" letterSpacing="1">
          COMPUTER SCIENCE PRACTICAL LAB
        </text>
      </g>

      {/* ─── 6. STICKY NOTES ON WALL (Dynamic FIFO Queue of up to 3) ─── */}
      <g transform="translate(380 155) rotate(-6)">
        <rect width="70" height="66" fill="var(--color-lab-yellow)" stroke="var(--color-lab-ink)" strokeWidth="3.5" />
        <text x="35" y="24" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold" fontSize="9" fill="var(--color-lab-ink)">WORK</text>
        <text x="35" y="38" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold" fontSize="9" fill="var(--color-lab-ink)">HARD?</text>
        <text x="35" y="54" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="900" fontSize="10" fill="var(--color-lab-red)">NAH.</text>
      </g>

      {/* Dynamic wall notes */}
      {stickyNotes.slice(0, 3).map((note, index) => {
        const slots = [
          "translate(250 380) rotate(-3)",
          "translate(340 370) rotate(4)",
          "translate(295 455) rotate(-1)",
        ];
        const transform = slots[index] || slots[0];
        const rawLines = (note.body || "").split("\n").filter(Boolean);
        const displayLines: string[] = [];
        for (const line of rawLines) {
          if (line.length > 12) {
            displayLines.push(line.slice(0, 12));
            if (line.length > 12) displayLines.push(line.slice(12, 24));
          } else {
            displayLines.push(line);
          }
        }
        const linesToShow = displayLines.slice(0, 3);

        return (
          <g
            key={note.id || index}
            transform={transform}
            style={{ cursor: "pointer" }}
            onClick={() => store.focusObject("stickynote")}
            role="button"
            aria-label={`Sticky Note #${index + 1}: ${note.title}`}
          >
            <rect
              width="82"
              height="74"
              fill={note.color || "#ffb703"}
              stroke="var(--color-lab-ink)"
              strokeWidth="3.5"
              rx="1"
            />
            {/* Top fold subtle line */}
            <line x1="0" y1="5" x2="82" y2="5" stroke="var(--color-lab-ink)" strokeWidth="1" opacity="0.15" />
            {/* Hover shimmer overlay */}
            <rect width="82" height="74" fill="white" opacity="0" className="hover:opacity-15" style={{ transition: "opacity 0.15s" }} />
            {/* Pin emoji */}
            <text x="41" y="9" textAnchor="middle" fontSize="9">{note.emoji || "📌"}</text>
            {/* Title */}
            <text
              x="41"
              y="22"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontWeight="bold"
              fontSize="7.5"
              fill={note.textColor || "var(--color-lab-ink)"}
            >
              {(note.title || "NOTE:").slice(0, 14)}
            </text>
            {/* Body */}
            <text
              x="41"
              y="35"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontWeight="900"
              fontSize="8"
              fill={note.accentColor || "var(--color-lab-red)"}
            >
              {linesToShow.map((line, li) => (
                <tspan key={li} x="41" dy={li === 0 ? 0 : 10}>{line}</tspan>
              ))}
            </text>
            {/* Slot index & click hint */}
            <text x="41" y="68" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="4.5" fill="var(--color-lab-ink)" opacity="0.45">
              #{index + 1} • CLICK TO EDIT
            </text>
          </g>
        );
      })}



      {/* ─── 7. REAL-TIME ANALOG WALL CLOCK ─── */}
      <g transform="translate(1290 135)">
        <circle r="56" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="7" />
        <circle r="46" fill="none" stroke="var(--color-lab-ink)" strokeWidth="2" opacity="0.3" />
        {/* Clock Numbers / Ticks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={Math.sin(a) * 40}
              y1={-Math.cos(a) * 40}
              x2={Math.sin(a) * 46}
              y2={-Math.cos(a) * 46}
              stroke="var(--color-lab-ink)"
              strokeWidth={i % 3 === 0 ? "4" : "2"}
            />
          );
        })}
        {/* Live Moving Hands */}
        <line x1="0" y1="0" x2="0" y2="-25" stroke="var(--color-lab-ink)" strokeWidth="6" strokeLinecap="round" transform={`rotate(${hourAngle})`} />
        <line x1="0" y1="0" x2="0" y2="-36" stroke="var(--color-lab-ink)" strokeWidth="4.5" strokeLinecap="round" transform={`rotate(${minuteAngle})`} />
        <line x1="0" y1="0" x2="0" y2="-40" stroke="var(--color-lab-red)" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${secondAngle})`} />
        <circle r="6" fill="var(--color-lab-ink)" />
      </g>

      {/* ─── 8. MAIN DESK SURFACE & UNDER-DESK CABINET ─── */}
      <rect x="120" y="615" width="1360" height="38" fill="var(--color-desk)" stroke="var(--color-lab-ink)" strokeWidth="7" />
      <rect x="150" y="653" width="28" height="175" fill="var(--color-desk-dark)" stroke="var(--color-lab-ink)" strokeWidth="6" />
      <rect x="700" y="653" width="28" height="175" fill="var(--color-desk-dark)" stroke="var(--color-lab-ink)" strokeWidth="6" />
      <rect x="1420" y="653" width="28" height="175" fill="var(--color-desk-dark)" stroke="var(--color-lab-ink)" strokeWidth="6" />

      {/* ─── 8B. 3-TIER DESK DRAWER CABINET ─── */}
      <g transform="translate(1210 653)">
        {/* Outer Cabinet Frame */}
        <rect width="190" height="175" fill="#a06030" stroke="var(--color-lab-ink)" strokeWidth="6" rx="4" />
        <rect x="4" y="4" width="182" height="167" fill="#854d0e" stroke="var(--color-lab-ink)" strokeWidth="3" />

        {/* Drawer 1 (Top: Stationery & Junk) */}
        <rect x="10" y="8" width="170" height="48" fill="#ca8a04" stroke="var(--color-lab-ink)" strokeWidth="4" rx="3" />
        <rect x="70" y="24" width="45" height="14" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="3" rx="2" />
        <circle cx="26" cy="32" r="4" fill="var(--color-lab-ink)" />

        {/* Drawer 2 (Middle: Lab Manuals & USB) */}
        <rect x="10" y="62" width="170" height="48" fill="#ca8a04" stroke="var(--color-lab-ink)" strokeWidth="4" rx="3" />
        <rect x="70" y="78" width="45" height="14" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="3" rx="2" />
        <rect x="18" y="76" width="38" height="16" fill="var(--color-lab-yellow)" stroke="var(--color-lab-ink)" strokeWidth="2" />
        <text x="37" y="87" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold" fontSize="6" fill="var(--color-lab-ink)">MANUALS</text>

        {/* Drawer 3 (Bottom: False Bottom & Chip) */}
        <rect x="10" y="116" width="170" height="50" fill="#a16207" stroke="var(--color-lab-ink)" strokeWidth="4" rx="3" />
        <rect x="70" y="134" width="45" height="14" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="3" rx="2" />
        <circle cx="26" cy="141" r="5" fill="var(--color-lab-ink)" />
      </g>

      {/* ─── 8C. SMARTPHONE ON DESK ─── */}
      <g transform="translate(1000 530)">
        {/* Phone Body */}
        <rect width="48" height="85" rx="10" fill="#0f172a" stroke="var(--color-lab-ink)" strokeWidth="4" />
        {/* Glowing Screen */}
        <rect x="4" y="6" width="40" height="73" rx="6" fill="#1e1b4b" stroke="var(--color-lab-ink)" strokeWidth="2" />

        {/* Screen Notification Content */}
        <rect x="7" y="12" width="34" height="20" rx="3" fill="#312e81" />
        <text x="24" y="22" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold" fontSize="5" fill="#7dd3fc">💬 LAB CHAT</text>
        <text x="24" y="29" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="4.5" fill="#fef08a">3 UNREAD</text>

        {/* Home Bar & Speaker */}
        <rect x="16" y="9" width="16" height="2" rx="1" fill="#64748b" />
        <rect x="18" y="75" width="12" height="2" rx="1" fill="#94a3b8" />

        {/* Pulsing Green LED */}
        <circle cx="38" cy="9" r="2" fill="#22c55e" className="led" stroke="var(--color-lab-ink)" strokeWidth="1" />
      </g>

      {/* ─── 8D. ACCESSORIES ON DESK ─── */}
      {/* Detailed Desk Trash Bin with Funny Charts, Pen, Paper & Snacks */}
      <g transform="translate(180 505)">
        {/* Overflowing Trash Items Inside Can */}
        {/* 1. Crumpled Chart (MY MARKS 📉) */}
        <g transform="translate(-14 -22) rotate(-14)">
          <rect width="56" height="42" rx="3" fill="#ffffff" stroke="var(--color-lab-ink)" strokeWidth="2.5" />
          <text x="28" y="11" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="900" fontSize="5.5" fill="#dc2626">MARKS 📉</text>
          <path d="M8 17 L18 24 L34 35 L48 38" stroke="#dc2626" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="40" cy="24" r="6" fill="#38bdf8" stroke="var(--color-lab-ink)" strokeWidth="1" />
          <path d="M40 24 L46 24 A6 6 0 1 1 40 18 Z" fill="#f43f5e" />
        </g>

        {/* 2. Leaking Broken Pen */}
        <g transform="translate(46 -16) rotate(22)">
          <rect width="7" height="40" rx="1.5" fill="var(--color-lab-blue)" stroke="var(--color-lab-ink)" strokeWidth="2" />
          <path d="M0 0 L3.5 -7 L7 0 Z" fill="var(--color-lab-ink)" />
        </g>
        <circle cx="58" cy="25" r="3.5" fill="var(--color-lab-blue)" stroke="var(--color-lab-ink)" strokeWidth="1" />

        {/* 3. Rejected Viva & Exam Notes */}
        <g transform="translate(28 -14) rotate(12)">
          <rect width="48" height="34" rx="2" fill="var(--color-lab-yellow)" stroke="var(--color-lab-ink)" strokeWidth="2.5" />
          <text x="24" y="13" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold" fontSize="5" fill="var(--color-lab-ink)">VIVA 0/100</text>
          <text x="24" y="23" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="900" fontSize="5.5" fill="#dc2626">REJECTED!</text>
        </g>

        {/* 4. Crushed Soda Can / Snack */}
        <g transform="translate(14 -10) rotate(-6)">
          <rect width="18" height="24" rx="3" fill="#ef4444" stroke="var(--color-lab-ink)" strokeWidth="2" />
          <text x="9" y="14" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold" fontSize="4.5" fill="#fff">404</text>
        </g>

        {/* 5. Discarded Floppy Disk (NO BUGS) */}
        <g transform="translate(0 -6) rotate(-18)">
          <rect width="25" height="25" rx="1.5" fill="#1e293b" stroke="var(--color-lab-ink)" strokeWidth="2" />
          <rect x="4" y="3" width="17" height="10" fill="#ffffff" />
          <text x="12.5" y="10" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold" fontSize="3.5" fill="#000">NO BUGS</text>
        </g>

        {/* Outer Trash Can Mesh Container */}
        <path d="M5 25 L85 25 L75 110 L15 110 Z" fill="var(--color-card)" stroke="var(--color-lab-ink)" strokeWidth="5" />
        <rect x="0" y="16" width="90" height="12" rx="3" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="4" />
        
        {/* Mesh Wire Lines */}
        <path d="M12 36 H78 M14 56 H76 M16 76 H74 M18 96 H72" stroke="var(--color-lab-ink)" strokeWidth="2" strokeDasharray="5 3" opacity="0.65" />
        
        {/* Trash Can Badge */}
        <rect x="23" y="60" width="44" height="20" rx="2" fill="var(--color-lab-yellow)" stroke="var(--color-lab-ink)" strokeWidth="2" />
        <text x="45" y="73" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="900" fontSize="7.5" fill="var(--color-lab-ink)">TRASH</text>
      </g>

      {/* Coffee Mug */}
      <g transform="translate(290 555)">
        <rect width="44" height="60" rx="4" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="4.5" />
        <path d="M44 14 Q58 14 58 30 Q58 46 44 46" stroke="var(--color-lab-ink)" strokeWidth="4.5" fill="none" />
        <text x="22" y="26" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold" fontSize="6" fill="var(--color-lab-ink)">WORLD'S</text>
        <text x="22" y="34" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold" fontSize="6" fill="var(--color-lab-ink)">OKAYEST</text>
        <text x="22" y="42" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold" fontSize="6" fill="var(--color-lab-ink)">STUDENT</text>
      </g>

      {/* Blue Water Bottle */}
      <g transform="translate(350 510)">
        <rect width="44" height="105" rx="10" fill="var(--color-lab-blue)" stroke="var(--color-lab-ink)" strokeWidth="5" />
        <rect x="11" y="-18" width="22" height="20" rx="3" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="4.5" />
        <circle cx="22" cy="55" r="11" fill="var(--color-lab-yellow)" stroke="var(--color-lab-ink)" strokeWidth="2.5" />
        <circle cx="18" cy="51" r="1.5" fill="var(--color-lab-ink)" />
        <circle cx="26" cy="51" r="1.5" fill="var(--color-lab-ink)" />
        <path d="M17 58 Q22 63 27 58" stroke="var(--color-lab-ink)" strokeWidth="2" fill="none" />
      </g>



      {/* ─── 9. CRT COMPUTER MONITOR WITH LIVE TYPING TERMINAL ─── */}
      <g transform="translate(480 300)">
        {/* Base & Stand */}
        <rect x="126" y="260" width="130" height="55" rx="4" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="6" />
        <rect x="154" y="220" width="74" height="42" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="6" />

        {/* Outer Bezel */}
        <rect width="382" height="236" rx="16" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="9" />
        <rect x="16" y="14" width="350" height="192" rx="10" fill="var(--color-lab-ink)" />
        <rect x="28" y="24" width="326" height="172" fill="var(--color-screen)" stroke="var(--color-lab-ink)" strokeWidth="6" />

        {/* Monitor Branding */}
        <text x="191" y="222" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold" fontSize="10" fill="var(--color-lab-ink)">
          LAB-OS 1.0 (SECURE TERMINAL)
        </text>

        {/* Terminal Live Screen Content */}
        {loginAuthenticated ? (
          <g fontFamily="var(--font-mono)" fontWeight="bold" fontSize="14" fill="var(--color-screen-glow)">
            <text x="44" y="54" fill="var(--color-lab-green)">[STATUS] ACCESS GRANTED</text>
            <text x="44" y="80">C:\LAB&gt; run lab_escape</text>
            <text x="44" y="106">loading OS desktop...</text>
            <text x="44" y="132" fill="var(--color-lab-yellow)">WELCOME STUDENT [XP +50]</text>
            <text x="44" y="160">C:\LAB&gt; <tspan className="caret">_</tspan></text>
          </g>
        ) : (
          <g fontFamily="var(--font-mono)" fontWeight="bold" fontSize="13" fill="var(--color-screen-glow)">
            <text x="44" y="50">C:\LAB&gt; SECURE_LOGIN</text>
            <text x="44" y="74" fill="var(--color-lab-yellow)">USER: student</text>
            <text x="44" y="98">
              PASS: <tspan fill="#38bdf8">[ {"•".repeat(typedPassword.length)}<tspan className="caret">_</tspan> ]</tspan>
            </text>
            <text x="44" y="128" fontSize="11" fill="#fef08a">
              {typedPassword ? `TYPING PASSCODE: ${typedPassword}` : "TYPE PASSCODE (e.g. 4040)"}
            </text>
            <text x="44" y="150" fontSize="10" fill="#94a3b8">
              [PRESS ENTER OR CLICK KEYS BELOW]
            </text>
          </g>
        )}

        {/* Screen Glass Sheen */}
        <path d="M28 24 L160 24 L56 186 L28 186 Z" fill="#ffffff" opacity="0.08" />

        {/* Power Button & LED */}
        <circle cx="348" cy="218" r="7" fill={loginAuthenticated ? "var(--color-lab-green)" : chaotic ? "var(--color-lab-red)" : "var(--color-lab-yellow)"} className="led" stroke="var(--color-lab-ink)" strokeWidth="2.5" />
        <rect x="338" y="188" width="4" height="4" fill="var(--color-lab-ink)" />
      </g>

      {/* ─── 10. ENLARGED 3D REAL INTERACTIVE KEYBOARD CENTERED ON DESK ─── */}
      {/* Keyboard Wire connecting to CRT Monitor */}
      <path d="M670 540 Q670 520 650 500" stroke="var(--color-lab-ink)" strokeWidth="3.5" fill="none" opacity="0.7" />

      {/* Keyboard Base & Tactile Keycaps (Tilted 3D perspective lying flat on desk) */}
      <g transform="translate(425 542) skewX(-6) scale(1, 0.80)">
        {/* 3D Drop Shadow & Front Bevel Lip resting ON desk (y=615) */}
        <path d="M-8 94 L492 94 L486 100 L-10 100 Z" fill="var(--color-lab-ink)" opacity="0.25" />
        <path d="M0 82 L490 82 L484 94 L-6 94 Z" fill="#94a3b8" stroke="var(--color-lab-ink)" strokeWidth="3.5" />
        <path d="M-6 94 L0 82 L0 0 L-6 12 Z" fill="#64748b" stroke="var(--color-lab-ink)" strokeWidth="3" />
        <rect width="490" height="82" rx="6" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="4.5" />
        <rect x="6" y="3" width="478" height="76" rx="4" fill="var(--color-lab-ink)" opacity="0.08" />

        {/* Status Indicator LEDs above Numpad */}
        <circle cx="368" cy="6" r="1.5" fill="#22c55e" />
        <text x="368" y="11" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="3.5" fontWeight="bold" fill="var(--color-lab-ink)">NUM</text>
        <circle cx="390" cy="6" r="1.5" fill="#22c55e" />
        <text x="390" y="11" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="3.5" fontWeight="bold" fill="var(--color-lab-ink)">CAPS</text>
        <circle cx="412" cy="6" r="1.5" fill="#eab308" />
        <text x="412" y="11" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="3.5" fontWeight="bold" fill="var(--color-lab-ink)">SCRL</text>

        {/* FULL 104-KEY RETRO KEYBOARD LAYOUT: ALPHANUMERIC + NAV + ARROWS + NUMPAD */}
        {[
          // ROW 0: FUNCTION KEYS
          { char: "Escape", label: "ESC", x: 10, y: 5, w: 18 },
          { char: "F1", label: "F1", x: 33, y: 5, w: 17 },
          { char: "F2", label: "F2", x: 52, y: 5, w: 17 },
          { char: "F3", label: "F3", x: 71, y: 5, w: 17 },
          { char: "F4", label: "F4", x: 90, y: 5, w: 17 },
          { char: "F5", label: "F5", x: 114, y: 5, w: 17 },
          { char: "F6", label: "F6", x: 133, y: 5, w: 17 },
          { char: "F7", label: "F7", x: 152, y: 5, w: 17 },
          { char: "F8", label: "F8", x: 171, y: 5, w: 17 },
          { char: "F9", label: "F9", x: 194, y: 5, w: 17 },
          { char: "F10", label: "F10", x: 213, y: 5, w: 17 },
          { char: "F11", label: "F11", x: 232, y: 5, w: 17 },
          { char: "F12", label: "F12", x: 251, y: 5, w: 17 },
          { char: "PrintScreen", label: "PRT", x: 274, y: 5, w: 18 },
          { char: "ScrollLock", label: "SCR", x: 294, y: 5, w: 18 },
          { char: "Pause", label: "PAU", x: 314, y: 5, w: 18 },

          // ROW 1: NUMBERS + NAV TOP + NUMPAD ROW 1
          { char: "`", label: "~", x: 10, y: 17, w: 17 },
          { char: "1", label: "1", x: 29, y: 17, w: 17 },
          { char: "2", label: "2", x: 48, y: 17, w: 17 },
          { char: "3", label: "3", x: 67, y: 17, w: 17 },
          { char: "4", label: "4", x: 86, y: 17, w: 17, isPass: true },
          { char: "5", label: "5", x: 105, y: 17, w: 17 },
          { char: "6", label: "6", x: 124, y: 17, w: 17 },
          { char: "7", label: "7", x: 143, y: 17, w: 17 },
          { char: "8", label: "8", x: 162, y: 17, w: 17 },
          { char: "9", label: "9", x: 181, y: 17, w: 17 },
          { char: "0", label: "0", x: 200, y: 17, w: 17, isPass: true },
          { char: "-", label: "-", x: 219, y: 17, w: 17 },
          { char: "=", label: "=", x: 238, y: 17, w: 17 },
          { char: "Backspace", label: "DEL", x: 257, y: 17, w: 32, isDel: true },
          { char: "Insert", label: "INS", x: 294, y: 17, w: 18 },
          { char: "Home", label: "HM", x: 314, y: 17, w: 18 },
          { char: "PageUp", label: "PU", x: 334, y: 17, w: 18 },
          { char: "NumLock", label: "NUM", x: 360, y: 17, w: 18 },
          { char: "/", label: "/", x: 380, y: 17, w: 18 },
          { char: "*", label: "*", x: 400, y: 17, w: 18 },
          { char: "-", label: "-", x: 420, y: 17, w: 18 },

          // ROW 2: QWERTY + NAV MID + NUMPAD ROW 2
          { char: "Tab", label: "TAB", x: 10, y: 30, w: 25 },
          { char: "Q", label: "Q", x: 37, y: 30, w: 17 },
          { char: "W", label: "W", x: 56, y: 30, w: 17 },
          { char: "E", label: "E", x: 75, y: 30, w: 17 },
          { char: "R", label: "R", x: 94, y: 30, w: 17 },
          { char: "T", label: "T", x: 113, y: 30, w: 17 },
          { char: "Y", label: "Y", x: 132, y: 30, w: 17 },
          { char: "U", label: "U", x: 151, y: 30, w: 17 },
          { char: "I", label: "I", x: 170, y: 30, w: 17 },
          { char: "O", label: "O", x: 189, y: 30, w: 17 },
          { char: "P", label: "P", x: 208, y: 30, w: 17 },
          { char: "[", label: "[", x: 227, y: 30, w: 17 },
          { char: "]", label: "]", x: 246, y: 30, w: 17 },
          { char: "\\", label: "\\", x: 265, y: 30, w: 24 },
          { char: "Delete", label: "DEL", x: 294, y: 30, w: 18, isDel: true },
          { char: "End", label: "END", x: 314, y: 30, w: 18 },
          { char: "PageDown", label: "PD", x: 334, y: 30, w: 18 },
          { char: "7", label: "7", x: 360, y: 30, w: 18 },
          { char: "8", label: "8", x: 380, y: 30, w: 18 },
          { char: "9", label: "9", x: 400, y: 30, w: 18 },
          { char: "+", label: "+", x: 420, y: 30, w: 18, h: 24 },

          // ROW 3: ASDFGH + ARROW UP + NUMPAD ROW 3
          { char: "CapsLock", label: "CAPS", x: 10, y: 43, w: 29 },
          { char: "A", label: "A", x: 41, y: 43, w: 17 },
          { char: "S", label: "S", x: 60, y: 43, w: 17 },
          { char: "D", label: "D", x: 79, y: 43, w: 17 },
          { char: "F", label: "F", x: 98, y: 43, w: 17 },
          { char: "G", label: "G", x: 117, y: 43, w: 17 },
          { char: "H", label: "H", x: 136, y: 43, w: 17 },
          { char: "J", label: "J", x: 155, y: 43, w: 17 },
          { char: "K", label: "K", x: 174, y: 43, w: 17 },
          { char: "L", label: "L", x: 193, y: 43, w: 17 },
          { char: ";", label: ";", x: 212, y: 43, w: 17 },
          { char: "'", label: "'", x: 231, y: 43, w: 17 },
          { char: "Enter", label: "ENTER", x: 250, y: 43, w: 39, isEnter: true },
          { char: "ArrowUp", label: "▲", x: 314, y: 43, w: 18, isNav: true },
          { char: "4", label: "4", x: 360, y: 43, w: 18, isPass: true },
          { char: "5", label: "5", x: 380, y: 43, w: 18 },
          { char: "6", label: "6", x: 400, y: 43, w: 18 },

          // ROW 4: ZXCVBNM + ARROWS LEFT/DOWN/RIGHT + NUMPAD ROW 4
          { char: "Shift", label: "SHIFT", x: 10, y: 56, w: 34 },
          { char: "Z", label: "Z", x: 46, y: 56, w: 17 },
          { char: "X", label: "X", x: 65, y: 56, w: 17 },
          { char: "C", label: "C", x: 84, y: 56, w: 17 },
          { char: "V", label: "V", x: 103, y: 56, w: 17 },
          { char: "B", label: "B", x: 122, y: 56, w: 17 },
          { char: "N", label: "N", x: 141, y: 56, w: 17 },
          { char: "M", label: "M", x: 160, y: 56, w: 17 },
          { char: ",", label: ",", x: 179, y: 56, w: 17 },
          { char: ".", label: ".", x: 198, y: 56, w: 17 },
          { char: "/", label: "/", x: 217, y: 56, w: 17 },
          { char: "Shift", label: "SHIFT", x: 236, y: 56, w: 53 },
          { char: "ArrowLeft", label: "◄", x: 294, y: 56, w: 18, isNav: true },
          { char: "ArrowDown", label: "▼", x: 314, y: 56, w: 18, isNav: true },
          { char: "ArrowRight", label: "►", x: 334, y: 56, w: 18, isNav: true },
          { char: "1", label: "1", x: 360, y: 56, w: 18 },
          { char: "2", label: "2", x: 380, y: 56, w: 18 },
          { char: "3", label: "3", x: 400, y: 56, w: 18 },
          { char: "Enter", label: "ENT", x: 420, y: 56, w: 18, h: 24, isEnter: true },

          // ROW 5: SPACEBAR ROW + NUMPAD ROW 5
          { char: "Control", label: "CTRL", x: 10, y: 69, w: 26 },
          { char: "Meta", label: "WIN", x: 38, y: 69, w: 20 },
          { char: "Alt", label: "ALT", x: 60, y: 69, w: 22 },
          { char: " ", label: "SPACEBAR", x: 84, y: 69, w: 128 },
          { char: "Alt", label: "ALT", x: 214, y: 69, w: 22 },
          { char: "Meta", label: "WIN", x: 238, y: 69, w: 20 },
          { char: "Control", label: "CTRL", x: 260, y: 69, w: 29 },
          { char: "0", label: "0", x: 360, y: 69, w: 38, isPass: true },
          { char: ".", label: ".", x: 400, y: 69, w: 18 },
        ].map((k, idx) => {
          const isPressed = activePressedKey === k.char || activePressedKey === k.label;
          const keyHeight = k.h || 11;
          const yPos = k.y + (isPressed ? 1.5 : 0);
          return (
            <g
              key={k.char + k.x + idx}
              className="cursor-pointer transition-transform hover:opacity-95"
              onClick={(e) => {
                e.stopPropagation();
                store.typeMonitorKey(k.char);
              }}
            >
              <rect
                x={k.x}
                y={yPos}
                width={k.w}
                height={keyHeight}
                rx={2}
                fill={
                  isPressed
                    ? "var(--color-lab-yellow)"
                    : k.isEnter
                      ? "#22c55e"
                      : k.isDel
                        ? "#ef4444"
                        : k.isPass
                          ? "#fef08a"
                          : k.isNav
                            ? "#e2e8f0"
                            : "var(--color-lab-paper)"
                }
                stroke="var(--color-lab-ink)"
                strokeWidth="1.5"
              />
              <text
                x={k.x + k.w / 2}
                y={yPos + (keyHeight > 15 ? 14 : 8)}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontWeight="bold"
                fontSize={k.label.length > 5 ? "5.5" : k.label.length > 3 ? "6.5" : "7"}
                fill="var(--color-lab-ink)"
                className="pointer-events-none"
              >
                {k.label}
              </text>
            </g>
          );
        })}
      </g>

      {/* 2.5D Mouse & Mousepad Lying Flat on Desk Level */}
      <g transform="translate(915 558)">
        {/* Mouse Wire */}
        <path d="M32 8 Q38 -8 20 -28" stroke="var(--color-lab-ink)" strokeWidth="2.5" fill="none" opacity="0.7" />

        {/* Green Slanted 3D Mousepad */}
        <path d="M0 0 L75 -3 L70 48 L-5 52 Z" fill="var(--color-lab-green)" stroke="var(--color-lab-ink)" strokeWidth="3" />
        <path d="M-5 52 L70 48 L68 53 L-7 57 Z" fill="#1b4332" stroke="var(--color-lab-ink)" strokeWidth="2" />

        {/* Ergonomic 3D Mouse Lying Flat on Mousepad */}
        <g transform="translate(15 6) rotate(-4)">
          {/* 3D Mouse Drop Shadow on Pad */}
          <ellipse cx="22" cy="24" rx="20" ry="14" fill="var(--color-lab-ink)" opacity="0.3" />

          {/* 3D Ergonomic Mouse Base & Bevel Edge */}
          <path d="M4 18 Q22 6 40 18 Q44 32 38 40 Q22 46 6 40 Q0 32 4 18 Z" fill="#94a3b8" stroke="var(--color-lab-ink)" strokeWidth="3" />
          {/* Main Ergonomic Top Shell */}
          <path d="M4 14 Q22 2 40 14 Q43 28 37 36 Q22 42 7 36 Q1 28 4 14 Z" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="3" />

          {/* Left & Right Button Seam Line */}
          <path d="M22 4 V20 M8 16 H36" stroke="var(--color-lab-ink)" strokeWidth="2" fill="none" />

          {/* Tactile 3D Rubber Scroll Wheel */}
          <rect x="19.5" y="8" width="5" height="9" rx="2" fill="var(--color-lab-ink)" stroke="var(--color-lab-paper)" strokeWidth="1" />

          {/* Side Grip Ridges */}
          <path d="M3 24 Q5 28 3 32 M41 24 Q39 28 41 32" stroke="var(--color-lab-ink)" strokeWidth="1.5" fill="none" />
        </g>
      </g>

      {/* ─── 11. CPU TOWER WITH CACTUS (Clickable interactive Workstation Tower) ─── */}
      <g
        transform="translate(1060 375)"
        style={{ cursor: "pointer" }}
        onClick={() => store.focusObject("cpu")}
        role="button"
        aria-label="Workstation CPU Tower - Click to open chassis"
      >
        <rect width="125" height="240" fill="#d4cca9" stroke="var(--color-lab-ink)" strokeWidth="7" />
        {/* Hover shimmer */}
        <rect width="125" height="240" fill="white" opacity="0" className="hover:opacity-15" style={{ transition: "opacity 0.15s" }} />

        {/* 5.25" Drive Bays */}
        <rect x="18" y="20" width="89" height="20" fill="var(--color-lab-ink)" opacity="0.4" />
        <rect x="24" y="28" width="60" height="4" fill="var(--color-lab-paper)" opacity="0.6" />
        <circle cx="95" cy="30" r="2.5" fill="var(--color-lab-paper)" opacity="0.8" />
        
        <rect x="18" y="48" width="89" height="14" fill="var(--color-lab-ink)" opacity="0.25" />
        <rect x="24" y="53" width="40" height="4" fill="var(--color-lab-paper)" opacity="0.6" />

        {/* Badge: Property of Lab 404 */}
        <rect x="18" y="165" width="89" height="34" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="3" />
        <text x="62" y="179" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold" fontSize="7" fill="var(--color-lab-ink)">PROPERTY OF</text>
        <text x="62" y="191" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="900" fontSize="8" fill="var(--color-lab-red)">LAB 404 RIG</text>

        {/* Fan / Vent Grill with spinning effect */}
        <circle cx="62" cy="108" r="32" fill="#222" stroke="var(--color-lab-ink)" strokeWidth="5" />
        <g style={{ transformOrigin: "62px 108px", animation: "spin 1.8s linear infinite" }}>
          {/* 4 Fan Blades */}
          <path d="M62 108 Q72 82 86 86 Q76 100 62 108 Z" fill="#444" />
          <path d="M62 108 Q88 118 86 132 Q72 122 62 108 Z" fill="#444" />
          <path d="M62 108 Q52 134 38 130 Q48 116 62 108 Z" fill="#444" />
          <path d="M62 108 Q36 98 38 84 Q52 94 62 108 Z" fill="#444" />
        </g>
        <circle cx="62" cy="108" r="32" fill="none" stroke="var(--color-lab-ink)" strokeWidth="5" />
        <line x1="36" y1="108" x2="88" y2="108" stroke="var(--color-lab-ink)" strokeWidth="3.5" />
        <line x1="62" y1="82" x2="62" y2="134" stroke="var(--color-lab-ink)" strokeWidth="3.5" />
        <circle cx="62" cy="108" r="10" fill="var(--color-lab-red)" stroke="var(--color-lab-ink)" strokeWidth="2" />

        {/* LEDs */}
        <circle cx="30" cy="216" r="5" fill="var(--color-lab-green)" className="led" stroke="var(--color-lab-ink)" strokeWidth="2" />
        <circle cx="48" cy="216" r="5" fill="var(--color-lab-yellow)" stroke="var(--color-lab-ink)" strokeWidth="2" />
        <text x="84" y="219" fontFamily="var(--font-mono)" fontSize="6" fontWeight="bold" fill="var(--color-lab-ink)" opacity="0.6">CLICK ME</text>

        {/* Potted Cactus on top */}
        <g transform="translate(38 -54)">
          <path d="M10 26 L40 26 L36 54 L14 54 Z" fill="var(--color-lab-red)" stroke="var(--color-lab-ink)" strokeWidth="4" />
          <rect x="8" y="20" width="34" height="8" rx="2" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="3" />
          {/* Cactus plant */}
          <rect x="21" y="-8" width="8" height="30" rx="4" fill="var(--color-lab-green)" stroke="var(--color-lab-ink)" strokeWidth="3" />
          <path d="M14 8 H21 V18 H14 Z" fill="var(--color-lab-green)" stroke="var(--color-lab-ink)" strokeWidth="3" />
          <path d="M29 3 H36 V14 H29 Z" fill="var(--color-lab-green)" stroke="var(--color-lab-ink)" strokeWidth="3" />
        </g>
      </g>


      {/* ─── 12. PEN HOLDER & ORGANIZER (Positioned to the right of CPU Tower) ─── */}
      <g transform="translate(1195 540)">
        {/* Pen holder cup */}
        <rect width="40" height="75" rx="4" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="5" />
        <path d="M8 -20 L12 0 M18 -25 L20 0 M28 -18 L26 0" stroke="var(--color-lab-blue)" strokeWidth="4" strokeLinecap="round" />
        <path d="M12 -22 L14 0 M24 -20 L22 0" stroke="var(--color-lab-red)" strokeWidth="4" strokeLinecap="round" />
        <path d="M32 -22 L30 0" stroke="var(--color-lab-yellow)" strokeWidth="4" strokeLinecap="round" />

        {/* Organizer Tray */}
        <g transform="translate(50 20)">
          <rect width="80" height="55" fill="var(--color-desk-dark)" stroke="var(--color-lab-ink)" strokeWidth="5" />
          <rect x="10" y="22" width="30" height="14" rx="2" fill="var(--color-lab-ink)" stroke="var(--color-lab-paper)" strokeWidth="2" />
        </g>
      </g>

      {/* ─── 13. RETRO PRINTER 2 (Resting properly on desk surface y=615) ─── */}
      <g transform="translate(1340 455)">
        {/* Rear Paper Feed Tray (Angled Input Paper Stack) */}
        <g transform="translate(25 -42) rotate(-4)">
          <rect width="165" height="55" rx="3" fill="#ffffff" stroke="var(--color-lab-ink)" strokeWidth="4" />
          <line x1="12" y1="5" x2="12" y2="50" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="153" y1="5" x2="153" y2="50" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 3" />
          {/* Stacked paper depth shadow */}
          <rect x="-4" y="-3" width="165" height="8" fill="#e2e8f0" stroke="var(--color-lab-ink)" strokeWidth="2" />
        </g>

        {/* Main Printer Body Base */}
        <rect width="220" height="150" rx="10" fill="#e2e8f0" stroke="var(--color-lab-ink)" strokeWidth="7" />

        {/* Printer Dark Accent Lid / Window */}
        <rect x="15" y="18" width="145" height="52" rx="5" fill="#334155" stroke="var(--color-lab-ink)" strokeWidth="4" />
        <path d="M22 25 L80 25 L50 65 L22 65 Z" fill="#ffffff" opacity="0.12" />

        {/* Paper Ejection Output Slot */}
        <rect x="20" y="76" width="135" height="14" rx="3" fill="var(--color-lab-ink)" />

        {/* Ejected Printed Sheet (Tractor-feed continuous paper) */}
        <g transform="translate(25 84)">
          <rect width="125" height="90" fill="#ffffff" stroke="var(--color-lab-ink)" strokeWidth="3" />
          {/* Tractor Feed Holes */}
          {[10, 25, 40, 55, 70, 85].map((y) => (
            <g key={y}>
              <circle cx="6" cy={y} r="2" fill="var(--color-lab-ink)" />
              <circle cx="119" cy={y} r="2" fill="var(--color-lab-ink)" />
            </g>
          ))}
          {/* Printed Text Lines */}
          <text x="18" y="20" fontFamily="var(--font-mono)" fontWeight="bold" fontSize="7" fill="#1e293b">&gt; JOB #404 PRINTED</text>
          <text x="18" y="34" fontFamily="var(--font-mono)" fontSize="7" fill="#2563eb">&gt; CODE: 4040</text>
          <text x="18" y="48" fontFamily="var(--font-mono)" fontSize="7" fill="#dc2626">&gt; NO INK. DOCX READY.</text>
          <text x="18" y="62" fontFamily="var(--font-mono)" fontSize="6" fill="#475569">Status: READY FOR USER</text>
        </g>

        {/* Control Panel (Right Side) */}
        <rect x="168" y="18" width="38" height="114" rx="4" fill="#cbd5e1" stroke="var(--color-lab-ink)" strokeWidth="3.5" />

        {/* Status Indicator LEDs */}
        {/* POWER LED (Green) */}
        <circle cx="187" cy="34" r="5" fill="#22c55e" className="led" stroke="var(--color-lab-ink)" strokeWidth="2" />
        <text x="187" y="46" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="5" fontWeight="bold" fill="var(--color-lab-ink)">PWR</text>

        {/* ONLINE LED (Cyan/Blue) */}
        <circle cx="187" cy="58" r="5" fill="#38bdf8" stroke="var(--color-lab-ink)" strokeWidth="2" />
        <text x="187" y="70" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="5" fontWeight="bold" fill="var(--color-lab-ink)">ONL</text>

        {/* JAM / ERROR LED (Red) */}
        <circle cx="187" cy="82" r="5" fill="#ef4444" opacity="0.3" stroke="var(--color-lab-ink)" strokeWidth="2" />
        <text x="187" y="94" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="5" fontWeight="bold" fill="var(--color-lab-ink)">JAM</text>

        {/* Physical Buttons */}
        <rect x="174" y="102" width="26" height="12" rx="2" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="2" />

        {/* Side Platen Roller Knob */}
        <rect x="220" y="40" width="14" height="40" rx="3" fill="#64748b" stroke="var(--color-lab-ink)" strokeWidth="3" />

        {/* Printer Model Label */}
        <rect x="35" y="130" width="95" height="14" rx="2" fill="var(--color-lab-yellow)" stroke="var(--color-lab-ink)" strokeWidth="2" />
        <text x="82" y="140" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold" fontSize="7" fill="var(--color-lab-ink)">
          PRINTER 2 (MATRIX)
        </text>
      </g>
    </svg>
  );
}

