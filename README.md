# Lab Escapade

LAB ESCAPE — The Ultimate College Lab Boredom Simulator

ROLE

You are a senior frontend engineer, interaction designer, game UX designer, and creative technologist responsible for designing and implementing a polished, production-quality interactive web experience.

You are not building a conventional website.

You are building LAB ESCAPE, an interactive college-computer-lab boredom simulator that feels like a playable digital environment.

The experience should combine:

Neo-brutalist web design

Retro/Y2K computer interfaces

90s/2000s college computer lab aesthetics

CRT/glitch effects

Interactive desktop environments

Mini-games

Hidden Easter eggs

Fake operating-system interactions

College humor

Strong sound/interaction design

Smooth premium animations

Persistent game progress

A central 4-hour laboratory survival experience

The final product should feel like:

Awwwards-quality interactive website × retro computer OS × college lab × mini-game arcade × absurd student humor.

Do not make it look like a generic dashboard, SaaS application, portfolio, or ordinary gaming website.

1. CORE PRODUCT CONCEPT

The player has entered a boring college computer laboratory.

They have approximately 4 hours to survive.

The website is the laboratory.

The player explores the environment, interacts with objects, discovers applications, plays mini-games, solves puzzles, collects achievements, discovers secrets, and attempts to escape before the timer reaches zero.

The central narrative is:

"You came to the lab to study. Unfortunately, the lab had other plans."

The experience should progressively become more chaotic as time passes.

2. DESIGN PHILOSOPHY

Use this design ratio:

60% Neo-brutalism

25% Retro/Y2K computer UI

10% CRT/glitch aesthetics

5% subtle skeuomorphic details

Do NOT use pure neumorphism.

Do NOT create excessive glassmorphism.

Do NOT make every component rounded.

Do NOT create a generic modern SaaS dashboard.

The interface should feel tactile, physical, playful, slightly broken, and intentionally weird.

3. VISUAL LANGUAGE

Primary colors

Use a restrained palette:

OFF_WHITE   #F4F1E8
BLACK       #111111
RED         #FF3B30
YELLOW      #FFD60A
GREEN       #32D74B
BLUE        #2997FF


Use black and off-white as the dominant visual language.

Use red/yellow/green/blue primarily for:

warnings

active states

achievements

game states

important interactive elements

system notifications

Do not turn the entire website into a rainbow.

4. TYPOGRAPHY

Recommended typography:

Primary UI

Space Grotesk / Geist

Terminal/system text

JetBrains Mono / IBM Plex Mono

Major display headings

Anton / Archivo Black / similar heavy grotesk

Typography should create hierarchy through:

extreme size differences

weight

spacing

monospace system text

uppercase labels

oversized headings

Example:

LAB
ESCAPE


with:

C:\LAB\SYSTEM\STATUS


used for system information.

5. APPLICATION STACK

Use:

React

Vite

TypeScript

Tailwind CSS

GSAP

Lenis

Framer Motion where appropriate

Lucide React for icons

Howler.js or Web Audio API for sound

HTML Canvas for suitable mini-games

localStorage for persistent progress

Avoid unnecessary dependencies.

Use TypeScript throughout.

Do not use JavaScript unless absolutely necessary.

6. ARCHITECTURE

Create a scalable architecture.

Suggested structure:

src/
│
├── app/
│   ├── App.tsx
│   ├── routes.tsx
│   └── providers/
│
├── components/
│   ├── ui/
│   ├── windows/
│   ├── desktop/
│   ├── terminal/
│   ├── notifications/
│   └── common/
│
├── games/
│   ├── snake/
│   ├── reaction/
│   ├── memory/
│   ├── typing/
│   ├── minesweeper/
│   ├── aim/
│   ├── tictactoe/
│   └── runner/
│
├── systems/
│   ├── GameState.ts
│   ├── TimerSystem.ts
│   ├── AchievementSystem.ts
│   ├── EasterEggSystem.ts
│   ├── SoundSystem.ts
│   ├── NotificationSystem.ts
│   └── SaveSystem.ts
│
├── data/
│   ├── games.ts
│   ├── achievements.ts
│   ├── easterEggs.ts
│   ├── terminalCommands.ts
│   └── messages.ts
│
├── hooks/
│
├── utils/
│
├── styles/
│   ├── globals.css
│   ├── crt.css
│   └── animations.css
│
└── assets/


