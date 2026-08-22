export interface AptitudeQuestion {
  id: number;
  category: "Logical" | "Maths" | "Verbal" | "Technical";
  question: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3; // Index of correct option (0=A, 1=B, 2=C, 3=D)
  explanation: string;
}

export interface CompanyTier {
  id: "level1" | "level2" | "level3";
  name: string;
  role: string;
  ctc: string;
  timeLimitSec: number;
  passScore: number; // 21 out of 30 (70%)
  description: string;
  logoEmoji: string;
  questions: AptitudeQuestion[];
}

export const COMPANY_TIERS: CompanyTier[] = [
  // =========================================================================
  // LEVEL 1: TCS / INFOSYS / CAMPUS STARTUP (EASY TIER)
  // =========================================================================
  {
    id: "level1",
    name: "TCS / INFOSYS / CAMPUS STARTUP",
    role: "Associate Software Engineer",
    ctc: "$85,000 / 10 LPA",
    timeLimitSec: 900, // 15 mins
    passScore: 21,
    description: "Foundational campus placement round. Tests speed, fundamental aptitude, basic logical reasoning, English grammar, and introductory coding.",
    logoEmoji: "🚀",
    questions: [
      // LOGICAL (1-8)
      {
        id: 101,
        category: "Logical",
        question: "Find the next number in sequence: 4, 9, 19, 39, 79, ?",
        options: ["119", "139", "159", "179"],
        answer: 2,
        explanation: "Each number is multiplied by 2 and increased by 1: 79 * 2 + 1 = 159."
      },
      {
        id: 102,
        category: "Logical",
        question: "If CAT is coded as 3120 and DOG is coded as 4157, how is BUG coded?",
        options: ["2217", "2157", "2219", "2127"],
        answer: 0,
        explanation: "Replace each letter with its position in alphabetical order (B=2, U=21, G=7)."
      },
      {
        id: 103,
        category: "Logical",
        question: "Pointing to a photograph, Alex said: 'He is the son of the only daughter of my father's wife.' Who is Alex to the man?",
        options: ["Brother", "Uncle", "Father", "Mother"],
        answer: 1,
        explanation: "Father's wife = Mother. Only daughter of mother = Alex's sister. Son of sister = Alex's nephew. So Alex is his Uncle."
      },
      {
        id: 104,
        category: "Logical",
        question: "Which word does NOT belong with the others?",
        options: ["Leopard", "Cheetah", "Cougar", "Elephant"],
        answer: 3,
        explanation: "Elephant is an herbivore, whereas the others are wild big felines."
      },
      {
        id: 105,
        category: "Logical",
        question: "Statements: All coders are dreamers. All dreamers are night owls. Conclusion: All coders are night owls.",
        options: ["Definitely True", "Definitely False", "Probably True", "Irrelevant"],
        answer: 0,
        explanation: "Since Coders ⊂ Dreamers ⊂ Night Owls, all coders are definitely night owls."
      },
      {
        id: 106,
        category: "Logical",
        question: "A is taller than B, but shorter than C. D is taller than E, but shorter than B. Who is the tallest?",
        options: ["A", "B", "C", "D"],
        answer: 2,
        explanation: "Order from tallest to shortest: C > A > B > D > E. C is the tallest."
      },
      {
        id: 107,
        category: "Logical",
        question: "If SOUTH-WEST becomes NORTH, what does NORTH-EAST become?",
        options: ["SOUTH", "SOUTH-WEST", "EAST", "WEST"],
        answer: 1,
        explanation: "SOUTH-WEST rotates 135 degrees clockwise to become NORTH. NORTH-EAST rotated 135 degrees clockwise becomes SOUTH-WEST."
      },
      {
        id: 108,
        category: "Logical",
        question: "Find the odd number pair: (13, 169), (17, 289), (12, 144), (15, 235)",
        options: ["(13, 169)", "(17, 289)", "(12, 144)", "(15, 235)"],
        answer: 3,
        explanation: "15 squared is 225, not 235."
      },

      // MATHS (9-16)
      {
        id: 109,
        category: "Maths",
        question: "A car travels at 60 km/h for 2 hours and then 90 km/h for 1 hour. What is the average speed?",
        options: ["70 km/h", "75 km/h", "80 km/h", "85 km/h"],
        answer: 0,
        explanation: "Total distance = 120 + 90 = 210 km. Total time = 3 hours. Average speed = 210 / 3 = 70 km/h."
      },
      {
        id: 110,
        category: "Maths",
        question: "A pipe can fill a tank in 6 hours. Another pipe empties it in 12 hours. If both open, how long to fill?",
        options: ["8 hours", "10 hours", "12 hours", "14 hours"],
        answer: 2,
        explanation: "Net rate per hour = 1/6 - 1/12 = 1/12 tank per hour. So 12 hours total."
      },
      {
        id: 111,
        category: "Maths",
        question: "What is 15% of 40% of 1200?",
        options: ["72", "68", "84", "96"],
        answer: 0,
        explanation: "0.40 * 1200 = 480. 15% of 480 = 72."
      },
      {
        id: 112,
        category: "Maths",
        question: "If a product costs $80 after a 20% discount, what was the original price?",
        options: ["$96", "$100", "$105", "$110"],
        answer: 1,
        explanation: "Original price * 0.8 = $80 -> Original price = 80 / 0.8 = $100."
      },
      {
        id: 113,
        category: "Maths",
        question: "The ratio of ages of A and B is 3:4. Four years ago, the sum of their ages was 27. What is B's current age?",
        options: ["16", "20", "24", "28"],
        answer: 1,
        explanation: "Current sum of ages = 27 + 8 = 35. 3x + 4x = 35 => x = 5. B's age = 4 * 5 = 20."
      },
      {
        id: 114,
        category: "Maths",
        question: "What is the probability of getting a sum of 7 when rolling two standard 6-sided dice?",
        options: ["1/6", "1/12", "5/36", "7/36"],
        answer: 0,
        explanation: "Favorable pairs: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) = 6 pairs out of 36 = 1/6."
      },
      {
        id: 115,
        category: "Maths",
        question: "Solve for x: 3^(x + 1) = 81",
        options: ["2", "3", "4", "5"],
        answer: 1,
        explanation: "81 = 3^4. So x + 1 = 4 => x = 3."
      },
      {
        id: 116,
        category: "Maths",
        question: "What is the simple interest on $5000 at 8% per annum for 3 years?",
        options: ["$1000", "$1200", "$1400", "$1500"],
        answer: 1,
        explanation: "SI = (P * R * T) / 100 = (5000 * 8 * 3) / 100 = $1200."
      },

      // VERBAL (17-23)
      {
        id: 117,
        category: "Verbal",
        question: "Choose the synonym for 'METICULOUS':",
        options: ["Careless", "Thorough", "Hastened", "Aggressive"],
        answer: 1,
        explanation: "Meticulous means taking or showing extreme care about minute details; thorough."
      },
      {
        id: 118,
        category: "Verbal",
        question: "Choose the antonym for 'EPHEMERAL':",
        options: ["Permanent", "Fleeting", "Transient", "Short-lived"],
        answer: 0,
        explanation: "Ephemeral means lasting a short time. Its antonym is Permanent."
      },
      {
        id: 119,
        category: "Verbal",
        question: "Complete sentence: The professor gave an _______ explanation that left no room for doubt.",
        options: ["ambiguous", "explicit", "obscure", "elusive"],
        answer: 1,
        explanation: "Explicit means stated clearly and in detail, leaving no room for confusion."
      },
      {
        id: 120,
        category: "Verbal",
        question: "Identify the correctly spelled word:",
        options: ["Accomodate", "Accommodate", "Acommodate", "Accommodat"],
        answer: 1,
        explanation: "'Accommodate' has double 'c' and double 'm'."
      },
      {
        id: 121,
        category: "Verbal",
        question: "Find the idiom meaning 'To face a difficult situation with courage':",
        options: ["Bite the bullet", "Break the ice", "Spill the beans", "Burn candle at both ends"],
        answer: 0,
        explanation: "'Bite the bullet' means to face a difficult situation courageously."
      },
      {
        id: 122,
        category: "Verbal",
        question: "Which of the following is a grammatically correct sentence?",
        options: [
          "Neither of the students were present.",
          "Neither of the students was present.",
          "Neither of the students are present.",
          "Neither of students were present."
        ],
        answer: 1,
        explanation: "'Neither' is singular and takes a singular verb ('was')."
      },
      {
        id: 123,
        category: "Verbal",
        question: "Choose the word pair with the same relationship as LIGHT : DARK",
        options: ["HOT : COLD", "BIG : HUGE", "RUN : WALK", "SMART : WISE"],
        answer: 0,
        explanation: "LIGHT and DARK are antonyms, just like HOT and COLD."
      },

      // TECHNICAL (24-30)
      {
        id: 124,
        category: "Technical",
        question: "What will `console.log(typeof NaN)` return in JavaScript?",
        options: ["'undefined'", "'number'", "'NaN'", "'object'"],
        answer: 1,
        explanation: "In JavaScript, NaN (Not-a-Number) is technically of type 'number'."
      },
      {
        id: 125,
        category: "Technical",
        question: "Which HTML5 tag is used to embed an independent self-contained article?",
        options: ["<section>", "<article>", "<aside>", "<div>"],
        answer: 1,
        explanation: "The <article> tag specifies independent, self-contained content."
      },
      {
        id: 126,
        category: "Technical",
        question: "What is the time complexity of searching in a balanced Binary Search Tree (BST)?",
        options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
        answer: 2,
        explanation: "In a balanced BST, halving the search space each step results in O(log n)."
      },
      {
        id: 127,
        category: "Technical",
        question: "Which SQL command is used to remove all records from a table without logging individual deletions?",
        options: ["DELETE", "DROP", "TRUNCATE", "REMOVE"],
        answer: 2,
        explanation: "TRUNCATE removes all rows from a table quickly without logging individual row deletions."
      },
      {
        id: 128,
        category: "Technical",
        question: "What does HTTP status code 404 signify?",
        options: ["Unauthorized", "Internal Server Error", "Forbidden", "Not Found"],
        answer: 3,
        explanation: "HTTP 404 indicates that the requested server resource was Not Found."
      },
      {
        id: 129,
        category: "Technical",
        question: "In Git, which command creates a new branch and switches to it in one step?",
        options: ["git branch -new", "git checkout -b", "git switch -create", "git commit -b"],
        answer: 1,
        explanation: "'git checkout -b <branch>' creates and switches to a new branch."
      },
      {
        id: 130,
        category: "Technical",
        question: "Which data structure follows the LIFO (Last In First Out) principle?",
        options: ["Queue", "Stack", "Array", "Linked List"],
        answer: 1,
        explanation: "A Stack operates on a Last In, First Out (LIFO) order."
      },
    ]
  },

  // =========================================================================
  // LEVEL 2: MICROSOFT / AMAZON SDE-II (MEDIUM TIER)
  // =========================================================================
  {
    id: "level2",
    name: "MICROSOFT / AMAZON SDE-II",
    role: "Senior Software Engineer (SDE-II)",
    ctc: "$175,000 / 28 LPA",
    timeLimitSec: 1200, // 20 mins
    passScore: 21,
    description: "Official Amazon & Microsoft SDE-II hiring round. Tests sliding window, LRU Cache, SQL Joins, System Design scenarios, and Amazon Leadership Principles.",
    logoEmoji: "💻",
    questions: [
      // LOGICAL (1-8)
      {
        id: 201,
        category: "Logical",
        question: "Amazon Assessment: If 5 servers process 5 requests in 5 milliseconds, how many milliseconds will 100 servers take to process 100 requests?",
        options: ["1 ms", "5 ms", "20 ms", "100 ms"],
        answer: 1,
        explanation: "Rate is 1 server = 1 request per 5 ms. So 100 servers process 100 requests in 5 ms."
      },
      {
        id: 202,
        category: "Logical",
        question: "Microsoft Assessment: Find missing letter in sequence: B, E, H, K, N, ?",
        options: ["P", "Q", "R", "S"],
        answer: 1,
        explanation: "Adding 3 letters each step: N + 3 = Q."
      },
      {
        id: 203,
        category: "Logical",
        question: "Four microservices (A,B,C,D) are deployed in a chain. A is adjacent to B, but not C. C is not adjacent to D. Which service must be next to D?",
        options: ["A", "B", "C", "Cannot be determined"],
        answer: 1,
        explanation: "Order is C - A - B - D. B must sit next to D."
      },
      {
        id: 204,
        category: "Logical",
        question: "In a clock, how many times do the hour and minute hands overlap in 24 hours?",
        options: ["20", "22", "24", "44"],
        answer: 1,
        explanation: "They overlap 11 times every 12 hours, totaling 22 times in 24 hours."
      },
      {
        id: 205,
        category: "Logical",
        question: "If 'P + Q' means P is father of Q, 'P - Q' means P is sister of Q, what does 'A + B - C' mean?",
        options: ["A is uncle of C", "A is father of C", "A is brother of C", "A is son of C"],
        answer: 1,
        explanation: "A is father of B, B is sister of C => A is father of C."
      },
      {
        id: 206,
        category: "Logical",
        question: "Which database engine is NoSQL Document-based, unlike the others?",
        options: ["SQLite", "PostgreSQL", "MongoDB", "MySQL"],
        answer: 2,
        explanation: "MongoDB is a NoSQL document database, whereas the others are relational SQL databases."
      },
      {
        id: 207,
        category: "Logical",
        question: "Complete the pattern: 3, 5, 10, 12, 24, 26, ?",
        options: ["48", "52", "30", "54"],
        answer: 1,
        explanation: "Pattern alternates +2 then *2: 26 * 2 = 52."
      },
      {
        id: 208,
        category: "Logical",
        question: "Statement: 'If CPU usage exceeds 90%, alarm triggers.' Alarm did NOT trigger. Conclusion?",
        options: ["CPU usage exceeded 90%", "CPU usage did NOT exceed 90%", "Alarm is broken", "None"],
        answer: 1,
        explanation: "By Modus Tollens: If P -> Q and NOT Q, then NOT P."
      },

      // MATHS (9-16)
      {
        id: 209,
        category: "Maths",
        question: "What is the worst-case space complexity of Quicksort algorithm?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        answer: 2,
        explanation: "In worst-case (unbalanced partitions), the recursion stack reaches O(n) space."
      },
      {
        id: 210,
        category: "Maths",
        question: "In a company of 50 engineers, 30 know C++, 25 know Java, and 10 know both. How many know neither?",
        options: ["5", "10", "15", "20"],
        answer: 0,
        explanation: "Union = 30 + 25 - 10 = 45. Neither = 50 - 45 = 5."
      },
      {
        id: 211,
        category: "Maths",
        question: "Sum of 5 consecutive numbers is 135. What is the largest number?",
        options: ["27", "28", "29", "30"],
        answer: 2,
        explanation: "Middle number = 135 / 5 = 27. Five numbers are 25,26,27,28,29. Largest = 29."
      },
      {
        id: 212,
        category: "Maths",
        question: "A network packet 150m equivalent passes a router in 9ms. What is its throughput in km/h equivalent?",
        options: ["50 km/h", "60 km/h", "75 km/h", "90 km/h"],
        answer: 1,
        explanation: "150 / 9 = 50/3 m/s. In km/h = (50/3) * (18/5) = 60 km/h."
      },
      {
        id: 213,
        category: "Maths",
        question: "How many distinct ways can the letters of 'AMAZON' be arranged?",
        options: ["180", "360", "720", "120"],
        answer: 1, // 6! / 2! (A x 2) = 720 / 2 = 360
        explanation: "6 letters with 'A' repeated twice: 6! / 2! = 720 / 2 = 360."
      },
      {
        id: 214,
        category: "Maths",
        question: "Find the compound interest on $10,000 at 10% per annum compounded annually for 2 years.",
        options: ["$2000", "$2100", "$2200", "$2400"],
        answer: 1,
        explanation: "Amount = 10000 * (1.1)^2 = 12,100. Interest = $2,100."
      },
      {
        id: 215,
        category: "Maths",
        question: "If log10(x) = 3, what is x?",
        options: ["30", "300", "1000", "3000"],
        answer: 2,
        explanation: "x = 10^3 = 1000."
      },
      {
        id: 216,
        category: "Maths",
        question: "The average of 5 latency metrics is 20ms. If one metric is removed, average becomes 18ms. What was removed?",
        options: ["24ms", "26ms", "28ms", "30ms"],
        answer: 2,
        explanation: "Original sum = 5 * 20 = 100. New sum = 4 * 18 = 72. Removed value = 100 - 72 = 28."
      },

      // VERBAL (17-23)
      {
        id: 217,
        category: "Verbal",
        question: "Amazon Leadership Principle: When a project deadline is at risk, an engineer who 'Takes Ownership' will:",
        options: [
          "Blame external API dependencies",
          "Escalate immediately with options and drive resolution",
          "Wait for manager instructions",
          "Reduce code test coverage to ship faster"
        ],
        answer: 1,
        explanation: "Ownership requires taking responsibility, driving solutions, and escalating with actionable paths."
      },
      {
        id: 218,
        category: "Verbal",
        question: "Select the correctly punctuated sentence:",
        options: [
          "Its a well-known fact that the company's profits rose.",
          "It's a well-known fact that the company's profits rose.",
          "It's a well known fact that the companys profits rose.",
          "Its a well known fact that the company's profits rose."
        ],
        answer: 1,
        explanation: "'It's' = It is, 'well-known' is hyphenated before noun, 'company's' shows possession."
      },
      {
        id: 219,
        category: "Verbal",
        question: "Choose the antonym for 'PRAGMATIC':",
        options: ["Practical", "Idealistic", "Rational", "Sensible"],
        answer: 1,
        explanation: "Pragmatic means practical and realistic; its antonym is Idealistic."
      },
      {
        id: 220,
        category: "Verbal",
        question: "Complete: 'She has a knack for finding creative solutions to _______ problems.'",
        options: ["intricate", "obsolete", "trivial", "mundane"],
        answer: 0,
        explanation: "Intricate means very complicated or detailed."
      },
      {
        id: 221,
        category: "Verbal",
        question: "What does 'Red Herring' mean in architectural review or argument?",
        options: ["A clue leading to root cause", "A misleading clue or distraction", "A critical security patch", "A performance boost"],
        answer: 1,
        explanation: "A red herring is something that misleads or distracts from the core issue."
      },
      {
        id: 222,
        category: "Verbal",
        question: "Find the error: 'The team of engineers have completed the architecture design.'",
        options: ["The team", "of engineers", "have completed", "No error"],
        answer: 2,
        explanation: "'Team' is a collective singular noun and should use 'has completed'."
      },
      {
        id: 223,
        category: "Verbal",
        question: "Choose the word pair with analogy: ALGORITHM : CODE",
        options: ["BLUEPRINT : BUILDING", "CANVAS : PAINT", "AUTHOR : BOOK", "DOCTOR : MEDICINE"],
        answer: 0,
        explanation: "An algorithm is the plan/spec for code, just as a blueprint is the plan for a building."
      },

      // TECHNICAL (24-30)
      {
        id: 224,
        category: "Technical",
        question: "Microsoft Interview: In Operating Systems, what data structures are combined to implement an LRU (Least Recently Used) Cache with O(1) time complexity?",
        options: [
          "Doubly Linked List + Hash Map",
          "Binary Search Tree + Array",
          "Stack + Queue",
          "Min-Heap + Hash Set"
        ],
        answer: 0,
        explanation: "LRU Cache uses a Doubly Linked List for O(1) order updates and a Hash Map for O(1) key lookups."
      },
      {
        id: 225,
        category: "Technical",
        question: "Amazon Interview: What is the average-case time complexity of Mergesort?",
        options: ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"],
        answer: 1,
        explanation: "Mergesort consistently runs in O(n log n) time across best, average, and worst cases."
      },
      {
        id: 226,
        category: "Technical",
        question: "Which SOLID design principle states that a software class should be open for extension but closed for modification?",
        options: ["Single Responsibility", "Open-Closed Principle", "Liskov Substitution", "Interface Segregation"],
        answer: 1,
        explanation: "The Open-Closed Principle (OCP) requires classes to be open for extension, closed for modification."
      },
      {
        id: 227,
        category: "Technical",
        question: "In Docker, what is the main purpose of a 'Dockerfile'?",
        options: ["To store container logs", "A text script containing commands to build an image", "To manage firewall rules", "To encrypt passwords"],
        answer: 1,
        explanation: "A Dockerfile contains instructions used by Docker to build a container image."
      },
      {
        id: 228,
        category: "Technical",
        question: "What is the primary purpose of a B-Tree index in Microsoft SQL Server?",
        options: ["Reduces disk space", "Minimizes disk I/O operations for range and point queries", "Encrypts rows", "Prevents duplicate keys"],
        answer: 1,
        explanation: "B-Trees keep data sorted and allow searches, sequential access, insertions, and deletions in logarithmic time."
      },
      {
        id: 229,
        category: "Technical",
        question: "In Amazon DynamoDB, what does the CAP Theorem guarantee when Partition Tolerance is required during a network split?",
        options: ["Choose between Consistency or Availability", "Both 100% Consistency and Availability", "Neither", "Unlimited throughput"],
        answer: 0,
        explanation: "Under partition tolerance (P), a distributed system must trade off between Consistency (C) or Availability (A)."
      },
      {
        id: 230,
        category: "Technical",
        question: "In JavaScript, what is the output of `0.1 + 0.2 === 0.3`?",
        options: ["true", "false", "undefined", "TypeError"],
        answer: 1,
        explanation: "Floating point precision issues make `0.1 + 0.2` evaluate to `0.30000000000000004`, so it is false."
      },
    ]
  },

  // =========================================================================
  // LEVEL 3: GOOGLE / GOOGLE DEEPMIND (HARD TIER - GENUINE GOOGLE INTERVIEW QUESTIONS)
  // =========================================================================
  {
    id: "level3",
    name: "GOOGLE / GOOGLE DEEPMIND",
    role: "Staff AI & Software Architect (L6/L7)",
    ctc: "$320,000 / 55 LPA",
    timeLimitSec: 1500, // 25 mins
    passScore: 21,
    description: "Genuine Google & DeepMind engineering interview riddles, probability paradoxes, PageRank, Dynamic Programming, and Transformer Neural Architectures.",
    logoEmoji: "🌐",
    questions: [
      // LOGICAL & GOOGLE RIDDLES (1-8)
      {
        id: 301,
        category: "Logical",
        question: "GOOGLE RIDDLE (2-Egg Drop): You have two identical glass eggs and a 100-story building. What is the minimum number of drops required to guarantee finding the threshold floor in worst-case?",
        options: ["10", "14", "25", "50"],
        answer: 1, // 14 drops (x + (x-1) + ... + 1 >= 100 -> x=14)
        explanation: "Solving x*(x+1)/2 >= 100 gives x = 14. Drop 1st egg from floors 14, 27, 39, 50, 60, 69, 77, 84, 90, 95, 99, 100. Max 14 drops."
      },
      {
        id: 302,
        category: "Logical",
        question: "GOOGLE RIDDLE (25 Horses): You have 25 horses and can race 5 horses at a time without a timer. What is the minimum number of races to find the top 3 fastest horses?",
        options: ["5", "6", "7", "8"],
        answer: 2, // 7 races
        explanation: "5 initial group races + 1 race of the 5 group winners + 1 final elimination race between candidates = 7 races total."
      },
      {
        id: 303,
        category: "Logical",
        question: "GOOGLE RIDDLE (1000 Wine Bottles): You have 1000 bottles of wine and 1 is poisoned. You have 10 test strips that turn red in 24 hours. How many simultaneous test rounds are needed to find the poisoned bottle?",
        options: ["1 round", "10 rounds", "100 rounds", "1000 rounds"],
        answer: 0, // 1 round using binary encoding 2^10 = 1024
        explanation: "Label bottles 1 to 1000 in binary (10 bits). Assign 10 test strips to bit positions. Test all concurrently in 1 round."
      },
      {
        id: 304,
        category: "Logical",
        question: "GOOGLE PAGERANK: In Google's original PageRank algorithm, what matrix theorem guarantees that the random surfer model converges to a unique stationary probability distribution?",
        options: ["Perron-Frobenius Theorem", "Central Limit Theorem", "Bayes' Theorem", "Fourier Transform"],
        answer: 0,
        explanation: "The Perron-Frobenius Theorem guarantees that a irreducible, aperiodic stochastic matrix has a unique positive eigenvector with eigenvalue 1."
      },
      {
        id: 305,
        category: "Logical",
        question: "GOOGLE MAPREDUCE: Which two fundamental functional operations constitute the core parallel computing paradigm of Google's MapReduce framework?",
        options: ["Filter and Sort", "Map and Reduce", "Split and Join", "Push and Pull"],
        answer: 1,
        explanation: "MapReduce relies on Map (processing key-value pairs in parallel) and Reduce (aggregating intermediate values)."
      },
      {
        id: 306,
        category: "Logical",
        question: "GOOGLE DEEPMIND: What is the main structural reason Transformer Self-Attention scales parallel training better than Recurrent Neural Networks (RNNs)?",
        options: [
          "Maximum path length between tokens is O(1) instead of O(N)",
          "Transformers do not use matrix multiplication",
          "RNNs require GPU quantization",
          "Transformers have zero memory overhead"
        ],
        answer: 0,
        explanation: "Self-attention computes direct pairwise connections between all tokens in O(1) sequential operations, enabling total GPU parallelization."
      },
      {
        id: 307,
        category: "Logical",
        question: "GOOGLE MATH PROOF (Birthday Paradox): How many randomly chosen people must be in a room for there to be a >50% probability that at least two share a birthday?",
        options: ["23", "183", "365", "50"],
        answer: 0,
        explanation: "For N=23 people, 1 - (365! / (365^23 * (365-23)!)) ≈ 50.73% probability."
      },
      {
        id: 308,
        category: "Logical",
        question: "GOOGLE SEARCH: What is the worst-case space complexity of the A* Graph Search algorithm when using an admissible heuristic?",
        options: ["O(1)", "O(V)", "O(b^d)", "O(log V)"],
        answer: 2,
        explanation: "A* must store all generated nodes in memory (the OPEN list), resulting in worst-case exponential space O(b^d)."
      },

      // MATHS (9-16)
      {
        id: 309,
        category: "Maths",
        question: "GOOGLE ALGORITHM (Levenshtein Distance): What is the minimum Edit Distance (insert, delete, replace) between strings 'kitten' and 'sitting'?",
        options: ["2", "3", "4", "5"],
        answer: 1, // 3 edits (k->s, e->i, +g)
        explanation: "1. replace 'k' with 's' ('sitten'), 2. replace 'e' with 'i' ('sittin'), 3. insert 'g' ('sitting') = 3 edits."
      },
      {
        id: 310,
        category: "Maths",
        question: "GOOGLE PROBABILITY (Monty Hall Problem): After 1 goats door is revealed, what is your winning probability if you SWITCH your choice?",
        options: ["1/3", "1/2", "2/3", "3/4"],
        answer: 2,
        explanation: "Initial pick has 1/3 chance of car. Other door has 2/3 chance. Switching yields 2/3 win rate."
      },
      {
        id: 311,
        category: "Maths",
        question: "GOOGLE DEEPMIND: What is the derivative of the Softmax function's output s_i with respect to input logit z_j when i = j?",
        options: ["s_i * (1 - s_i)", "s_i * s_j", "1 / s_i", "e^z_i"],
        answer: 0,
        explanation: "∂s_i / ∂z_i = s_i * (1 - s_i), matching the logistic sigmoid derivative form."
      },
      {
        id: 312,
        category: "Maths",
        question: "What is the limit of (1 + 1/n)^n as n approaches infinity?",
        options: ["1", "2", "e (Euler's number ~2.718)", "Infinity"],
        answer: 2,
        explanation: "This is the mathematical definition of Euler's constant e."
      },
      {
        id: 313,
        category: "Maths",
        question: "If a 3x3 matrix has eigenvalues 2, 3, and 5, what is the Determinant of the matrix?",
        options: ["10", "30", "25", "15"],
        answer: 1, // 2 * 3 * 5 = 30
        explanation: "The determinant of a matrix equals the product of its eigenvalues: 2 * 3 * 5 = 30."
      },
      {
        id: 314,
        category: "Maths",
        question: "How many edges does a complete graph K_6 with 6 vertices have?",
        options: ["12", "15", "18", "30"],
        answer: 1, // 6 * 5 / 2 = 15
        explanation: "Edges = n*(n-1)/2 = 6 * 5 / 2 = 15."
      },
      {
        id: 315,
        category: "Maths",
        question: "What is Bayes' Theorem formula for P(A|B)?",
        options: ["[P(B|A) * P(A)] / P(B)", "[P(A|B) * P(B)] / P(A)", "P(A) * P(B)", "P(A) + P(B)"],
        answer: 0,
        explanation: "Bayes' Theorem: P(A|B) = [P(B|A) * P(A)] / P(B)."
      },
      {
        id: 316,
        category: "Maths",
        question: "What is the dot product of two orthogonal 3D vectors?",
        options: ["-1", "0", "1", "Infinity"],
        answer: 1,
        explanation: "Orthogonal vectors are perpendicular; their dot product is 0."
      },

      // VERBAL (17-23)
      {
        id: 317,
        category: "Verbal",
        question: "GOOGLE GOOGLEYNESS: How does Google define 'Googleyness' in leadership assessment?",
        options: [
          "Strict adherence to executive orders",
          "Intellectual humility, doing the right thing, and thriving in ambiguity",
          "Working 80 hours per week",
          "Memorizing all Google API documentation"
        ],
        answer: 1,
        explanation: "Googleyness includes intellectual humility, ethical integrity, collaboration, and navigating ambiguity."
      },
      {
        id: 318,
        category: "Verbal",
        question: "Identify the logical fallacy: 'Professor X claims climate change is real, but he drives a diesel truck!'",
        options: ["Straw Man", "Ad Hominem (Tu Quoque)", "Slippery Slope", "False Dilemma"],
        answer: 1,
        explanation: "Attacking the speaker's personal actions rather than addressing their argument is an Ad Hominem / Tu Quoque fallacy."
      },
      {
        id: 319,
        category: "Verbal",
        question: "Choose the word closest in meaning to 'PERSPICACIOUS':",
        options: ["Discerning / Insightful", "Deceitful", "Stubborn", "Transparent"],
        answer: 0,
        explanation: "Perspicacious means having keen mental perception and understanding; discerning."
      },
      {
        id: 320,
        category: "Verbal",
        question: "What is an 'Oxymoron' in technical documentation?",
        options: [
          "A comparison using 'like' or 'as'",
          "A figure of speech pairing contradictory terms (e.g. 'Virtual Reality')",
          "An exaggeration for emphasis",
          "A subtle hint about future events"
        ],
        answer: 1,
        explanation: "An oxymoron combines contradictory words, such as 'Virtual Reality' or 'Deafening silence'."
      },
      {
        id: 321,
        category: "Verbal",
        question: "Choose the antonym for 'EQUIVOCAL':",
        options: ["Unambiguous", "Vague", "Dubious", "Evasive"],
        answer: 0,
        explanation: "Equivocal means open to more than one interpretation; ambiguous. Its antonym is Unambiguous."
      },
      {
        id: 322,
        category: "Verbal",
        question: "Which word means 'A state of temporary disuse or suspension'?",
        options: ["Abeyance", "Absolution", "Abstinence", "Aberration"],
        answer: 0,
        explanation: "Abeyance is a state of temporary disuse or dormant suspension."
      },
      {
        id: 323,
        category: "Verbal",
        question: "Complete sentence: 'Quantum mechanics presents a paradigm shift so profound that it _______ classical physics.'",
        options: ["subverts", "validates", "replaces entirely", "corroborates"],
        answer: 0,
        explanation: "Subverts means to undermine or challenge established principles."
      },

      // TECHNICAL (24-30)
      {
        id: 324,
        category: "Technical",
        question: "GOOGLE DEEPMIND: In Deep Reinforcement Learning (e.g. AlphaGo, AlphaZero), what algorithm is used to search decision trees using neural policy/value network evaluations?",
        options: [
          "Monte Carlo Tree Search (MCTS)",
          "Breadth-First Search (BFS)",
          "A* Search",
          "Genetic Algorithm"
        ],
        answer: 0,
        explanation: "AlphaGo and AlphaZero combine Monte Carlo Tree Search (MCTS) with Deep Neural Networks."
      },
      {
        id: 325,
        category: "Technical",
        question: "GOOGLE INFRASTRUCTURE: What is Google's global distributed relational database that provides External Consistency and synchronous replication across continents using Atomic Clocks?",
        options: ["Bigtable", "Google Cloud Spanner", "Memcached", "Kubernetes"],
        answer: 1,
        explanation: "Google Cloud Spanner uses TrueTime (GPS + Atomic Clocks) to provide globally-distributed ACID transactions."
      },
      {
        id: 326,
        category: "Technical",
        question: "In Quantum Computing, what is a Qubit's ability to exist in a linear combination of |0⟩ and |1⟩ states simultaneously called?",
        options: ["Quantum Entanglement", "Superposition", "Quantum Tunneling", "Decoherence"],
        answer: 1,
        explanation: "Superposition allows a qubit to exist in a linear combination of basis states simultaneously."
      },
      {
        id: 327,
        category: "Technical",
        question: "What is the P vs NP problem primarily concerned with?",
        options: [
          "Whether every problem whose solution can be verified quickly can also be solved quickly",
          "Whether quantum computers can break RSA encryption",
          "Whether neural networks can achieve general intelligence",
          "Whether parallel computing reduces memory overhead"
        ],
        answer: 0,
        explanation: "P vs NP asks if polynomial-time verifiable problems (NP) can also be solved in polynomial time (P)."
      },
      {
        id: 328,
        category: "Technical",
        question: "GOOGLE SYSTEMS: What open-source container orchestration platform was originally designed by Google based on their internal Borg cluster management system?",
        options: ["Kubernetes", "Docker Swarm", "Apache Mesos", "Nomad"],
        answer: 0,
        explanation: "Kubernetes was developed by Google based on experience from their internal Borg system."
      },
      {
        id: 329,
        category: "Technical",
        question: "GOOGLE TENSORFLOW: What activation function (introduced by Google in 2017) is defined as x * sigmoid(1.702 * x) or x * σ(x)?",
        options: ["Swish / SiLU", "ReLU", "Leaky ReLU", "ELU"],
        answer: 0,
        explanation: "Swish (x * sigmoid(x)) was discovered by Google researchers and often outperforms ReLU in deep networks."
      },
      {
        id: 330,
        category: "Technical",
        question: "Which cryptographic algorithm forms the basis of asymmetric public-key key exchange using elliptic curves?",
        options: ["ECDSA / ECDH", "AES-256", "MD5", "Blowfish"],
        answer: 0,
        explanation: "ECDH (Elliptic-Curve Diffie-Hellman) enables secure key exchange using elliptic curve cryptography."
      },
    ]
  }
];
