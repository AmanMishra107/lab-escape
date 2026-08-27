import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

const W = 420;
const H = 640;
const COLS = 4;
const TILE_W = W / COLS;
const TILE_H = 140;

// Alan Walker - Faded Melody (Notes in Hz and durations)
// Key: Eb Minor / D# Minor
interface MelodyNote {
  f: number;      // Frequency in Hz
  chord?: number[];// Harmony/Bass notes
  name: string;
}

const N = {
  C3: 130.81, D3: 146.83, DS3: 155.56, F3: 174.61, FS3: 185.00, G3: 196.00, GS3: 207.65, A3: 220.00, AS3: 233.08, B3: 246.94,
  C4: 261.63, CS4: 277.18, D4: 293.66, DS4: 311.13, E4: 329.63, F4: 349.23, FS4: 369.99, G4: 392.00, GS4: 415.30, A4: 440.00, AS4: 466.16, B4: 493.88,
  C5: 523.25, CS5: 554.37, D5: 587.33, DS5: 622.25, E5: 659.25, F5: 698.46, FS5: 739.99, G5: 783.99, GS5: 830.61, AS5: 932.33,
};

// Full Alan Walker - Faded Lead Melody Sheet
const FADED_MELODY: MelodyNote[] = [
  // --- INTRO CHORD ARPEGGIO ---
  { f: N.DS4, chord: [N.DS3, N.AS3], name: "D#4" },
  { f: N.AS4, name: "A#4" },
  { f: N.GS4, chord: [N.B3, N.FS3], name: "G#4" },
  { f: N.FS4, name: "F#4" },
  { f: N.DS4, chord: [N.FS3, N.CS4], name: "D#4" },
  { f: N.FS4, name: "F#4" },
  { f: N.GS4, chord: [N.CS4, N.GS3], name: "G#4" },
  { f: N.AS4, name: "A#4" },

  { f: N.DS4, chord: [N.DS3, N.AS3], name: "D#4" },
  { f: N.AS4, name: "A#4" },
  { f: N.GS4, chord: [N.B3, N.FS3], name: "G#4" },
  { f: N.FS4, name: "F#4" },
  { f: N.F4, chord: [N.FS3, N.CS4], name: "F4" },
  { f: N.CS4, name: "C#4" },
  { f: N.DS4, chord: [N.CS4, N.GS3], name: "D#4" },
  { f: N.FS4, name: "F#4" },

  // --- VERSE: "You were the shadow to my light..." ---
  { f: N.FS4, chord: [N.DS3], name: "F#4" },
  { f: N.GS4, name: "G#4" },
  { f: N.AS4, chord: [N.AS3], name: "A#4" },
  { f: N.AS4, name: "A#4" },
  { f: N.AS4, name: "A#4" },
  { f: N.AS4, chord: [N.B3], name: "A#4" },
  { f: N.GS4, name: "G#4" },
  { f: N.FS4, name: "F#4" },
  { f: N.GS4, chord: [N.CS4], name: "G#4" },

  // "Did you feel us? Another start..."
  { f: N.FS4, chord: [N.DS3], name: "F#4" },
  { f: N.GS4, name: "G#4" },
  { f: N.AS4, chord: [N.AS3], name: "A#4" },
  { f: N.AS4, name: "A#4" },
  { f: N.AS4, name: "A#4" },
  { f: N.CS5, chord: [N.B3], name: "C#5" },
  { f: N.AS4, name: "A#4" },
  { f: N.GS4, name: "G#4" },
  { f: N.FS4, chord: [N.CS4], name: "F#4" },
  { f: N.FS4, name: "F#4" },

  // "You fade away, afraid our aim is out of sight..."
  { f: N.FS4, chord: [N.DS3], name: "F#4" },
  { f: N.GS4, name: "G#4" },
  { f: N.AS4, chord: [N.AS3], name: "A#4" },
  { f: N.AS4, name: "A#4" },
  { f: N.AS4, name: "A#4" },
  { f: N.AS4, chord: [N.B3], name: "A#4" },
  { f: N.GS4, name: "G#4" },
  { f: N.FS4, name: "F#4" },
  { f: N.GS4, chord: [N.CS4], name: "G#4" },
  { f: N.F4, name: "F4" },
  { f: N.DS4, chord: [N.DS3], name: "D#4" },

  // --- PRE-CHORUS: "Where are you now? Where are you now?" ---
  { f: N.FS4, chord: [N.DS3, N.AS3], name: "Where" },
  { f: N.FS4, name: "are" },
  { f: N.FS4, name: "you" },
  { f: N.GS4, name: "now" },
  { f: N.AS4, chord: [N.B3, N.FS3], name: "Where" },
  { f: N.FS4, name: "are" },
  { f: N.FS4, name: "you" },
  { f: N.FS4, name: "now" },
  { f: N.GS4, chord: [N.FS3, N.CS4], name: "Where" },
  { f: N.AS4, name: "are" },
  { f: N.C5, chord: [N.CS4, N.GS3], name: "you" },
  { f: N.CS5, name: "now" },

  // "Was it all in my fantasy?"
  { f: N.CS5, chord: [N.DS3], name: "Was" },
  { f: N.CS5, name: "it" },
  { f: N.CS5, name: "all" },
  { f: N.B4, chord: [N.B3], name: "in" },
  { f: N.AS4, name: "my" },
  { f: N.GS4, chord: [N.FS3], name: "fan-" },
  { f: N.FS4, name: "ta-" },
  { f: N.GS4, chord: [N.CS4], name: "sy" },
  { f: N.AS4, name: "..." },

  // --- CHORUS DROP: "I'm Faded... So lost..." ---
  { f: N.DS5, chord: [N.DS3, N.AS3], name: "D#5" },
  { f: N.DS5, name: "D#5" },
  { f: N.CS5, chord: [N.B3, N.FS3], name: "C#5" },
  { f: N.AS4, name: "A#4" },
  { f: N.GS4, chord: [N.FS3, N.CS4], name: "G#4" },
  { f: N.FS4, name: "F#4" },
  { f: N.GS4, chord: [N.CS4, N.GS3], name: "G#4" },
  { f: N.AS4, name: "A#4" },

  { f: N.DS5, chord: [N.DS3, N.AS3], name: "D#5" },
  { f: N.CS5, name: "C#5" },
  { f: N.AS4, chord: [N.B3, N.FS3], name: "A#4" },
  { f: N.GS4, name: "G#4" },
  { f: N.FS4, chord: [N.FS3, N.CS4], name: "F#4" },
  { f: N.GS4, name: "G#4" },
  { f: N.AS4, chord: [N.CS4, N.GS3], name: "A#4" },
  { f: N.GS4, name: "G#4" },
  { f: N.FS4, chord: [N.DS3], name: "F#4" },
  { f: N.DS4, name: "D#4" },

  // --- CLIMAX RUN ---
  { f: N.DS5, chord: [N.DS3, N.AS3], name: "D#5" },
  { f: N.F5, name: "F5" },
  { f: N.FS5, chord: [N.B3, N.FS3], name: "F#5" },
  { f: N.F5, name: "F5" },
  { f: N.DS5, chord: [N.FS3, N.CS4], name: "D#5" },
  { f: N.CS5, name: "C#5" },
  { f: N.AS4, chord: [N.CS4, N.GS3], name: "A#4" },
  { f: N.GS4, name: "G#4" },
  { f: N.FS4, chord: [N.DS3], name: "F#4" },
  { f: N.GS4, name: "G#4" },
  { f: N.AS4, chord: [N.AS3], name: "A#4" },
  { f: N.DS4, chord: [N.DS3, N.AS3], name: "I'm Faded" },
];