Keep game logic isolated from UI.

Every game must be independently testable.

7. ENTRY EXPERIENCE

When the user first opens the website, do NOT immediately throw them into the dashboard.

Create a short cinematic boot sequence.

Example:

INITIALIZING LAB ESCAPE...

Loading laboratory environment...
[███████████████████░] 96%

Checking professor presence...
[████████████████████] DONE

Checking attendance...
[WARNING]

Checking WiFi...
[CRITICAL]

Checking student motivation...
[NOT FOUND]

SYSTEM READY.


Then:

WELCOME TO LAB 404

YOU HAVE:

03:59:59

TO ESCAPE.


Have a large:

ENTER LAB →

button.

Use a satisfying transition into the laboratory.

Allow users to skip the intro after the first visit.

8. MAIN ENVIRONMENT

The main screen should resemble an interactive computer laboratory.

Possible objects:

Computer

Opens terminal / desktop environment.

Phone

Opens fake messaging application.

Notice Board

Shows random college announcements and jokes.

Desk

Contains puzzles and collectibles.

Drawer

Contains hidden items.

Printer

Generates random documents.

Clock

Displays laboratory time.

Window

Shows an animated environment outside.

Trash Bin

Contains hidden Easter eggs.

Whiteboard

Contains clues.

Backpack

Contains collected items.

Objects must be visually discoverable and interactive.

9. INTERACTION PRINCIPLE

Everything should feel alive.

Hover:

slight translation

hard shadow movement

cursor feedback

subtle sound

micro-animation

Click:

physical button depression

tactile animation

appropriate sound

state transition

Double-click:

deeper interaction where appropriate

Long press:

optional secret interactions

Do not animate everything constantly.

Animation should communicate:

hierarchy

feedback

discovery

state change

10. MAIN HUD

Always show a compact status HUD.

Example:

┌────────────────────────────────────┐
│ LAB ESCAPE.exe                     │
│                                    │
│ TIME LEFT      03:42:19            │
│ BOREDOM        ████████░░ 82%      │
│ SCORE          1,240               │
│ XP             LV. 07              │
│                                    │
│ [MENU] [GAMES] [INVENTORY]        │
└────────────────────────────────────┘


The HUD should be responsive and collapse intelligently on mobile.

11. FOUR-HOUR TIMER SYSTEM

The timer is a major gameplay mechanic.

Use a configurable duration internally.

Default:

4 hours


For development/testing, provide a hidden developer setting allowing:

30 seconds
1 minute
5 minutes
30 minutes
4 hours


The timer must persist across accidental refreshes.

Use localStorage.

Do not depend on server time.

12. TIME PHASES

Create five phases.

PHASE 1 — NORMAL

Remaining:

100% → 75%

Mood:

"Maybe this lab won't be so bad."

Environment:

calm

clean

normal sound

subtle animation

PHASE 2 — BOREDOM

75% → 50%

Mood:

"Okay... this is getting boring."

Introduce:

boredom meter

random notifications

small glitches

more interactive objects

unlocked mini-games

PHASE 3 — CHAOS

50% → 25%

Mood:

"We are losing it."

Introduce:

UI glitches

random fake system warnings

unusual sounds

random events

secret interactions

increased NPC/professor events

PHASE 4 — PANIC

25% → 5%

Mood:

"THE LAB IS ENDING."

Introduce:

countdown

aggressive notifications

screen effects

professor warnings

emergency escape clues

faster ambient audio

PHASE 5 — ESCAPE

5% → 0%

Display:

PACK YOUR BAG.

THE PROFESSOR IS COMING.


At 0:

LAB SESSION COMPLETE.

YOU SURVIVED.

ESCAPE SUCCESSFUL.


Give the user a final score.

13. BOREDOM METER

Create a dynamic boredom meter.

It should increase naturally over time.

Player interaction should reduce boredom.

Example:

BOREDOM
██████████████████░░ 91%


Playing games:

reduce boredom

Finding Easter eggs:

reduce boredom significantly

Solving puzzles:

reduce boredom

Doing nothing:

boredom increases

High boredom can trigger random events.

14. MINI-GAME ARCADE

Create a dedicated Games.exe application.

It must contain multiple fully functional games.

Do not create fake game cards.

Every listed game must actually work.

GAME 1 — SNAKE

