export enum Achievement {
  Daring = "daring",
  Believer = "believer",
  Bold = "bold",
  Careless = "careless",
  Divine = "divine",
  Glorious = "glorious",
  Lucky = "lucky",
  Thief = "thief",
  Charlatan = "charlatan",
  Tyrant = "tyrant",
  Hungry = "hungry",
  Overthinker = "overthinker",
  Wealthy = "wealthy",
}

export interface AchievementData {
  name: string;
  poem: string;
}

const achievementData: Record<Achievement, AchievementData> = {
  [Achievement.Daring]: {
    name: "Daring",
    poem: "Dealer’s hand with skill and might\nDaring wins, a soaring flight",
  },
  [Achievement.Believer]: {
    name: "Believer",
    poem: "Through faith, drew the winning tile\nDestined to be on your side",
  },
  [Achievement.Bold]: {
    name: "Bold",
    poem: "Pongs and kongs make sets so bold\nMaster of tiles, power shown",
  },
  [Achievement.Careless]: {
    name: "Careless",
    poem: "Careless play, the bomb you set\nLosses few, much to regret",
  },
  [Achievement.Divine]: {
    name: "Divine",
    poem: "Divine hand, aligned just right\nA win blessed by sacred light",
  },
  [Achievement.Glorious]: {
    name: "Glorious",
    poem: "Glorious fights, your wins stand tall\nBrave champion, you conquer all",
  },
  [Achievement.Lucky]: {
    name: "Lucky",
    poem: "Jokers abound, fortune true\nLucky draws, the game’s for you",
  },
  [Achievement.Thief]: {
    name: "Thief",
    poem: "Thief in night, tiles in your grip\nStole discards, a fruitful trip",
  },
  [Achievement.Charlatan]: {
    name: "Charlatan",
    poem: "What a call, claim win in vain\nSlip of the tongue, no win gained",
  },
  [Achievement.Tyrant]: {
    name: "Tyrant",
    poem: "Tyrant of tiles, reign supreme\nRule with jokers, winner’s dream",
  },
  [Achievement.Hungry]: {
    name: "Hungry",
    poem: "Hungry for tiles, dined with glee\nClaimed discards in gluttony",
  },
  [Achievement.Overthinker]: {
    name: "Overthinker",
    poem: "Overthinker, deep in thought\nLost in tiles, the win you sought",
  },
  [Achievement.Wealthy]: {
    name: "Wealthy",
    poem: "Wealthy in coins, fortune bright\nSkillful victor, crowned in light",
  },
};

export function getAchievementData(achievement: Achievement): AchievementData {
  return achievementData[achievement];
}