interface Tile {
  id: number;
  col: number;
  y: number;
  hit: boolean;
  noteIndex: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface FloatingNote {
  x: number;
  y: number;
  text: string;
  opacity: number;
}

type GamePhase = "idle" | "running" | "over" | "victory";

class PianoSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.45;
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  playNote(freq: number, chordFreqs?: number[]) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const playTone = (f: number, vol: number, dur: number, isBass = false) => {
      if (!this.ctx || !this.masterGain) return;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc1.type = isBass ? "triangle" : "sine";
      osc2.type = isBass ? "sine" : "triangle";
      osc1.frequency.setValueAtTime(f, now);
      osc2.frequency.setValueAtTime(f * 1.002, now); // subtle chorusing

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(f * 4.5, now);
      filter.frequency.exponentialRampToValueAtTime(f * 1.2, now + dur);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.008); // crisp hammer strike
      gain.gain.exponentialRampToValueAtTime(vol * 0.4, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + dur + 0.05);
      osc2.stop(now + dur + 0.05);
    };

    // Play Main Melody Note
    playTone(freq, 0.4, 0.85);

    // Play Accompanying Harmony/Bass Chords if present
    if (chordFreqs && chordFreqs.length > 0) {
      chordFreqs.forEach((cf) => playTone(cf, 0.2, 1.2, true));
    }
  }

  playMissChord() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    [185.00, 196.00, 261.63].forEach((f) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(f, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.45);
    });
  }
}

const synth = new PianoSynth();