Classic Snake.

Requirements:

keyboard controls

mobile touch controls

increasing speed

food

score

high score

game over

restart

pause

Rules:

Snake grows after eating

Hitting itself = game over

Hitting wall = game over

Each food = +10 points

Save high score.

GAME 2 — REACTION TEST

Display:

WAIT...


Screen changes at random time:

CLICK!


Measure reaction time in milliseconds.

Rules:

clicking too early = false start

calculate reaction time

display rating

Example:

142 ms

INSANE.


Save best reaction time.

GAME 3 — MEMORY MATRIX

Show a grid.

Some cells briefly light up.

Hide them.

Player must reproduce the pattern.

Rules:

Start with easy pattern

Increase difficulty

More cells per level

Wrong cell = life lost

Three mistakes = game over

Track highest level.

GAME 4 — TYPING RACE

Display random college-related sentences.

Example:

"Sir I submitted the assignment yesterday."


Player must type it.

Track:

WPM

accuracy

mistakes

completion time

Score based on:

speed + accuracy


Include funny sentences.

GAME 5 — MINESWEEPER

Fully functional Minesweeper.

Include:

grid

mines

flagging

timer

win detection

loss detection

restart

difficulty

Difficulty:

EASY
MEDIUM
HARD


GAME 6 — TIC TAC TOE

Playable against:

friend

AI

AI difficulty:

EASY
NORMAL
IMPOSSIBLE


Impossible mode should use a minimax-based strategy.

Track wins/losses/draws.

GAME 7 — AIM TRAINER

Create a target that appears at random locations.

Player must click it.

Track:

accuracy

reaction time

score

targets hit

misses

Difficulty increases gradually.

GAME 8 — FLAPPY LAB

Create a simple Flappy Bird-inspired game.

Player controls a small computer cursor/object.

Avoid obstacles.

Track:

score

high score

Do not use copyrighted assets.

GAME 9 — COLLEGE ESCAPE RUNNER

Create a simple infinite runner.

Player controls a student.

Obstacles:

professor

assignment

attendance warning

lab chair

network cable

Collect:

coffee

marks

attendance

WiFi

The player jumps to avoid obstacles.

Speed increases gradually.

GAME 10 — QUICK MATH

Generate random arithmetic questions.

Example:

17 × 8 = ?


Give 5 seconds.

Difficulty increases.

Score based on:

speed

correctness

15. GAME SYSTEM

All games must share a common system.

Each game should return:

score
accuracy
time
completion


The central system converts performance into XP.

Example:

XP = score multiplier + difficulty bonus


Do not allow negative or impossible values.

16. XP SYSTEM

Create levels.

Example:

LEVEL 01
LEVEL 02
LEVEL 03
...
LEVEL 50


XP should persist.

Example:

LEVEL 07
██████████████░░░░
1,240 / 1,500 XP


Unlock cosmetic UI changes or achievements rather than pay-to-win mechanics.

17. ACHIEVEMENT SYSTEM

Create at least 25 achievements.

Examples:

First Click

Click your first interactive object.

Button Masher

Click 100 buttons.

Professional Procrastinator

Spend 30 minutes in the lab.

Speed Demon

Reaction time under 200ms.

Snake God

Score over 500.

Minesweeper Survivor

Complete Hard mode.

Touch Grass

Stay idle for 5 minutes.

Professor Detected

Trigger a professor event.

Hacker

Execute 10 terminal commands.

Archaeologist

Find a hidden Easter egg.

No Life

Play 5 different games.

Escape Artist

Complete the entire timer.

Some achievements should be secret.

18. TERMINAL SYSTEM

The computer should open a fake terminal.

Example:

C:\LAB>


Support commands.

Minimum commands:

help
clear
status
games
inventory
achievements
score
about
time
scan
hack
matrix
coffee
sudo
exit


Example:

C:\LAB> status

PROFESSOR       AWAY
WIFI            UNSTABLE
ATTENDANCE      67%
BOREDOM         84%
ESCAPE STATUS   POSSIBLE


Some commands should trigger secret events.

19. SECRET TERMINAL COMMANDS

Include hidden commands that are not documented in help.

Examples:

sudo
konami
matrix
iamroot
admin
coffee
professor
42


Do not reveal all of them.

Some should unlock:

achievements

games

visual effects

secret messages

