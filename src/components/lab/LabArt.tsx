import type { Phase } from "../../systems/types";

/**
 * The illustrated laboratory. Purely decorative: interaction lives in hotspots
 * layered on top of this art in LabScene.
 */
export function LabArt({ phase, boot }: { phase: Phase; boot: boolean }) {
  const chaotic = phase === "chaos" || phase === "panic" || phase === "escape";
  return (
    <svg
      viewBox="0 0 1600 900"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-lab-blue)" />
          <stop offset="100%" stopColor="var(--color-lab-yellow)" />
        </linearGradient>
        <linearGradient id="screenGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-screen)" />
          <stop offset="100%" stopColor="oklch(0.3 0.05 165)" />
        </linearGradient>
        <linearGradient id="plasticGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-lab-paper)" />
          <stop offset="100%" stopColor="var(--color-muted)" />
        </linearGradient>
        <pattern id="floorTile" width="120" height="70" patternUnits="userSpaceOnUse">
          <rect width="120" height="70" fill="var(--color-floor)" />
          <path d="M0 0 H120 M0 0 V70" stroke="var(--color-lab-ink)" strokeWidth="3" opacity="0.35" />
        </pattern>
        <pattern id="hatchP" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="4" height="10" fill="var(--color-lab-ink)" opacity="0.15" />
        </pattern>
      </defs>

      {/* ---------- room shell ---------- */}
      <rect width="1600" height="900" fill="var(--color-wall)" />
      <rect y="560" width="1600" height="340" fill="url(#floorTile)" />
      <rect y="520" width="1600" height="46" fill="var(--color-wall-deep)" stroke="var(--color-lab-ink)" strokeWidth="4" />
      <rect x="0" y="0" width="1600" height="900" fill="none" stroke="var(--color-lab-ink)" strokeWidth="8" />

      {/* tube light */}
      <g className="tube-light">
        <rect x="560" y="20" width="420" height="26" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="5" />
        <rect x="600" y="46" width="340" height="14" fill="var(--color-lab-yellow)" opacity="0.55" />
      </g>

      {/* ceiling fan */}
      <g transform="translate(300 40)">
        <rect x="-5" y="0" width="10" height="34" fill="var(--color-lab-ink)" />
        <g className="fan">
          <ellipse cx="0" cy="36" rx="120" ry="10" fill="var(--color-lab-ink)" opacity="0.25" />
          <ellipse cx="0" cy="36" rx="10" ry="110" fill="var(--color-lab-ink)" opacity="0.18" />
        </g>
        <circle cx="0" cy="36" r="12" fill="var(--color-lab-ink)" />
      </g>

      {/* ---------- window ---------- */}
      <g transform="translate(384 90)">
        <rect x="-14" y="-14" width="380" height="270" fill="var(--color-lab-ink)" />
        <rect x="0" y="0" width="352" height="242" fill="url(#skyGrad)" />
        <circle cx="270" cy="60" r="34" fill="var(--color-lab-paper)" opacity="0.9" />
        <path d="M0 180 L80 120 L150 180 L230 105 L352 190 L352 242 L0 242 Z" fill="var(--color-lab-green)" opacity="0.75" />
        <rect x="40" y="150" width="46" height="92" fill="var(--color-desk-dark)" />
        <rect x="200" y="130" width="60" height="112" fill="var(--color-desk-dark)" />
        <path d="M176 0 V242 M0 121 H352" stroke="var(--color-lab-ink)" strokeWidth="10" />
        <rect x="0" y="0" width="352" height="242" fill="none" stroke="var(--color-lab-ink)" strokeWidth="10" />
      </g>

      {/* ---------- notice board ---------- */}
      <g transform="translate(64 108)">
        <rect x="0" y="0" width="272" height="216" fill="var(--color-desk)" stroke="var(--color-lab-ink)" strokeWidth="8" />
        <rect x="16" y="18" width="108" height="80" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="4" transform="rotate(-3 70 58)" />
        <rect x="146" y="26" width="106" height="72" fill="var(--color-lab-yellow)" stroke="var(--color-lab-ink)" strokeWidth="4" transform="rotate(4 199 62)" />
        <rect x="34" y="118" width="120" height="76" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="4" transform="rotate(2 94 156)" />
        <rect x="168" y="120" width="82" height="76" fill="var(--color-lab-red)" stroke="var(--color-lab-ink)" strokeWidth="4" transform="rotate(-5 209 158)" />
        {[
          [40, 30],
          [190, 36],
          [58, 128],
          [188, 130],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="6" fill="var(--color-lab-red)" stroke="var(--color-lab-ink)" strokeWidth="3" />
        ))}
      </g>

      {/* ---------- whiteboard ---------- */}
      <g transform="translate(960 88)">
        <rect x="0" y="0" width="384" height="200" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="8" />
        <path d="M28 48 H210 M28 82 H160 M28 116 H240" stroke="var(--color-lab-ink)" strokeWidth="6" opacity="0.6" strokeLinecap="round" />
        <path d="M262 60 l40 40 l-40 40" stroke="var(--color-lab-blue)" strokeWidth="8" fill="none" strokeLinecap="round" />
        <text x="300" y="176" fontFamily="monospace" fontSize="22" fill="var(--color-lab-red)" opacity="0.75">
          4040
        </text>
        <rect x="0" y="200" width="384" height="18" fill="var(--color-desk-dark)" stroke="var(--color-lab-ink)" strokeWidth="6" />
        <rect x="300" y="192" width="46" height="12" fill="var(--color-lab-blue)" stroke="var(--color-lab-ink)" strokeWidth="4" />
      </g>

      {/* ---------- clock ---------- */}
      <g transform="translate(1432 118)">
        <circle r="66" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="8" />
        <circle r="52" fill="none" stroke="var(--color-lab-ink)" strokeWidth="3" opacity="0.3" />
        <path d="M0 0 V-40" stroke="var(--color-lab-ink)" strokeWidth="7" strokeLinecap="round" />
        <path d="M0 0 L30 16" stroke="var(--color-lab-red)" strokeWidth="6" strokeLinecap="round" />
        <circle r="7" fill="var(--color-lab-ink)" />
      </g>

      {/* ---------- long desk ---------- */}
      <rect x="120" y="596" width="1360" height="34" fill="var(--color-desk)" stroke="var(--color-lab-ink)" strokeWidth="7" />
      <rect x="150" y="630" width="26" height="180" fill="var(--color-desk-dark)" stroke="var(--color-lab-ink)" strokeWidth="6" />
      <rect x="1420" y="630" width="26" height="180" fill="var(--color-desk-dark)" stroke="var(--color-lab-ink)" strokeWidth="6" />
      <rect x="700" y="630" width="26" height="180" fill="var(--color-desk-dark)" stroke="var(--color-lab-ink)" strokeWidth="6" />

      {/* sticky notes + clutter on desk left */}
      <g transform="translate(330 540)">
        <rect x="0" y="0" width="70" height="60" fill="var(--color-lab-yellow)" stroke="var(--color-lab-ink)" strokeWidth="4" transform="rotate(-6 35 30)" />
        <rect x="60" y="16" width="60" height="52" fill="var(--color-lab-green)" stroke="var(--color-lab-ink)" strokeWidth="4" transform="rotate(5 90 42)" />
        <rect x="-46" y="24" width="54" height="46" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="4" transform="rotate(9 -19 47)" />
      </g>
      {/* water bottle */}
      <g transform="translate(268 486)">
        <rect x="0" y="0" width="42" height="112" rx="6" fill="var(--color-lab-blue)" stroke="var(--color-lab-ink)" strokeWidth="5" />
        <rect x="10" y="-18" width="22" height="20" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="5" />
      </g>
      {/* coffee cup */}
      <g transform="translate(1044 546)">
        <path d="M0 0 h64 l-8 52 h-48 Z" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="5" />
        <rect x="-2" y="-12" width="68" height="14" fill="var(--color-lab-red)" stroke="var(--color-lab-ink)" strokeWidth="5" />
      </g>

      {/* ---------- monitor / computer ---------- */}
      <g transform="translate(616 336)">
        {/* stand + base with contact shadow */}
        <ellipse cx="186" cy="286" rx="150" ry="16" fill="var(--color-lab-ink)" opacity="0.18" />
        <rect x="126" y="252" width="120" height="26" rx="6" fill="url(#plasticGrad)" stroke="var(--color-lab-ink)" strokeWidth="6" />
        <rect x="150" y="216" width="72" height="44" fill="url(#plasticGrad)" stroke="var(--color-lab-ink)" strokeWidth="6" />
        {/* bezel */}
        <rect x="0" y="0" width="372" height="230" rx="14" fill="url(#plasticGrad)" stroke="var(--color-lab-ink)" strokeWidth="9" />
        <rect x="14" y="12" width="344" height="188" rx="8" fill="var(--color-lab-ink)" opacity="0.85" />
        <rect x="26" y="24" width="320" height="164" fill="url(#screenGrad)" stroke="var(--color-lab-ink)" strokeWidth="6" />
        {boot ? (
          <g fontFamily="monospace" fontSize="15" fill="var(--color-screen-glow)">
            <text x="42" y="58">C:\LAB&gt; run lab_escape</text>
            <text x="42" y="84">loading environment...</text>
            <text x="42" y="110">motivation: NOT FOUND</text>
          </g>
        ) : (
          <g>
            <rect x="46" y="44" width="120" height="18" fill="var(--color-screen-glow)" opacity="0.85" />
            <rect x="46" y="74" width="200" height="10" fill="var(--color-screen-glow)" opacity="0.5" />
            <rect x="46" y="92" width="160" height="10" fill="var(--color-screen-glow)" opacity="0.35" />
            <rect x="46" y="124" width="86" height="42" fill="var(--color-lab-yellow)" stroke="var(--color-lab-ink)" strokeWidth="4" />
          </g>
        )}
        {/* screen sheen */}
        <path d="M26 24 L150 24 L52 188 L26 188 Z" fill="var(--color-lab-paper)" opacity="0.07" />
        <circle cx="340" cy="208" r="7" fill={chaotic ? "var(--color-lab-red)" : "var(--color-lab-green)"} className="led" />
        {/* the single dead pixel */}
        <rect x="332" y="180" width="3" height="3" fill="var(--color-lab-ink)" />
      </g>
      {/* keyboard + mouse */}
      <g transform="translate(566 592)">
        <ellipse cx="200" cy="112" rx="230" ry="14" fill="var(--color-lab-ink)" opacity="0.16" />
        {/* body */}
        <rect x="0" y="0" width="392" height="116" rx="10" fill="url(#plasticGrad)" stroke="var(--color-lab-ink)" strokeWidth="6" />
        <rect x="10" y="8" width="372" height="100" rx="6" fill="var(--color-lab-ink)" opacity="0.12" />
        {/* function row */}
        {Array.from({ length: 13 }).map((_, i) => (
          <rect key={`f${i}`} x={18 + i * 28} y={14} width="20" height="12" rx="2" fill="var(--color-muted)" stroke="var(--color-lab-ink)" strokeWidth="2.5" />
        ))}
        {/* number row */}
        {Array.from({ length: 13 }).map((_, i) => (
          <rect key={`n${i}`} x={18 + i * 28} y={30} width="22" height="16" rx="3" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="2.5" />
        ))}
        {/* qwerty row */}
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={`q${i}`} x={26 + i * 28} y={50} width="22" height="16" rx="3" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="2.5" />
        ))}
        {/* home row */}
        {Array.from({ length: 11 }).map((_, i) => (
          <rect key={`h${i}`} x={34 + i * 28} y={70} width="22" height="14" rx="3" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="2.5" />
        ))}
        {/* modifiers + spacebar */}
        <rect x="18" y="70" width="14" height="14" rx="3" fill="var(--color-muted)" stroke="var(--color-lab-ink)" strokeWidth="2.5" />
        <rect x="344" y="70" width="30" height="14" rx="3" fill="var(--color-muted)" stroke="var(--color-lab-ink)" strokeWidth="2.5" />
        {/* spacebar row */}
        <rect x="18" y="90" width="34" height="14" rx="3" fill="var(--color-muted)" stroke="var(--color-lab-ink)" strokeWidth="2.5" />
        <rect x="56" y="90" width="26" height="14" rx="3" fill="var(--color-muted)" stroke="var(--color-lab-ink)" strokeWidth="2.5" />
        <rect x="86" y="90" width="200" height="14" rx="4" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="2.5" />
        <rect x="290" y="90" width="26" height="14" rx="3" fill="var(--color-muted)" stroke="var(--color-lab-ink)" strokeWidth="2.5" />
        <rect x="320" y="90" width="54" height="14" rx="3" fill="var(--color-muted)" stroke="var(--color-lab-ink)" strokeWidth="2.5" />
        {/* status LEDs */}
        <circle cx="360" cy="20" r="4" fill="var(--color-lab-green)" className="led" />
        <circle cx="374" cy="20" r="4" fill="var(--color-lab-yellow)" opacity="0.7" />
        {/* mouse */}
        <g transform="translate(416 14)">
          <ellipse cx="30" cy="88" rx="34" ry="10" fill="var(--color-lab-ink)" opacity="0.16" />
          <rect width="60" height="86" rx="28" fill="url(#plasticGrad)" stroke="var(--color-lab-ink)" strokeWidth="6" />
          <path d="M30 6 V36" stroke="var(--color-lab-ink)" strokeWidth="5" />
          <rect x="25" y="16" width="10" height="16" rx="5" fill="var(--color-lab-ink)" opacity="0.6" />
        </g>
      </g>

      {/* cpu tower */}
      <g transform="translate(1120 452)">
        <rect width="120" height="212" fill="var(--color-muted)" stroke="var(--color-lab-ink)" strokeWidth="7" />
        <rect x="18" y="20" width="84" height="18" fill="var(--color-lab-ink)" opacity="0.5" />
        <rect x="18" y="48" width="84" height="12" fill="var(--color-lab-ink)" opacity="0.3" />
        <circle cx="60" cy="130" r="34" fill="none" stroke="var(--color-lab-ink)" strokeWidth="5" />
        <g transform="translate(60 130)">
          <g className="fan">
            <path d="M0 -26 L10 0 L0 26 L-10 0 Z" fill="var(--color-lab-ink)" opacity="0.6" />
            <path d="M-26 0 L0 -10 L26 0 L0 10 Z" fill="var(--color-lab-ink)" opacity="0.6" />
          </g>
        </g>
        <circle cx="30" cy="186" r="6" fill="var(--color-lab-green)" className="led" />
        <circle cx="52" cy="186" r="6" fill="var(--color-lab-yellow)" />
      </g>

      {/* ---------- drawer unit ---------- */}
      <g transform="translate(1152 604)">
        <rect width="220" height="216" fill="var(--color-desk)" stroke="var(--color-lab-ink)" strokeWidth="7" />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(0 ${i * 70})`}>
            <rect x="10" y="14" width="200" height="56" fill="var(--color-desk-dark)" stroke="var(--color-lab-ink)" strokeWidth="5" />
            <rect x="84" y="36" width="52" height="12" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="4" />
          </g>
        ))}
      </g>

      {/* ---------- printer ---------- */}
      <g transform="translate(1372 470)">
        <rect y="40" width="196" height="120" fill="var(--color-muted)" stroke="var(--color-lab-ink)" strokeWidth="7" />
        <rect x="30" y="-6" width="130" height="52" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="6" />
        <rect x="44" y="-30" width="102" height="34" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="5" transform="rotate(-4 95 -13)" />
        <rect x="26" y="104" width="144" height="18" fill="var(--color-lab-ink)" opacity="0.6" />
        <circle cx="164" cy="70" r="7" fill="var(--color-lab-red)" className="led" />
      </g>

      {/* ---------- trash bin ---------- */}
      <g transform="translate(96 672)">
        <path d="M0 0 h132 l-16 176 h-100 Z" fill="var(--color-muted)" stroke="var(--color-lab-ink)" strokeWidth="7" />
        <rect x="-10" y="-22" width="152" height="26" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="6" />
        <path d="M28 20 V150 M66 20 V156 M104 20 V150" stroke="var(--color-lab-ink)" strokeWidth="4" opacity="0.4" />
        <circle cx="40" cy="-30" r="18" fill="var(--color-lab-paper)" stroke="var(--color-lab-ink)" strokeWidth="5" />
        <circle cx="96" cy="-36" r="14" fill="var(--color-lab-yellow)" stroke="var(--color-lab-ink)" strokeWidth="5" />
      </g>

      {/* ---------- backpack ---------- */}
      <g transform="translate(742 700)">
        <path d="M0 40 q90 -80 180 0 v130 h-180 Z" fill="var(--color-lab-red)" stroke="var(--color-lab-ink)" strokeWidth="7" />
        <rect x="26" y="112" width="128" height="44" fill="var(--color-lab-ink)" opacity="0.25" />
        <path d="M14 66 q76 -46 152 0" stroke="var(--color-lab-ink)" strokeWidth="6" fill="none" />
        <rect x="76" y="4" width="28" height="26" fill="var(--color-lab-yellow)" stroke="var(--color-lab-ink)" strokeWidth="5" />
      </g>

      {/* ---------- phone on desk ---------- */}
      <g transform="translate(1008 622)">
        <rect width="62" height="106" rx="8" fill="var(--color-lab-ink)" />
        <rect x="5" y="7" width="52" height="92" rx="4" fill="var(--color-lab-blue)" opacity="0.85" />
        <circle cx="31" cy="103" r="0" />
        <rect x="16" y="18" width="32" height="6" fill="var(--color-lab-paper)" opacity="0.7" />
        <rect x="16" y="32" width="24" height="6" fill="var(--color-lab-paper)" opacity="0.5" />
      </g>

      {/* cables */}
      <path
        d="M1180 664 q-40 90 -160 96 q-140 6 -230 -30"
        stroke="var(--color-lab-ink)"
        strokeWidth="7"
        fill="none"
        opacity="0.7"
      />
      <path d="M760 664 q30 70 -60 110" stroke="var(--color-lab-ink)" strokeWidth="6" fill="none" opacity="0.5" />

      {/* chair */}
      <g transform="translate(430 690)">
        <rect x="20" y="0" width="140" height="26" fill="var(--color-lab-ink)" opacity="0.8" />
        <rect x="80" y="26" width="18" height="90" fill="var(--color-lab-ink)" opacity="0.6" />
        <path d="M30 132 h120" stroke="var(--color-lab-ink)" strokeWidth="10" />
      </g>

      {/* wall stickers */}
      <g transform="translate(1276 330)" opacity="0.9">
        <path d="M0 0 l70 0 l-35 62 Z" fill="var(--color-lab-yellow)" stroke="var(--color-lab-ink)" strokeWidth="5" />
        <text x="30" y="48" fontFamily="monospace" fontSize="26" fill="var(--color-lab-ink)">
          !
        </text>
      </g>
      <rect x="76" y="392" width="150" height="96" fill="url(#hatchP)" stroke="var(--color-lab-ink)" strokeWidth="5" />
      <text x="90" y="446" fontFamily="monospace" fontSize="20" fill="var(--color-lab-ink)">
        LAB 404
      </text>
    </svg>
  );
}
