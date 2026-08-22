export interface MemeOrShayari {
  id: string;
  category: "meme" | "shayari";
  title: string;
  body: string;
  author: string;
}

export const HINDI_MEMES_AND_SHAYARI: MemeOrShayari[] = [
  // ── 💥 SHAYARI (Desi College & Lab Hardcore Vibe) ──────────────────
  {
    id: "s1",
    category: "shayari",
    title: "📜 PYAAR OR PRACTICAL",
    body: "Ishq ka bhoot aur viva ka darr... Dono me insaan ka chutiya kat-ta hai barabar! 😭💀",
    author: "Lab 404 Ghalib",
  },
  {
    id: "s2",
    category: "shayari",
    title: "📜 VIVA KI MAATAM",
    body: "Bahar se shant, andar se tabahi hu... Examiner ke saamne khada bilkul chutiya sa rasta-bhatka sipahi hu! 😂🔥",
    author: "Backbencher 007",
  },
  {
    id: "s3",
    category: "shayari",
    title: "📜 PROFESSOR KI NIKAH",
    body: "Hass kar bola professor 'code run karke dikhao'... Marenge bsdk jab terminal error bolega 'Aukaat me raho'! 🖕🚨",
    author: "C++ Ka Diwana",
  },
  {
    id: "s4",
    category: "shayari",
    title: "📜 BACKLOG GANG",
    body: "Kismat kharab ho toh kutta bhi kat le... Aur agar viva me 'Prof' mood me ho toh gaand bhi maar le! 😭📉",
    author: "75% Shortage Crew",
  },
  {
    id: "s5",
    category: "shayari",
    title: "📜 CSE BIKHAARI",
    body: "Laila ki yaad me majnu bana tha pagal... Hum C++ ke semicolon me ho gaye poore ke poore chutiya! 🐍💀",
    author: "Coders Tribe",
  },
  {
    id: "s6",
    category: "shayari",
    title: "📜 LAB ASSISTANT KI DADAGIRI",
    body: "Lab Assistant bolta hai 'Internet band hai boss'... Teri maa ki chu, hotspot on karke chalayenge 5G toss! ⚡🔥",
    author: "Hotspot Thief",
  },

  // ── 😂 MEMES (High Level Slang & Desi Slapstick) ─────────────────
  {
    id: "m1",
    category: "meme",
    title: "🤡 CODING MEME",
    body: "Me: Code perfectly run ho gaya without error!\nCompiler: Jaldi mat khush ho bsdk, logic hi galat hai tera! 🤡💀",
    author: "StackOverflow Beggar",
  },
  {
    id: "m2",
    category: "meme",
    title: "🔥 EXAM HALL MOMENT",
    body: "Topper: Bhai sirf 12 pages hi likhe hain!\nMe: Abey saale, tu answer-sheet bhar raha hai ya apni randi-rona likh raha hai?! 😡📝",
    author: "Roll No. 69",
  },
  {
    id: "m3",
    category: "meme",
    title: "🚀 ATTENDANCE SCAM",
    body: "Prof: 74.9% attendance hai, exam me nahi baithne dunga.\nMe in mind: Teri behen ki chu, shaadi me toh bula letakamse kam bsdk! 😭📉",
    author: "Desk Spinner",
  },
  {
    id: "m4",
    category: "meme",
    title: "💥 VIVA EXPERIENCE",
    body: "External Examiner: Define Object Oriented Programming.\nMe: Sir object hota hai... fir orient hota hai... fir programming hoti hai... Baaki aap dekh lo bsdk! 💀⚡",
    author: "Viva Topper",
  },
  {
    id: "m5",
    category: "meme",
    title: "🐍 PYTHON VS CPP",
    body: "C++ Dev: Maine 100 line ka memory leak free code banaya!\nPython Dev: print('boredom.exe') bsdk! 😂⚡",
    author: "Guido Fanboy",
  },
  {
    id: "m6",
    category: "meme",
    title: "🍻 COLLEGE HOSTEL LIFE",
    body: "Hostel Warden: 10 baje ke baad bahar kaun tha?!\nMe: Aapki beti ke saath momos khane gaya tha uncle, chills karo bsdk! 🍢💥",
    author: "Hostel Room 302",
  },
  {
    id: "m7",
    category: "meme",
    title: "💻 PLACEMENT CELL",
    body: "Company HR: Package is 3.5 LPA with 3 year bond.\nMe: Isse achha toh chai ki tapri khol lu,kam se kam aukaat me toh rahunga bsdk! 🍵📉",
    author: "Unemployed Engineer",
  },
  {
    id: "m8",
    category: "meme",
    title: "🎯 PROJECT PRESENTATION",
    body: "Guide: Is project me machine learning kaha hai?\nMe: Sir HTML/CSS me 'Learning' hi toh kar raha hu tab se bsdk! 🧠🤖",
    author: "Frontend Noob",
  },
];