temporary UI changes

20. FAKE COLLEGE MESSAGING APP

Clicking the phone opens a fake messaging interface.

Contacts:

Ashwin
Class Group
Professor
Lab Partner
Unknown Number


Messages should be humorous.

Example:

Professor:

"Everyone submit the practical before leaving."

Class Group:

"Bro did anyone understand what sir taught?"

Lab Partner:

"Can you send me the code?"

Unknown Number:

"Don't look behind you."

The final message should trigger a secret event.

21. NOTICE BOARD

Create a physical-looking notice board.

Random notices:

NOTICE

Students are strictly prohibited
from sleeping during practicals.

— Management


Another:

IMPORTANT

WiFi password changed.

Ask nobody.



Another:

ATTENDANCE UPDATE

Your attendance has been
emotionally reviewed.


Notices can change based on time phase.

22. PROFESSOR EVENT SYSTEM

Create random professor events.

The professor does not need to be a real person.

Represent them through:

notification

silhouette

warning

sound

UI disruption

Example:

⚠ PROFESSOR DETECTED

Distance: 12 meters

ACT NORMAL.


For 3 seconds, the UI should temporarily switch into:

PRODUCTIVE MODE


Show fake coding content.

Then:

FALSE ALARM.


This should be rare enough that it remains funny.

23. EASTER EGG SYSTEM

Create at least 30 Easter eggs.

Examples:

clicking clock 3 times

clicking trash repeatedly

entering secret terminal commands

clicking a tiny pixel

interacting with objects in a specific order

idle for a long time

opening every application

winning multiple games

clicking "Do Not Click"

entering Konami code

Each Easter egg should have a unique response.

Some should unlock achievements.

24. "DO NOT CLICK" BUTTON

Somewhere in the environment place:

DO NOT CLICK


Of course, users will click it.

Create escalating responses:

Click 1:

You clicked it.

Click 2:

I told you not to.

Click 3:

Bro.

Click 4:

Stop.

Click 5:

Fine.

Then trigger a ridiculous visual event.

But do not permanently damage the application.

25. SOUND DESIGN

Sound should be subtle by default.

Include:

keyboard typing

mouse clicks

terminal sounds

notification sounds

error beep

success sound

CRT hum

fan ambience

distant classroom ambience

game sounds

Provide:

SOUND ON/OFF
MASTER VOLUME
SFX VOLUME
AMBIENCE VOLUME


Respect browser autoplay policies.

Do not automatically play loud music before user interaction.

26. CRT EFFECT

Create an optional CRT mode.

Effects:

scanlines

slight screen distortion

subtle noise

vignette

chromatic aberration

Allow:

CRT MODE: ON/OFF


Keep effects performant.

Do not make text unreadable.

27. GLITCH SYSTEM

Glitches should be intentional.

Use them for:

entering secret areas

phase changes

achievements

random events

terminal commands

Never allow glitches to:

break navigation

make content inaccessible

cause excessive CPU usage

create motion sickness

Respect:

prefers-reduced-motion


28. SAVE SYSTEM

Persist:

timer
XP
level
score
high scores
achievements
Easter eggs
settings
unlocked content
game statistics


Use versioned localStorage.

Example:

labEscape_save_v1


Handle corrupted save data gracefully.

Provide:

RESET PROGRESS


with confirmation.

29. MOBILE EXPERIENCE

Do not simply shrink the desktop UI.

Create a proper mobile layout.

Important:

touch controls

responsive windows

bottom navigation where necessary

readable typography

no tiny buttons

games optimized for touch

portrait-first mini-games

For desktop, mouse interactions should feel richer.

For mobile, touch interactions should remain equally functional.

30. ACCESSIBILITY

Implement:

keyboard navigation

visible focus states

ARIA labels where appropriate

readable contrast

reduced-motion support

sound controls

no essential information communicated only through color

accessible game controls where possible

31. PERFORMANCE

The website must feel fast.

Requirements:

lazy-load games

lazy-load heavy assets

avoid unnecessary React re-renders

use requestAnimationFrame appropriately

clean animation loops

clean event listeners

clean timers

avoid memory leaks

pause game loops when windows are hidden

optimize Canvas rendering

avoid excessive DOM nodes

Target:

Lighthouse Performance: 90+


where realistically achievable.

32. RESPONSIVE BREAKPOINTS

