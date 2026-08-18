# LAB ESCAPE — Build Plan

An interactive college-lab boredom simulator: a large illustrated 2D laboratory you explore directly, containing a fake retro OS, a 4-hour survival timer, 10 real mini-games, a terminal, puzzles, achievements and easter eggs. All progress local, no backend.

## Visual direction
Illustrated Editorial World × Neo-Brutalism × Retro/Y2K OS.

- **The lab scene** is a big, colorful, highly detailed 2D illustrated environment — the room itself is the navigation, not a dashboard or menu. Immersive composition in the spirit of scroll/zoom storytelling sites: depth layers, hand-illustrated props, ambient life (blinking LEDs, spinning fan, flickering tube light, rain on the window).
- **The OS and every interface** stays strictly neo-brutalist: thick black borders, hard offset shadows, sharp corners, tactile press states, monospace system text, retro window chrome.
- Palette: off-white #F4F1E8, black #111111, red #FF3B30, yellow #FFD60A, green #32D74B, blue #2997FF. The illustration may use richer tinted shades of these; interfaces stay black/off-white dominant with color for state only.
- Type: Anton (display), Space Grotesk (UI), JetBrains Mono (system/terminal), loaded via `<link>` in the root route.
- Optional CRT overlay (scanlines, vignette, noise), performance mode, reduced-motion respect.

## Interaction model — one continuous world
- Objects (computer, phone, notice board, desk, drawer, printer, clock, window, trash bin, whiteboard, backpack) physically exist in the illustration and respond to hover (lift, outline, cursor change, sound), click, and long-press.
- Opening an object is a **camera move**, never a page navigation: the view zooms/pans to the object and its interface resolves in place. Clicking the computer zooms into the monitor and the retro OS boots inside the screen; the phone opens the messaging app in the held device; the notice board zooms to readable notices; the clock opens timer interaction.
- Backing out reverses the camera. No routes for apps — everything is lazy-loaded components inside the single lab route.
- **LAB MAP / discovery system**: a small in-world map that starts mostly blank and fills in as objects are found. It reveals discovered zones and hints at undiscovered ones — a progression artifact, not a sitemap.

## Build order

**1. Foundation** — design tokens in `src/styles.css`, fonts, brutalist primitives (Button, Window, Panel, Meter, Notification), save system (`labEscape_save_v1`, versioned + corruption-safe), global game state store.

**2. Boot + entry** — cinematic boot log (professor presence, WiFi CRITICAL, motivation NOT FOUND), "WELCOME TO LAB 404 / 03:59:59", ENTER LAB transition into the illustrated scene. Skippable on return visits. Replaces the placeholder index route.

**3. Lab environment** — the illustrated scene, camera/zoom controller, hotspot system, object hover/click states, discovery + LAB MAP, ambient detail. Rearranges intelligently on mobile (tap-to-zoom, pannable scene, no tiny targets).

**4. Core systems** — timer with 5 phases (NORMAL → BOREDOM → CHAOS → PANIC → ESCAPE), boredom meter, XP/levels to 50, 25+ achievements, notification queue, weighted random-event engine with cooldowns, professor event with 3-second PRODUCTIVE MODE.
  - **Time scales**: 4 hours is the canonical user experience. Hidden Demo/Developer scales (30s, 1m, 5m, 30m, accelerated multiplier) selectable only via terminal devmode — never surfaced in normal UI, never affecting default play. Timer persists via an absolute end timestamp so refresh doesn't reset it.

**5. In-monitor OS** — draggable/stacking brutalist windows for Terminal, Games, Phone, Notice Board, Files, Puzzles, Achievements, Inventory, Settings, rendered inside the zoomed monitor. HUD with time / boredom / score / level.

**6. Terminal** — command parser, documented commands (help, status, games, scan, etc.), hidden ones (sudo, konami, matrix, iamroot, 42, professor, coffee), devmode with settime/addxp/unlockall/trigger. Simulated only, no eval.

**7. Game architecture validation** — build three representative games first and prove the whole pipeline (game → result → score → XP → achievement → save → high score) end to end:
  - **Snake** — Canvas + real-time input loop
  - **Minesweeper** — grid/state logic
  - **Reaction Test** — precision timing
  Only once that pipeline is verified do the remaining seven follow: Memory Matrix, Typing Race, Tic Tac Toe (minimax), Aim Trainer, Flappy Lab, Escape Runner, Quick Math. Each is lazy-loaded, error-boundaried, returns `{score, accuracy, time, completed}`, supports keyboard + touch, and pauses on window blur / tab hide.

**8. Content & secrets** — data-driven files for games, achievements, easter eggs (30+), terminal commands, notices, phone messages, random events. Fake file explorer with jokes/clues/locked files, inventory items, 6 lightweight puzzles (password, binary, Caesar, pattern, hidden object, terminal sequence), the escalating DO NOT CLICK button, and the optional emergency-exit early escape with time bonus.

**9. Sound & motion** — Web Audio/Howler SFX + ambience, master/SFX/ambience volumes, no autoplay before interaction. GSAP for boot, camera moves, phase changes, window opening, glitch and escape sequences; CSS for micro-interactions.

**10. Polish** — end-screen report with ranks, settings persistence, custom cursor toggle, accessibility pass (focus, ARIA, keyboard route to every object so the scene isn't mouse-only, contrast), responsive pass across five breakpoints, clean console, no leaked timers/loops.

## Technical notes
- TanStack Start; `/` is the entire experience (boot + lab). Apps, games and windows are lazy-loaded components, not routes.
- Scene built from layered illustrated art with absolutely-positioned hotspots in a normalized coordinate space, so zoom/pan math and responsive scaling stay consistent. Camera is a single transform controller (GSAP) rather than per-object hacks.
- Game logic isolated in `src/games/*` (UI-free, independently testable); systems in `src/systems/*`; content in `src/data/*`.
- Canvas + requestAnimationFrame for Snake, Flappy, Runner, Aim; DOM for grid-based games.
- SEO: title "LAB ESCAPE — Survive the Boring Lab", matching description, OG/Twitter metadata on the index route.

## Scope note
Large build, delivered in the phases above; each phase is functional before the next starts — no placeholder games, no dead buttons.
