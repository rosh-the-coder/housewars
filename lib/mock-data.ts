export type HouseName = "Red" | "Blue" | "Green" | "Yellow";

export type House = {
  name: HouseName;
  color: string;
  points: number;
  members: number;
};

export type User = {
  id: string;
  name: string;
  house: HouseName;
  level: number;
  totalPoints: number;
};

export type Game = {
  id: string;
  slug: string;
  title: string;
  genre: string;
  mode: "SCORED" | "TIMED";
  description: string;
  embedUrl: string;
  thumbnail: string;
  difficulty: "Easy" | "Medium" | "Hard";
};

export type Challenge = {
  id: string;
  title: string;
  rewardPoints: number;
  status: "Open" | "In Progress" | "Completed";
};

export const houseColors: Record<HouseName, string> = {
  Red: "#DC2626",
  Blue: "#2563EB",
  Green: "#16A34A",
  Yellow: "#CA8A04",
};

export const houses: House[] = [
  { name: "Red", color: houseColors.Red, points: 19320, members: 128 },
  { name: "Blue", color: houseColors.Blue, points: 18740, members: 132 },
  { name: "Green", color: houseColors.Green, points: 17610, members: 121 },
  { name: "Yellow", color: houseColors.Yellow, points: 16890, members: 117 },
];

export const users: User[] = [
  { id: "u1", name: "Aria Stone", house: "Red", level: 14, totalPoints: 2890 },
  { id: "u2", name: "Kai Mercer", house: "Blue", level: 13, totalPoints: 2710 },
  { id: "u3", name: "Nina Vale", house: "Green", level: 12, totalPoints: 2525 },
  { id: "u4", name: "Leo Park", house: "Yellow", level: 10, totalPoints: 2180 },
];

export const games: Game[] = [
  {
    id: "g1",
    slug: "word-clash",
    title: "Word Clash",
    genre: "Arcade",
    mode: "SCORED",
    description: "Dodge asteroids and survive as long as possible.",
    embedUrl: "https://html5.gamedistribution.com/game.html?gameId=word-clash-demo",
    thumbnail:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80",
    difficulty: "Medium",
  },
  {
    id: "g2",
    slug: "math-blitz",
    title: "Math Blitz",
    genre: "Endless Runner",
    mode: "TIMED",
    description: "Dash through neon lanes and stack multipliers.",
    embedUrl: "https://html5.gamedistribution.com/game.html?gameId=math-blitz-demo",
    thumbnail:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80",
    difficulty: "Medium",
  },
  {
    id: "g3",
    slug: "trivia-siege",
    title: "Trivia Siege",
    genre: "Strategy",
    mode: "SCORED",
    description: "Capture towers before the countdown ends.",
    embedUrl: "https://html5.gamedistribution.com/game.html?gameId=trivia-siege-demo",
    thumbnail:
      "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=1200&q=80",
    difficulty: "Hard",
  },
  {
    id: "g4",
    slug: "speed-type",
    title: "Speed Type",
    genre: "Typing",
    mode: "TIMED",
    description: "Type phrases quickly and accurately to combo points.",
    embedUrl: "https://html5.gamedistribution.com/game.html?gameId=speed-type-demo",
    thumbnail:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
    difficulty: "Easy",
  },
  {
    id: "g5",
    slug: "code-break",
    title: "Code Break",
    genre: "Puzzle",
    mode: "SCORED",
    description: "Crack coded sequences before your opponents do.",
    embedUrl: "https://html5.gamedistribution.com/game.html?gameId=code-break-demo",
    thumbnail:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&q=80",
    difficulty: "Hard",
  },
  {
    id: "g6",
    slug: "memory-grid",
    title: "Memory Grid",
    genre: "Memory",
    mode: "TIMED",
    description: "Memorize card layouts and clear the grid.",
    embedUrl: "https://html5.gamedistribution.com/game.html?gameId=memory-grid-demo",
    thumbnail:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80",
    difficulty: "Medium",
  },
  {
    id: "g7",
    slug: "puzzle-rush",
    title: "Puzzle Rush",
    genre: "Puzzle",
    mode: "SCORED",
    description: "Solve puzzle chains in rapid rounds for max score.",
    embedUrl: "https://html5.gamedistribution.com/game.html?gameId=puzzle-rush-demo",
    thumbnail:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
    difficulty: "Hard",
  },
  {
    id: "g8",
    slug: "reflex-test",
    title: "Reflex Test",
    genre: "Arcade",
    mode: "TIMED",
    description: "React instantly to beat moving targets and timers.",
    embedUrl: "https://html5.gamedistribution.com/game.html?gameId=reflex-test-demo",
    thumbnail:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&q=80",
    difficulty: "Easy",
  },
];

export const challenges: Challenge[] = [
  {
    id: "c1",
    title: "Play 3 games in one session",
    rewardPoints: 300,
    status: "Open",
  },
  {
    id: "c2",
    title: "Score 2,000+ in Asteroid Rush",
    rewardPoints: 500,
    status: "In Progress",
  },
  {
    id: "c3",
    title: "Invite a friend to HouseWars",
    rewardPoints: 200,
    status: "Completed",
  },
];