Design intentionally for:

Mobile
Tablet
Laptop
Desktop
Large desktop


Do not rely solely on default Tailwind breakpoints.

The interactive laboratory should rearrange intelligently.

33. MICRO-INTERACTIONS

Every important interaction should have feedback.

Examples:

Button hover:

translateX(3px)
translateY(3px)
shadow decreases


Button click:

translateY(5px)


Window opening:

scale + opacity + slight rotation


Achievement:

notification slides in


Game over:

CRT glitch


Easter egg:

unexpected animation


Keep animations short and intentional.

34. CURSOR

Desktop should have a custom cursor.

Possible states:

default
interactive
game
terminal
secret
warning


However, never sacrifice usability.

Allow users to disable custom cursor.

35. RANDOM EVENT ENGINE

Create a random event system.

Events could include:

Professor Detected
WiFi Disconnected
Assignment Reminder
Someone Asked for Code
Unexpected Error
Coffee Break
Lab Assistant Entered
Power Flicker
System Update
Unknown Message


Events should have cooldowns.

Do not spam users.

Use weighted randomness.

36. DEBUG / DEVELOPER MODE

Create a hidden developer mode.

Possible activation:

terminal:
devmode


Developer mode allows:

settime
addxp
unlockall
trigger professor
trigger glitch
resetgames
showstate


Keep this inaccessible from normal UI.

37. ERROR HANDLING

Never allow one broken game to crash the entire application.

Wrap games in error boundaries.

If a game crashes:

GAME.EXE ENCOUNTERED AN ERROR

Don't worry.

The lab is probably fine.

[RESTART GAME]


Do not expose raw stack traces to normal users.

38. GAME PAUSE BEHAVIOR

When opening another application:

pause active games

stop game timers where appropriate

preserve game state

prevent background CPU usage

If the user switches browser tabs:

pause games

avoid cheating through background execution

39. GAME BALANCING

Every game should be:

understandable within 5 seconds

playable within 30 seconds

replayable

progressively challenging

Do not make mini-games unnecessarily complicated.

The goal is:

"I'm bored. Let me play this for two minutes."

Then:

"Wait, one more round."

40. UX FLOW

Primary flow:

OPEN WEBSITE
     ↓
BOOT SEQUENCE
     ↓
ENTER LAB
     ↓
EXPLORE
     ↓
DISCOVER COMPUTER
     ↓
OPEN LAB DESKTOP
     ↓
PLAY / EXPLORE / SOLVE
     ↓
GAIN XP
     ↓
UNLOCK ACHIEVEMENTS
     ↓
DISCOVER SECRETS
     ↓
SURVIVE TIMER
     ↓
ESCAPE


But users must also be able to freely explore.

Do not force linear progression.

41. MAIN DESKTOP APPLICATIONS

Create desktop-style applications:

🖥 COMPUTER
💻 TERMINAL
🎮 GAMES
📱 PHONE
📋 NOTICE BOARD
🗂 FILES
🧩 PUZZLES
🏆 ACHIEVEMENTS
🎒 INVENTORY
⚙ SETTINGS


Each should feel like a different mini-world.

42. FILE SYSTEM

Create a fake file explorer.

Example:

C:\LAB\

├── Assignments
├── Student_Data
├── Secret
├── Professor
├── Games
├── System
└── DO_NOT_OPEN


Some files open normally.

Some contain jokes.

Some contain clues.

Some are locked.

Some are Easter eggs.

43. INVENTORY

Players can collect:

Coffee
USB Drive
Lab Key
Mysterious Note
Attendance Slip
Broken Mouse
Secret Chip
Professor's Password


Inventory items can be used in puzzles.

Do not make inventory overly complicated.

44. PUZZLE SYSTEM

Create several lightweight puzzles.

Examples:

Password puzzle

Find clues around the lab.

Binary puzzle

Decode binary text.

Caesar cipher

Decode a message.

Pattern puzzle

Find the next pattern.

Hidden object

Find something in the environment.

Terminal puzzle

Use commands in the correct order.

Each solved puzzle awards XP.

Some puzzles unlock secret areas.

45. ESCAPE MECHANIC

Do not make the ending simply:

timer reached zero


Allow players to discover an optional early escape route.

They can find clues and unlock:

EMERGENCY EXIT


If they solve the final puzzle:

