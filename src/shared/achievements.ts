import type { PlayerStatisticsData } from "../core/player";

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
  Victor = "victor",
}

export interface AchievementData {
  name: string;
  poem: string;
  priority: number;
  value: (statistics: PlayerStatisticsData) => number;
}

const achievementData: Record<Achievement, AchievementData> = {
  [Achievement.Daring]: {
    name: "Daring",
    poem: "Dealer’s hand with skill and might\nDaring wins, a soaring flight",
    priority: 8,
    value: (statistics) => statistics.dealerWins,
  },
  [Achievement.Believer]: {
    name: "Believer",
    poem: "Through faith, drew the winning tile\nDestined to be on your side",
    priority: 5,
    value: (statistics) => statistics.selfDrawWins,
  },
  [Achievement.Bold]: {
    name: "Bold",
    poem: "Pongs and kongs make sets so bold\nMaster of tiles, power shown",
    priority: 4,
    value: (statistics) => statistics.pongs + statistics.kongs,
  },
  [Achievement.Careless]: {
    name: "Careless",
    poem: "Careless play, the bomb you set\nLosses few, much to regret",
    priority: 1,
    value: (statistics) => statistics.detonatorCount,
  },
  [Achievement.Divine]: {
    name: "Divine",
    poem: "Divine hand, aligned just right\nA win blessed by sacred light",
    priority: 9,
    value: (statistics) => statistics.specialHandWins,
  },
  [Achievement.Glorious]: {
    name: "Glorious",
    poem: "Glorious fights, your wins stand tall\nBrave champion, you conquer all",
    priority: 8,
    value: (statistics) => statistics.wins,
  },
  [Achievement.Lucky]: {
    name: "Lucky",
    poem: "Jokers abound, fortune true\nLucky draws, the game’s for you",
    priority: 6,
    value: (statistics) => statistics.jokers,
  },
  [Achievement.Thief]: {
    name: "Thief",
    poem: "Thief in night, tiles in your grip\nStole discards, one fruitful trip",
    priority: 4,
    value: (statistics) => statistics.stolenDiscards,
  },
  [Achievement.Charlatan]: {
    name: "Charlatan",
    poem: "What a call, claim win in vain\nSlip of the tongue, no win gained",
    priority: 1,
    value: (statistics) => statistics.falseWins,
  },
  [Achievement.Tyrant]: {
    name: "Tyrant",
    poem: "Tyrant of tiles, reign supreme\nRule with jokers, winner’s dream",
    priority: 5,
    value: (statistics) => statistics.overlordCount,
  },
  [Achievement.Hungry]: {
    name: "Hungry",
    poem: "Hungry for tiles, dined with glee\nClaimed discards in gluttony",
    priority: 4,
    value: (statistics) => statistics.eats,
  },
  [Achievement.Overthinker]: {
    name: "Overthinker",
    poem: "Overthinker, deep in thought\nLost in tiles, the win you sought",
    priority: 1,
    value: (statistics) => statistics.thinkingTime,
  },
  [Achievement.Victor]: {
    name: "Victor",
    poem: "Wealthy in coins, fortune bright\nSkillful victor, crowned in light",
    priority: 10,
    value: (statistics) => statistics.score,
  },
};

export function getAchievementData(achievement: Achievement): AchievementData {
  return achievementData[achievement];
}

export function getAchievementImageUrl(achievement: Achievement): string {
  return `./assets/img/achievements/${achievement}.png`;
}

export function distributeAchievements(
  playerStatistics: PlayerStatisticsData[]
): (Achievement | null)[] {
  if (playerStatistics.length === 0) return [];

  const achievementMap = new Map<PlayerStatisticsData, Achievement>();
  const remainingAchievements = new Set<Achievement>(
    Object.keys(achievementData) as Achievement[]
  );

  // Determine victor

  const victor = playerStatistics.reduce((prev, current) =>
    prev.score > current.score ? prev : current
  );

  achievementMap.set(victor, Achievement.Victor);
  remainingAchievements.delete(Achievement.Victor);

  // Distribute other achievements

  while (
    achievementMap.size < playerStatistics.length &&
    remainingAchievements.size > 0
  ) {
    const achievementBestDeviations = new Map<
      Achievement,
      [PlayerStatisticsData, number]
    >(
      [...remainingAchievements].map((achievement) => {
        const values = playerStatistics
          .map(
            (statistics) =>
              [
                statistics,
                getAchievementData(achievement).value(statistics),
              ] as const
          )
          .sort(([, a], [, b]) => b - a);
        const [bestPlayer, bestValue] = values[0];

        return [
          achievement,
          [
            bestPlayer,
            values[1] == null || (bestValue === 0 && values[1][1] === 0)
              ? 1
              : bestValue / values[1][1],
          ],
        ];
      })
    );

    const [achievement, [bestPlayer, bestDeviation]] = [
      ...achievementBestDeviations,
    ].reduce((prev, current) => (current[1][1] > prev[1][1] ? current : prev));

    if (
      bestDeviation > 1 &&
      (!achievementMap.has(bestPlayer) ||
        getAchievementData(achievementMap.get(bestPlayer)!).priority <
          getAchievementData(achievement).priority)
    ) {
      achievementMap.set(bestPlayer, achievement);
    }
    remainingAchievements.delete(achievement);
  }

  return playerStatistics.map(
    (statistics) => achievementMap.get(statistics) ?? null
  );
}
