export interface EasterEgg {
  id: string;
  hint: string;
  response: string;
  xp: number;
}

export const EASTER_EGGS: EasterEgg[] = [
  { id: "clock_x3", hint: "Time is a construct.", response: "The clock ticks backwards for exactly one second. Nobody else notices.", xp: 40 },
  { id: "trash_dig", hint: "One student's trash...", response: "You dig through the bin and find a half-eaten samosa and someone's viva notes.", xp: 40 },
  { id: "do_not_click", hint: "Self explanatory.", response: "Fine. FINE. Look what you did.", xp: 60 },
  { id: "konami", hint: "Up up down down...", response: "CHEAT MODE ENABLED. Nothing actually changes. But you feel powerful.", xp: 80 },
  { id: "sudo", hint: "Elevated ambitions.", response: "student is not in the sudoers file. This incident has been reported to your parents.", xp: 50 },
  { id: "matrix", hint: "Green rain.", response: "You see the lab for what it truly is: a while(true) loop with fluorescent lighting.", xp: 60 },
  { id: "coffee", hint: "Fuel.", response: "☕ Coffee acquired. Boredom reduced. Hands slightly shaking.", xp: 45 },
  { id: "professor_cmd", hint: "Speak his name.", response: "PROFESSOR.EXE is already running in the background. It was never not running.", xp: 55 },
  { id: "answer_42", hint: "Life, the universe...", response: "Correct. Unfortunately the question was about pointer arithmetic.", xp: 42 },
  { id: "iamroot", hint: "Confidence.", response: "No you're not. But that's the spirit.", xp: 40 },
  { id: "window_stare", hint: "Look outside long enough.", response: "You stared out the window for 20 seconds. A bird stared back. Neither of you learned anything.", xp: 50 },
  { id: "printer_spam", hint: "Press print until something is wrong.", response: "The printer prints a page that just says 'STOP'. In your handwriting.", xp: 60 },
  { id: "drawer_bottom", hint: "Dig deeper.", response: "False bottom in the drawer. Inside: a chip labelled DO NOT LOSE.", xp: 70 },
  { id: "whiteboard_erase", hint: "Clean slate.", response: "Erasing reveals a previous class's exam answers. They're wrong.", xp: 55 },
  { id: "backpack_zip", hint: "Fully unpack.", response: "At the bottom of your bag: a pen from 2019 and unspeakable crumbs.", xp: 45 },
  { id: "pixel", hint: "Somewhere there is one pixel.", response: "You found the single dead pixel. It has been waiting.", xp: 90 },
  { id: "idle_long", hint: "Do nothing convincingly.", response: "You achieved perfect stillness. This is what the syllabus calls 'observation'.", xp: 50 },
  { id: "all_apps", hint: "Open everything.", response: "Every window open at once. The machine wheezes. You are now IT support.", xp: 65 },
  { id: "terminal_hack", hint: "Hack the mainframe.", response: "HACKING... 1%... 99%... ACCESS DENIED BY THE LAB ASSISTANT.", xp: 55 },
  { id: "terminal_scan", hint: "Scan the room.", response: "SCAN COMPLETE: 1 professor (dormant), 3 students (asleep), 1 you (questionable).", xp: 45 },
  { id: "reboot_spam", hint: "Turn it off and on again.", response: "The monitor sighs audibly. That shouldn't be possible.", xp: 50 },
  { id: "file_do_not_open", hint: "There is a folder.", response: "DO_NOT_OPEN contains a single file: 'told_you.txt'. It is empty. Menacing.", xp: 70 },
  { id: "chair_spin", hint: "Furniture based fun.", response: "You spun the lab chair 360°. The lab briefly spins with you.", xp: 40 },
  { id: "wifi_rage", hint: "Try to connect. Repeatedly.", response: "WiFi status: Connected. Technically.", xp: 45 },
  { id: "snake_self", hint: "Some games teach lessons.", response: "You ate yourself. Very relatable behaviour for exam season.", xp: 40 },
  { id: "mine_first_click", hint: "Bad luck, statistically.", response: "First click. Mine. The universe is sending a message.", xp: 45 },
  { id: "phone_unknown", hint: "Answer the number you don't know.", response: "You looked behind you. There was nothing. Obviously. Obviously.", xp: 80 },
  { id: "night_owl", hint: "Some sessions run late.", response: "The tube light flickers into a warmer colour. The lab feels almost cosy. Almost.", xp: 50 },
  { id: "achievement_hunter", hint: "Collect a lot.", response: "You are optimising the wrong resource, and you're doing it beautifully.", xp: 75 },
  { id: "reset_flirt", hint: "Consider deleting everything.", response: "You hovered over RESET PROGRESS and reconsidered. Growth.", xp: 60 },
];

export const EGG_MAP = new Map(EASTER_EGGS.map((e) => [e.id, e]));