ESCAPE SUCCESSFUL
TIME REMAINING: 02:17:34


Award a large bonus.

This creates a reason to explore.

46. END SCREEN

The final screen should calculate a performance report.

Example:

╔══════════════════════════════════╗

          LAB ESCAPE REPORT

TIME SURVIVED       03:47:12
GAMES PLAYED        8
HIGH SCORE          4,820
PUZZLES SOLVED      6
EASTER EGGS         12
ACHIEVEMENTS        9
XP EARNED           1,840

FINAL RANK

    PROFESSIONAL
    PROCRASTINATOR

╚══════════════════════════════════╝


Possible ranks:

LAB ROOKIE
CASUAL PROCRASTINATOR
CERTIFIED BUNKER
LAB SURVIVOR
PROFESSIONAL PROCRASTINATOR
SUPREME LAB ESCAPE ARTIST


47. UI STATES

Design all states properly.

Every feature must handle:

loading

empty

active

hover

focus

disabled

success

failure

paused

error

locked

completed

Do not leave placeholder states.

48. NO FAKE FUNCTIONALITY

This is extremely important.

Do not create buttons that say:

Coming Soon


unless intentionally part of the game's fictional world.

If a button exists, it should do something meaningful.

If a game appears in the Games application, it must be playable.

If a score is displayed, it must actually update.

If an achievement is displayed, it must have a real unlock condition.

If an Easter egg is listed as discovered, it must actually be discoverable.

49. DATA-DRIVEN DESIGN

Do not hardcode game cards individually throughout components.

Use structured data.

Example concept:

{
  id: "snake",
  name: "Snake",
  description: "...",
  difficulty: "easy",
  category: "arcade",
  xpReward: 100
}


Do the same for:

achievements

Easter eggs

terminal commands

notices

messages

random events

This makes the system expandable.

50. TESTING REQUIREMENTS

Before declaring the project complete, verify:

Core

application starts

routing works

timer works

timer persists

save system works

reset works

Games

Test every game independently.

Input

Test:

mouse

keyboard

touch

Responsive

Test:

mobile

tablet

laptop

desktop

Performance

Verify:

no runaway animation loops

no console errors

no memory leaks

no broken assets

Accessibility

Test keyboard navigation.

Persistence

Refresh the page and verify progress remains.

51. CONSOLE QUALITY

Final production build should have:

0 uncaught errors
0 unnecessary warnings
0 broken asset requests


Remove debugging logs.

Do not expose development information.

52. SEO

Although this is primarily an interactive experience, still implement:

meaningful title

meta description

Open Graph metadata

favicon

semantic HTML

accessible headings

Suggested title:

LAB ESCAPE — Survive the Boring Lab


Suggested description:

A ridiculous interactive college laboratory built for people who have absolutely nothing to do.


53. SECURITY

Even though this is primarily client-side:

sanitize user-entered text

do not use unsafe eval

do not execute terminal commands on the actual machine

terminal commands are purely simulated

never access local files without explicit browser permission

do not collect unnecessary user data

keep all gameplay local by default

The "hacking" elements are fictional game mechanics only.

54. ANIMATION DIRECTION

Use GSAP for major cinematic transitions.

Use CSS for simple micro-interactions.

Use Framer Motion only where it improves component-level transitions.

Do not animate everything with GSAP.

Recommended:

GSAP

boot sequence

phase transitions

window opening

major glitch events

escape sequence

CSS

button hover

shadows

focus

simple transforms

CRT scanlines

Canvas

games

particle effects where appropriate

55. SCROLL EXPERIENCE

The core application does not need excessive scrolling.

However, the intro/landing page can use cinematic scroll transitions.

Keep the actual interactive environment mostly viewport-based.

Users should feel like they are interacting with a desktop, not browsing a long landing page.

56. RESPONSIBLE ABSURDITY

Humor should feel like actual college-student humor.

Avoid generic:

"LOL student life 😂"

Instead use subtle, believable jokes.

Examples:

Attendance: 71%

Required: 75%

Professor's opinion:
"Interesting."


or:

WiFi status:

Connected

Technically.


or:

Assignment status:

99% complete

Missing:

Submission.


57. VISUAL DETAIL

Add small environmental details:

blinking monitor LEDs

rotating CPU fan

cables

sticky notes

keyboard

mouse

old monitor

lab manuals

