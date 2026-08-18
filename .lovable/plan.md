# LAB ESCAPE — Build Plan

An interactive college-lab boredom simulator: a fake retro OS inside a neo-brutalist lab, with a 4-hour survival timer, 10 real mini-games, a terminal, puzzles, achievements and easter eggs. All progress local, no backend.

## Design foundation
- Palette: off-white #F4F1E8, black #111111, red #FF3B30, yellow #FFD60A, green #32D74B, blue #2997FF — black/off-white dominant, colors only for state.
- Type: Anton (display), Space Grotesk (UI), JetBrains Mono (system/terminal), loaded via `<link>` in the root route.
- Hard shadows, sharp corners, thick borders, tactile press states. No glass, no gradients-on-white, no rounded SaaS look.
- Optional CRT overlay (scanlines, vignette, noise), performance mode, reduced-motion respect.

## Build order

**1. Foundation** — design tokens in `src/styles.css`, fonts, brutalist primitives (Button, Window, Panel, Meter, Notification), save system (`labEscape_save_v1`, versioned + corruption-safe), global game state store.

**2. Boot + entry** — cinematic boot log (professor presence, WiFi CRITICAL, motivation NOT FOUND), "WELCOME TO LAB 404 / 03:59:59", ENTER LAB transition. Skippable on return visits. This replaces the placeholder index route.

**3. Lab environment** — viewport-based scene with interactive objects: computer, phone, notice board, desk, drawer, printer, clock, window, trash bin, whiteboard, backpack. Ambient detail (LEDs, fan, sticky notes). Rearranges intelligently on mobile.

**4. Core systems** — timer (configurable, persists across refresh, 5 phases: NORMAL → BOREDOM → CHAOS → PANIC → ESCAPE), boredom meter, XP/levels to 50, 25+ achievements, notification queue, random event engine with cooldowns and weights, professor event with 3-second PRODUCTIVE MODE.

**5. Desktop OS** — draggable/stacking windows for Terminal, Games, Phone, Notice Board, Files, Puzzles, Achievements, Inventory, Settings. HUD with time / boredom / score / level.

**6. Terminal** — command parser, documented commands (help, status, games, scan, etc.), hidden ones (sudo, konami, matrix, iamroot, 42, professor, coffee), devmode with settime/addxp/unlockall/trigger. Simulated only, no eval.

**7. Games** — built and verified one at a time, lazy-loaded, each behind an error boundary, each returning `{score, accuracy, time, completed}` to the XP system: Snake, Reaction, Memory Matrix, Typing Race, Minesweeper, Tic Tac Toe (minimax), Aim Trainer, Flappy Lab, Escape Runner, Quick Math. Keyboard + touch controls; pause on window blur/tab hide; high scores persist.

**8. Content & secrets** — data-driven files for games, achievements, easter eggs (30+), terminal commands, notices, phone messages, random events. Fake file explorer with jokes/clues/locked files, inventory items, 6 lightweight puzzles (password, binary, Caesar, pattern, hidden object, terminal sequence), the escalating DO NOT CLICK button, and the optional emergency-exit early escape with time bonus.

**9. Sound & motion** — Web Audio/Howler SFX + ambience, master/SFX/ambience volumes, no autoplay before interaction. GSAP for boot, phase changes, window opening, glitch and escape sequences; CSS for micro-interactions.

**10. Polish** — end-screen report with ranks, settings persistence, custom cursor toggle, accessibility pass (focus, ARIA, contrast, keyboard), responsive pass across five breakpoints, clean console, no leaked timers/loops.

## Technical notes
- TanStack Start with file-based routes; `/` is the boot + lab experience. Games and windows are lazy-loaded components, not separate routes.
- Game logic lives in isolated modules under `src/games/*`, UI-free, so each is independently testable. Systems under `src/systems/*`, content under `src/data/*`.
- Canvas + requestAnimationFrame for Snake, Flappy, Runner, Aim; DOM for grid-based games.
- Timer stores an absolute end timestamp in localStorage so refresh does not reset it; no server time.
- SEO: title "LAB ESCAPE — Survive the Boring Lab", matching description, OG/Twitter metadata on the index route.

## Scope note
This is a large build. I will work through the phases in order and keep each phase functional before moving on — no placeholder games, no dead buttons.
