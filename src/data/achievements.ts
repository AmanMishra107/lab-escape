export interface Achievement {
  id: string;
  name: string;
  description: string;
  xp: number;
  secret?: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_click", name: "First Click", description: "Touch your first object in the lab.", xp: 25 },
  { id: "button_masher", name: "Button Masher", description: "Click 100 things. Anything.", xp: 75 },
  { id: "explorer", name: "Field Researcher", description: "Discover 6 objects in the lab.", xp: 100 },
  { id: "cartographer", name: "Cartographer", description: "Discover every object in the lab.", xp: 250 },
  { id: "booted", name: "Cold Boot", description: "Boot the lab computer.", xp: 30 },
  { id: "app_opener", name: "Multitasker", description: "Open 5 different applications.", xp: 120 },
  { id: "all_apps", name: "Power User", description: "Open every application at least once.", xp: 200 },
  { id: "hacker", name: "Hacker (Fictional)", description: "Execute 10 terminal commands.", xp: 120 },
  { id: "sudoer", name: "Permission Denied", description: "Try sudo. Obviously.", xp: 50, secret: true },
  { id: "matrix", name: "There Is No Practical", description: "Enter the matrix.", xp: 80, secret: true },
  { id: "devmode", name: "Behind The Curtain", description: "Discover developer mode.", xp: 100, secret: true },
  { id: "speed_demon", name: "Speed Demon", description: "React in under 200ms.", xp: 150 },
  { id: "snake_god", name: "Snake God", description: "Score 200+ in Snake.", xp: 200 },
  { id: "sweeper", name: "Minesweeper Survivor", description: "Clear a Hard minefield.", xp: 250 },
  { id: "no_life", name: "No Life", description: "Play 5 different games.", xp: 180 },
  { id: "arcade_complete", name: "Arcade Regular", description: "Play all 10 games.", xp: 400 },
  { id: "typist", name: "Certified Typist", description: "Hit 60 WPM in Typing Race.", xp: 150 },
  { id: "impossible", name: "Draw With God", description: "Draw against IMPOSSIBLE Tic Tac Toe.", xp: 200 },
  { id: "sharpshooter", name: "Sharpshooter", description: "90% accuracy in Aim Trainer.", xp: 160 },
  { id: "mathlete", name: "Mental Arithmetic", description: "Answer 10 Quick Math questions in a row.", xp: 160 },
  { id: "procrastinator", name: "Professional Procrastinator", description: "Survive 25% of the session.", xp: 120 },
  { id: "halfway", name: "Halfway To Freedom", description: "Survive half the session.", xp: 200 },
  { id: "touch_grass", name: "Touch Grass", description: "Stay completely idle for 3 minutes.", xp: 90, secret: true },
  { id: "professor", name: "Professor Detected", description: "Survive a professor event.", xp: 100 },
  { id: "archaeologist", name: "Archaeologist", description: "Find your first easter egg.", xp: 80 },
  { id: "egg_hunter", name: "Egg Hunter", description: "Find 10 easter eggs.", xp: 250, secret: true },
  { id: "puzzler", name: "Puzzler", description: "Solve your first puzzle.", xp: 120 },
  { id: "cryptographer", name: "Cryptographer", description: "Solve every puzzle in the lab.", xp: 400 },
  { id: "packrat", name: "Pack Rat", description: "Collect 5 inventory items.", xp: 140 },
  { id: "do_not_click", name: "You Were Warned", description: "Click the thing you were told not to click. Five times.", xp: 120, secret: true },
  { id: "escape_artist", name: "Escape Artist", description: "Survive the entire lab session.", xp: 500 },
  { id: "early_exit", name: "Emergency Exit", description: "Escape early through the fire door.", xp: 750, secret: true },
];

export const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