water bottle

coffee cup

calculator

USB drives

handwritten notes

warning stickers

power indicators

clock

tiny status LEDs

These details should make the lab feel alive.

58. RANDOMIZATION

Randomize:

notices

messages

certain events

game content

puzzle values

ambient behavior

minor environmental details

But keep important progression deterministic.

Do not randomize critical puzzle solutions without saving the generated state.

59. FIRST-TIME EXPERIENCE

First-time user:

Boot
↓
Short tutorial
↓
Enter lab
↓
Highlight first interactive object
↓
Teach exploration
↓
Release player


Returning user:

Load save
↓
Continue immediately


60. SETTINGS

Include:

Sound
Music
SFX
CRT Mode
Reduced Motion
Custom Cursor
Performance Mode
Reset Progress


Settings should persist.

61. PERFORMANCE MODE

If enabled:

Disable/reduce:

CRT noise

particles

complex shadows

background animations

unnecessary blur

heavy effects

Keep functionality intact.

62. FINAL QUALITY BAR

The final result should feel like a real interactive product, not a coding demo.

The user should be able to open it and immediately think:

"What the hell is this?"

Then:

"Oh wait..."

Then:

"I can actually click everything."

Then:

"WAIT, THERE'S A GAME?"

Then:

"HOW DID I GET THIS ACHIEVEMENT?"

Then:

"BRO I'VE BEEN HERE FOR AN HOUR."

That is the desired UX.

63. DEVELOPMENT PROCESS

Build in phases.

PHASE 1 — Foundation

Implement:

React + TypeScript

Tailwind

base design system

typography

colors

responsive layout

app state

localStorage

PHASE 2 — Lab Environment

Implement:

desktop

computer

desk

phone

notice board

drawer

clock

window

inventory

PHASE 3 — Core Systems

Implement:

timer

boredom

XP

levels

achievements

save system

notifications

PHASE 4 — Terminal

Implement:

terminal UI

command parser

hidden commands

terminal Easter eggs

PHASE 5 — Games

Implement each game individually.

Do not implement all games as fake placeholders simultaneously.

Build and test each one.

PHASE 6 — Puzzle/Easter Egg System

Implement:

puzzles

secret interactions

hidden achievements

inventory items

PHASE 7 — Sound & Animation

Add:

audio

GSAP transitions

CRT

glitch

micro-interactions

PHASE 8 — Polish

Perform:

responsive testing

accessibility testing

performance optimization

error handling

save testing

final UX polish

64. IMPORTANT IMPLEMENTATION RULE

Do not blindly follow this specification if doing so creates poor UX.

You are expected to use senior-level judgment.

If a requirement conflicts with:

accessibility

performance

responsiveness

maintainability

browser limitations

choose the technically superior solution while preserving the intended experience.

65. DEFINITION OF DONE

The project is complete only when:

Boot sequence works

Lab environment works

Timer works

Timer persists

Boredom system works

XP system works

Level system works

Achievement system works

Terminal works

Hidden commands work

Phone works

Notice board works

File explorer works

Inventory works

Puzzle system works

Easter eggs work

Professor events work

Random events work

Snake works

Reaction test works

Memory game works

Typing race works

Minesweeper works

Tic Tac Toe works

Aim trainer works

Flappy Lab works

College Runner works

Quick Math works

Game scores persist

Mobile controls work

Sound controls work

CRT mode works

Reduced motion works

Custom cursor works

Developer mode works

Reset progress works

Error boundaries work

No uncaught console errors

Responsive layout works

Performance is optimized

Final escape sequence works

FINAL CREATIVE DIRECTION

Remember:

LAB ESCAPE is not a website containing games.

It is a virtual college laboratory containing a website-like operating system containing games, puzzles, secrets, and absurd interactions.

The player should feel like they discovered an entire hidden world while sitting through a boring practical.

Prioritize:

DISCOVERY > DECORATION

INTERACTION > STATIC CONTENT

HUMOR > CORPORATE POLISH

REPLAYABILITY > ONE-TIME NOVELTY

PERFORMANCE > EXCESSIVE EFFECTS

REAL FUNCTIONALITY > VISUAL PLACEHOLDERS

Build it like a senior creative technologist who wants the user to spend far longer inside the experience than they originally intended.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a681471a-00ff-4daf-9f5c-8f4e81b73623).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