export default function PianoTiles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [currentSongTitle] = useState("Piano Sonata — Moonlight & Echoes");
  const phaseRef = useRef<GamePhase>("idle");

  const st = useRef({
    tiles: [] as Tile[],
    nextTileId: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    speed: 4.2,
    nextNoteIndex: 0,
    lastSpawnY: H - TILE_H,
    missedCol: -1,
    missedY: -1,
    particles: [] as Particle[],
    floatingNotes: [] as FloatingNote[],
    flashCols: [0, 0, 0, 0],
    perfectCount: 0,
    songProgress: 0,
  });

  const setPhaseSync = (p: GamePhase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const spawnNextTile = () => {
    const s = st.current;
    if (s.nextNoteIndex >= FADED_MELODY.length) {
      // Loop or victory check
      return;
    }
    const col = Math.floor(Math.random() * COLS);
    const tileY = s.lastSpawnY - TILE_H;
    s.tiles.push({
      id: s.nextTileId++,
      col,
      y: tileY,
      hit: false,
      noteIndex: s.nextNoteIndex,
    });
    s.nextNoteIndex++;
    s.lastSpawnY = tileY;
  };

  const reset = useCallback(() => {
    const s = st.current;
    s.tiles = [];
    s.nextTileId = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.speed = 4.2;
    s.nextNoteIndex = 0;
    s.lastSpawnY = H - TILE_H * 0.8;
    s.missedCol = -1;
    s.missedY = -1;
    s.particles = [];
    s.floatingNotes = [];
    s.flashCols = [0, 0, 0, 0];
    s.perfectCount = 0;
    s.songProgress = 0;

    // Seed first 7 tiles
    for (let i = 0; i < 7; i++) {
      spawnNextTile();
    }

    setScore(0);
    setCombo(0);
    setPhaseSync("running");
  }, []);

  const triggerParticles = (x: number, y: number, color: string) => {
    const s = st.current;
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      s.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 4,
        life: 25 + Math.random() * 15,
        maxLife: 40,
      });
    }
  };

  const handleTilePress = useCallback((colIndex: number, clickY?: number) => {
    if (phaseRef.current !== "running") return;
    const s = st.current;

    // Find the lowest active unhit tile in the game
    const unhitTiles = s.tiles.filter((t) => !t.hit).sort((a, b) => b.y - a.y);
    if (unhitTiles.length === 0) return;

    const lowestTile = unhitTiles[0]!;

    // Check if the user pressed the correct column of the lowest tile
    if (lowestTile.col === colIndex) {
      // Perfect/Hit range
      lowestTile.hit = true;
      s.score++;
      s.combo++;
      s.maxCombo = Math.max(s.maxCombo, s.combo);
      s.flashCols[colIndex] = 1.0;

      // Speed progression
      s.speed = Math.min(10.5, 4.2 + (s.score / FADED_MELODY.length) * 5.0);

      // Play the Alan Walker - Faded note!
      const note = FADED_MELODY[lowestTile.noteIndex % FADED_MELODY.length]!;
      synth.playNote(note.f, note.chord);

      const tileCenterX = colIndex * TILE_W + TILE_W / 2;
      const tileCenterY = lowestTile.y + TILE_H / 2;

      // Visual note feedback
      s.floatingNotes.push({
        x: tileCenterX,
        y: tileCenterY,
        text: note.name,
        opacity: 1.0,
      });

      triggerParticles(tileCenterX, tileCenterY, "#38bdf8");

      setScore(s.score);
      setCombo(s.combo);
      store.reduceBoredom(0.6);

      // Victory Condition check (Completed full song)
      if (s.score >= FADED_MELODY.length) {
        setPhaseSync("victory");
        store.saveGameResult({
          gameId: "pianotiles",
          score: s.score,
          completed: true,
          won: true,
          xpEarned: s.score * 3 + 100,
        });
        sound.play("success");
      }
    } else {
      // Wrong column clicked! Red miss!
      s.missedCol = colIndex;
      s.missedY = clickY ?? H - 80;
      synth.playMissChord();
      sound.play("error");
      setPhaseSync("over");
      store.saveGameResult({
        gameId: "pianotiles",
        score: s.score,
        completed: true,
        won: s.score > 25,
        xpEarned: s.score * 2,
      });
    }
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phaseRef.current !== "running") return;
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const col = Math.floor(x / TILE_W);
    if (col >= 0 && col < COLS) {
      handleTilePress(col, y);
    }
  };

  const handleCanvasTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (phaseRef.current !== "running") return;
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    Array.from(e.changedTouches).forEach((touch) => {
      const x = ((touch.clientX - rect.left) / rect.width) * W;
      const y = ((touch.clientY - rect.top) / rect.height) * H;
      const col = Math.floor(x / TILE_W);
      if (col >= 0 && col < COLS) {
        handleTilePress(col, y);
      }
    });
  };

  // Keyboard controls: D, F, J, K or 1, 2, 3, 4
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phaseRef.current !== "running") return;
      const map: Record<string, number> = {
        KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3,
        Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3,
        ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3,
      };
      if (e.code in map) {
        e.preventDefault();
        handleTilePress(map[e.code]!);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleTilePress]);

  // Main Canvas Render & Game Loop
  useEffect(() => {
    if (phase !== "running") return;
    let raf = 0;

    const loop = () => {
      if (phaseRef.current !== "running") return;
      const cv = canvasRef.current;
      const ctx = cv?.getContext("2d");
      if (!cv || !ctx) {
        raf = requestAnimationFrame(loop);
        return;
      }
      const s = st.current;

      // ── Step Physics ──
      for (const t of s.tiles) {
        t.y += s.speed;
      }
      s.lastSpawnY += s.speed;

      // Spawn next tile when top has space
      if (s.lastSpawnY > -TILE_H) {
        spawnNextTile();
      }

      // Check if unhit tile reached the bottom -> MISS!
      let missedTile: Tile | null = null;
      for (const t of s.tiles) {
        if (!t.hit && t.y > H) {
          missedTile = t;
          break;
        }
      }

      if (missedTile) {
        s.missedCol = missedTile.col;
        s.missedY = missedTile.y;
        synth.playMissChord();
        sound.play("error");
        setPhaseSync("over");
        store.saveGameResult({
          gameId: "pianotiles",
          score: s.score,
          completed: true,
          won: s.score > 25,
          xpEarned: s.score * 2,
        });
        return;
      }

      // Filter off-screen hit tiles
      s.tiles = s.tiles.filter((t) => t.y < H + TILE_H);

      // Particle physics
      for (const p of s.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
      }
      s.particles = s.particles.filter((p) => p.life > 0);

      // Floating note labels
      for (const fn of s.floatingNotes) {
        fn.y -= 1.5;
        fn.opacity -= 0.035;
      }
      s.floatingNotes = s.floatingNotes.filter((fn) => fn.opacity > 0);

      // Flash decay
      for (let c = 0; c < COLS; c++) {
        if (s.flashCols[c]! > 0) s.flashCols[c] = Math.max(0, s.flashCols[c]! - 0.08);
      }

      // ── Draw ──
      // Background: Deep Cyber Midnight Glass
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, W, H);

      // Grid columns background & flash
      for (let c = 0; c < COLS; c++) {
        const cx = c * TILE_W;
        if (s.flashCols[c]! > 0) {
          ctx.fillStyle = `rgba(56, 189, 248, ${s.flashCols[c]! * 0.25})`;
          ctx.fillRect(cx, 0, TILE_W, H);
        }
        // Column divider line
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, H);
        ctx.stroke();
      }

      // Bottom hit line indicator
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(0, H - 70);
      ctx.lineTo(W, H - 70);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Key Guides at bottom (D F J K)
      const keys = ["D", "F", "J", "K"];
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      for (let c = 0; c < COLS; c++) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.fillText(keys[c]!, c * TILE_W + TILE_W / 2, H - 20);
      }

      // Render Tiles
      for (const t of s.tiles) {
        const tx = t.col * TILE_W + 3;
        const ty = t.y + 2;
        const tw = TILE_W - 6;
        const th = TILE_H - 4;

        if (t.hit) {
          // Hit tile: Glowing cyan/gold echo
          ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
          ctx.beginPath();
          ctx.roundRect(tx, ty, tw, th, 8);
          ctx.fill();
          ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          // Black Piano Tile with rich sleek gradient & bevel
          const tileGrad = ctx.createLinearGradient(tx, ty, tx, ty + th);
          tileGrad.addColorStop(0, "#1e293b");
          tileGrad.addColorStop(0.5, "#0f172a");
          tileGrad.addColorStop(1, "#020617");

          ctx.fillStyle = tileGrad;
          ctx.beginPath();
          ctx.roundRect(tx, ty, tw, th, 8);
          ctx.fill();

          // Border & Gloss sheen
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 2;
          ctx.stroke();

          // Top highlight line
          ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
          ctx.fillRect(tx + 6, ty + 6, tw - 12, 4);

          // Note indicator
          const noteInfo = FADED_MELODY[t.noteIndex % FADED_MELODY.length];
          if (noteInfo) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.font = "bold 11px monospace";
            ctx.fillText(noteInfo.name, tx + tw / 2, ty + th / 2 + 4);
          }
        }
      }

      // Red Miss Highlight if died
      if (s.missedCol >= 0) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.6)";
        ctx.fillRect(s.missedCol * TILE_W, 0, TILE_W, H);
      }

      // Render Floating Note Names
      for (const fn of s.floatingNotes) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, fn.opacity);
        ctx.fillStyle = "#38bdf8";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 12;
        ctx.font = "bold 16px monospace";
        ctx.fillText(`🎵 ${fn.text}`, fn.x, fn.y);
        ctx.restore();
      }

      // Render Burst Particles
      for (const p of s.particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Top Song Progress Bar
      const progress = Math.min(1.0, s.score / FADED_MELODY.length);
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.fillRect(0, 0, W, 5);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(0, 0, W * progress, 5);

      // Score Header HUD
      ctx.font = "bold 32px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(`${s.score}`, W / 2, 45);

      ctx.font = "bold 11px monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillText(`🎶 ${currentSongTitle}`, W / 2, 65);

      // Combo Display
      if (s.combo >= 4) {
        ctx.save();
        ctx.font = `900 ${14 + Math.min(s.combo, 12)}px monospace`;
        ctx.fillStyle = "#facc15";
        ctx.shadowColor = "#facc15";
        ctx.shadowBlur = 10;
        ctx.fillText(`🔥 ${s.combo}x COMBO`, W / 2, 90);
        ctx.restore();
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, currentSongTitle]);

  return (
    <GameShell
      id="pianotiles"
      status={
        <>
          <Tag tone="blue">SCORE {score}/{FADED_MELODY.length}</Tag>
          {combo >= 4 && <Tag tone="yellow">🔥 {combo}x</Tag>}
        </>
      }
      toolbar={
        phase !== "idle" ? (
          <BrutButton onClick={reset} variant="warn">↺ RESTART</BrutButton>
        ) : null
      }
    >
      <div className="relative flex h-full w-full items-center justify-center bg-slate-950 select-none">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="h-full max-h-full cursor-pointer touch-none"
          style={{ maxWidth: "100%", objectFit: "contain" }}
          onClick={handleCanvasClick}
          onTouchStart={handleCanvasTouch}
        />

        {/* Start / Idle Screen */}
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/90 p-6 text-center">
            <span className="text-6xl animate-bounce">🎹</span>
            <h2 className="font-display text-3xl text-sky-400">PIANO TILES</h2>
            <p className="font-mono text-sm font-bold text-amber-300">
              🎧 CLASSIC GRAND PIANO MODE
            </p>
            <div className="border-2 border-slate-700 bg-slate-900/80 p-3 rounded text-xs font-mono text-slate-300 space-y-1.5 max-w-xs">
              <p>⚡ <strong>TAP ONLY BLACK TILES</strong> to play the notes.</p>
              <p>⌨️ Controls: <strong>D, F, J, K</strong> or Click/Tap Columns.</p>
              <p>❌ Miss a tile or tap empty space = <strong>GAME OVER!</strong></p>
            </div>
            <BrutButton onClick={reset} variant="primary" className="text-base px-6 py-2.5">
              ▶ START PLAYING
            </BrutButton>
          </div>
        )}

        {/* Game Over Screen */}
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/95 p-6 text-center">
            <span className="text-5xl">💥</span>
            <h2 className="font-display text-3xl text-rose-500">MISSED NOTE!</h2>
            <div className="font-mono">
              <p className="text-5xl font-bold text-white">{score}</p>
              <p className="text-xs text-slate-400 mt-1">NOTES PLAYED · BEST COMBO {st.current.maxCombo}x</p>
            </div>
            <p className="font-mono text-xs text-amber-300">
              Song Progress: {Math.round((score / FADED_MELODY.length) * 100)}%
            </p>
            <BrutButton onClick={reset} variant="warn" className="text-base px-6 py-2">
              ↺ PLAY AGAIN
            </BrutButton>
          </div>
        )}

        {/* Victory Screen */}
        {phase === "victory" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/95 p-6 text-center animate-fade-in">
            <span className="text-6xl">🏆</span>
            <h2 className="font-display text-3xl text-amber-400">SONG COMPLETED!</h2>
            <p className="font-mono text-sm text-sky-300">
              You played the complete piano melody flawlessly!
            </p>
            <div className="font-mono text-4xl font-bold text-white">
              ⭐ PERFECT CLEAR ({score} Notes)
            </div>
            <BrutButton onClick={reset} variant="primary" className="text-base px-6 py-2.5">
              ↺ REPLAY SONG
            </BrutButton>
          </div>
        )}
      </div>
    </GameShell>
  );
}
