import type { PullPhase, PushPhase } from "./game-state.ts";
import { OtherPlayer } from "./player.ts";
import { ITile, Tile, TileSuit } from "./tile.ts";

const ALL_TILES = TileSuit.list().flatMap((suit) =>
  [...Array(suit === TileSuit.Wind ? 4 : suit === TileSuit.Dragon ? 3 : 9)].map(
    (_, i) => new Tile(suit, i + 1)
  )
);

export class AiGameState {
  unknownTiles: Record<string, number> = {};
  otherPlayers: OtherPlayer[] = [];
  jokers: Tile[] = [];
  discard: Tile | undefined;

  hand: Tile[] = [];
  discards: Tile[] = [];
  melds: Tile[][] = [];
  allDiscards: Tile[] = [];

  constructor() {
    this.unknownTiles = Object.fromEntries(
      TileSuit.list()
        .map((suit) =>
          [
            ...Array(
              suit === TileSuit.Wind ? 4 : suit === TileSuit.Dragon ? 3 : 9
            ),
          ].map((_, i) => new Tile(suit, i + 1))
        )
        .flat()
        .map((tile) => [tile.toString(), 4])
    );
  }

  get nextPlayer(): OtherPlayer | undefined {
    return this.otherPlayers[0];
  }

  get lastPlayer(): OtherPlayer | undefined {
    return this.otherPlayers[this.otherPlayers.length - 1];
  }

  declareKnownTiles(tiles: Tile[]): this {
    for (const tile of tiles) {
      const key = tile.toString();

      if (this.unknownTiles[key] != null) {
        this.unknownTiles[key] = Math.max(this.unknownTiles[key] - 1, 0);
      }
    }

    return this;
  }

  countUnknown(tile: Tile, usedTiles?: Map<string, number>): number {
    if (this.isJoker(tile)) return 0;

    return Math.max(
      0,
      (this.unknownTiles[tile.toString()] ?? 0) -
        (usedTiles?.get(tile.toString()) ?? 0)
    );
  }

  isJoker(tile: ITile): boolean {
    return this.jokers.some((joker) => Tile.equal(joker, tile));
  }
}

export type ClassToAction<T> = {
  [K in keyof T]: T[K] extends (...args: infer P) => any ? [K, ...P] : never;
}[Exclude<keyof T, "nextPhase" | "next">];

export interface Strategy {
  generatePull(state: AiGameState): ClassToAction<PullPhase>;
  generatePush(state: AiGameState): ClassToAction<PushPhase>;
  generateReaction(
    state: AiGameState
  ): "pong" | "kong" | "win" | null | undefined | void;
}

enum PartitionBlockType {
  Pong = "pong",
  Sequence = "sequence",
  Pair = "pair",
  AlmostSequence = "almostSequence",
  Single = "single",
}

type PartitionBlock = Partial<Record<PartitionBlockType, Tile[]>>;

enum PartitionBlockGoal {
  Set = "set",
  Pair = "pair",
  Discard = "discard",
}

const AllTilesPlaceholder = Symbol();
type AllTilesPlaceholder = typeof AllTilesPlaceholder;

interface PartitionBlockStrategy {
  discards: Tile[];
  completion: (Tile | AllTilesPlaceholder)[][];
  missing?: number;
}

function factorial(n: number): number {
  return n <= 1 ? 1 : n * factorial(n - 1);
}

class DefaultStrategy implements Strategy {
  generatePull(state: AiGameState): ClassToAction<PullPhase> {
    throw new Error("Method not implemented.");
  }

  generatePush(state: AiGameState): ClassToAction<PushPhase> {
    throw new Error("Method not implemented.");
  }

  generateReaction(
    state: AiGameState
  ): "pong" | "kong" | "win" | null | undefined | void {
    throw new Error("Method not implemented.");
  }

  private *listPartitions(
    state: AiGameState,
    tiles: Tile[]
  ): Generator<PartitionBlock[]> {
    function* inner(
      this: DefaultStrategy,
      tiles: Tile[]
    ): Generator<PartitionBlock[]> {
      if (tiles.length <= 1) {
        yield* [
          tiles.map((tile) => ({
            [PartitionBlockType.Single]: [tile],
          })),
        ];
      }

      const nonJokers = tiles.filter((tile) => !state.isJoker(tile));
      const jokers = tiles.filter((tile) => state.isJoker(tile));
      const pivot = nonJokers[0];

      let foundSet = false;

      for (let i = 1; i < nonJokers.length; i++) {
        const a = nonJokers[i];

        for (let j = i + 1; j < nonJokers.length; j++) {
          const b = nonJokers[j];

          if (Tile.isSet(pivot, a, b)) {
            foundSet = true;

            const subresult = inner.call(this, [
              ...nonJokers.filter((_, k) => ![0, i, j].includes(k)),
              ...jokers,
            ]);

            for (const partition of subresult) {
              yield [
                ...partition,
                {
                  [Tile.equal(pivot, a)
                    ? PartitionBlockType.Pong
                    : PartitionBlockType.Sequence]: [pivot, a, b],
                },
              ];
            }
          }
        }

        const residue = nonJokers.filter((_, k) => ![0, i].includes(k));

        if (!foundSet && Tile.isAlmostSet(pivot, a)) {
          const subresult = inner.call(this, [...residue, ...jokers]);

          for (const partition of subresult) {
            yield [
              ...partition,
              {
                [Tile.equal(pivot, a)
                  ? PartitionBlockType.Pair
                  : PartitionBlockType.AlmostSequence]: [pivot, a],
              },
            ];
          }

          if (jokers.length >= 1) {
            const subresult = inner.call(this, [
              ...residue,
              ...jokers.slice(1),
            ]);

            for (const partition of subresult) {
              yield [
                ...partition,
                {
                  [Tile.equal(pivot, a)
                    ? PartitionBlockType.Pong
                    : PartitionBlockType.Sequence]: [pivot, a, jokers[0]],
                },
              ];
            }
          }
        }
      }

      const residue = nonJokers.slice(1);

      if (jokers.length >= 2) {
        const subresult = inner.call(this, [...residue, ...jokers.slice(2)]);

        for (const partition of subresult) {
          yield [
            ...partition,
            pivot != null
              ? { [PartitionBlockType.Pong]: [pivot, ...jokers.slice(0, 2)] }
              : { [PartitionBlockType.Pair]: jokers.slice(0, 2) },
          ];
        }
      }

      if (pivot != null && jokers.length >= 1) {
        const subresult = inner.call(this, [...residue, ...jokers.slice(1)]);

        for (const partition of subresult) {
          yield [
            ...partition,
            { [PartitionBlockType.Pair]: [pivot, jokers[0]] },
          ];
        }
      }

      if (residue.length > 0) {
        const subresult = inner.call(this, [...residue, ...jokers]);

        for (const partition of subresult) {
          yield [...partition, { [PartitionBlockType.Single]: [pivot] }];
        }
      }
    }

    function genPartitionHash(partition: PartitionBlock[]) {
      return partition
        .map(
          (block) =>
            Object.keys(block)[0] +
            ":" +
            Object.values(block)[0]
              .map((tile) => tile.toString())
              .join(",")
        )
        .sort()
        .join(";");
    }

    const hashes = new Set<string>();

    for (const partition of inner.call(this, tiles)) {
      const hash = genPartitionHash(partition);
      if (hashes.has(hash)) continue;

      hashes.add(hash);
      yield partition;
    }
  }

  private listAllNonJokers(state: AiGameState): Tile[] {
    return ALL_TILES.filter((tile) => !state.isJoker(tile));
  }

  private completeTilesToSet(
    state: AiGameState,
    a: Tile,
    b?: Tile
  ): (Tile | AllTilesPlaceholder)[][] {
    if (b != null && state.isJoker(a)) {
      if (state.isJoker(b)) {
        return [[AllTilesPlaceholder]];
      }

      return this.completeTilesToSet(state, b, a);
    }

    if (b != null && state.isJoker(b)) {
      return (
        a.numeric
          ? [-2, -1, 0, 1, 2]
          : a.suit === TileSuit.Wind
            ? [0, 1, 2, 3]
            : a.suit === TileSuit.Dragon
              ? [0, 1, 2]
              : []
      )
        .map((delta) => {
          const tile = new Tile(
            a.suit,
            a.numeric
              ? a.rank + delta
              : a.honor
                ? (a.rank + delta) % (a.suit === TileSuit.Wind ? 4 : 3)
                : 0
          );

          return tile.valid ? [tile] : null;
        })
        .filter(
          (tile): tile is [Tile] =>
            tile != null && state.countUnknown(tile[0]) > 0
        );
    }

    return Tile.completeToSet(a, b).filter((completion) =>
      completion.every((tile) => state.countUnknown(tile) > 0)
    );
  }

  private completeTilesToPair(
    state: AiGameState,
    a: Tile
  ): (Tile | AllTilesPlaceholder)[][] {
    if (state.isJoker(a)) {
      return [[AllTilesPlaceholder]];
    }

    return [[a]];
  }

  private *listPartitionGoals(
    partition: PartitionBlock[],
    sets: number,
    pairs: number
  ): Generator<PartitionBlockGoal[]> {
    function* inner(
      this: DefaultStrategy,
      sets: number,
      pairs: number,
      pivotIndex: number,
      hasDiscards: boolean
    ): Generator<PartitionBlockGoal[]> {
      if (pivotIndex < 0) {
        if (sets + pairs === 0) {
          yield [];
        } else if (!hasDiscards) {
          yield Array(sets)
            .fill(PartitionBlockGoal.Set)
            .concat(Array(pairs).fill(PartitionBlockGoal.Pair));
        }
        return;
      }

      const pivot = partition[pivotIndex];

      if (
        sets > 0 &&
        (pivot.pair == null || pairs === 0) &&
        pivot.single == null
      ) {
        for (const strategy of inner.call(
          this,
          sets - 1,
          pairs,
          pivotIndex - 1,
          hasDiscards
        )) {
          strategy.push(PartitionBlockGoal.Set);
          yield strategy;
        }
      }

      if (
        pairs > 0 &&
        (pivot.sequence == null || sets === 0) &&
        pivot.almostSequence == null &&
        pivot.sequence == null
      ) {
        for (const strategy of inner.call(
          this,
          sets,
          pairs - 1,
          pivotIndex - 1,
          hasDiscards
        )) {
          strategy.push(PartitionBlockGoal.Pair);
          yield strategy;
        }
      }

      if (sets + pairs === 0) {
        yield [...Array(pivotIndex + 1)].map((_) => PartitionBlockGoal.Discard);
      } else {
        for (const strategy of inner.call(
          this,
          sets,
          pairs,
          pivotIndex - 1,
          true
        )) {
          strategy.push(PartitionBlockGoal.Discard);
          yield strategy;
        }
      }
    }

    yield* inner.call(this, sets, pairs, partition.length - 1, false);
  }

  private getPartitionBlockStrategy(
    state: AiGameState,
    block: PartitionBlock,
    goal: PartitionBlockGoal
  ): PartitionBlockStrategy | undefined {
    const blockType = Object.keys(block)[0] as PartitionBlockType;
    const blockTiles = block[blockType] as Tile[];

    if (goal === PartitionBlockGoal.Discard) {
      return {
        discards: blockTiles,
        completion: [[]],
      };
    } else if (goal === PartitionBlockGoal.Set) {
      if (blockTiles.length === 3) {
        return {
          discards: [],
          completion: [[]],
        };
      } else if (blockTiles.length === 2) {
        return {
          discards: [],
          completion: this.completeTilesToSet(
            state,
            ...(blockTiles as [Tile, Tile?])
          ),
        };
      }
    } else if (goal === PartitionBlockGoal.Pair) {
      if (blockType === PartitionBlockType.Pair) {
        return {
          discards: [],
          completion: [[]],
        };
      } else if (blockType === PartitionBlockType.Pong) {
        return {
          discards: [blockTiles[0]],
          completion: [[]],
        };
      } else if (blockType === PartitionBlockType.Single) {
        return {
          discards: [],
          completion: this.completeTilesToPair(state, blockTiles[0]),
        };
      }
    }
  }

  private getPartitionStrategy(
    state: AiGameState,
    partition: PartitionBlock[],
    goal: PartitionBlockGoal[]
  ): PartitionBlockStrategy[] | undefined {
    const result = goal.map((goal, i) =>
      partition[i] != null
        ? this.getPartitionBlockStrategy(state, partition[i], goal)
        : ({
            discards: [],
            completion: [[]],
            missing:
              goal === PartitionBlockGoal.Pair
                ? 2
                : goal === PartitionBlockGoal.Set
                  ? 3
                  : 0,
          } satisfies PartitionBlockStrategy)
    );

    if (!result.includes(undefined)) {
      return result as PartitionBlockStrategy[];
    }
  }

  private *listPartitionStrategyCompletions(
    partition: PartitionBlockStrategy[]
  ): Generator<(Tile | AllTilesPlaceholder)[]> {
    function* inner(
      this: DefaultStrategy,
      pivotIndex: number
    ): Generator<(Tile | AllTilesPlaceholder)[]> {
      if (pivotIndex < 0) {
        yield [];
        return;
      }

      const { completion: pivotCompletion } = partition[pivotIndex];
      const residueCompletions = [...inner.call(this, pivotIndex - 1)];

      for (const tiles of pivotCompletion) {
        for (const residueCompletion of residueCompletions) {
          yield [...residueCompletion, ...tiles];
        }
      }
    }

    yield* inner.call(this, partition.length - 1);
  }

  private calculateCompletionProbability(
    state: AiGameState,
    completions: (Tile | AllTilesPlaceholder)[][]
  ): number {
    const tilesCount = this.listAllNonJokers(state)
      .map((tile) => state.countUnknown(tile))
      .reduce((a, b) => a + b, 0);

    return completions
      .map((completion) => {
        const usedTiles = new Map<string, number>();
        const countUnknownTilesAndUse = (tile: Tile) => {
          const key = tile.toString();
          usedTiles.set(key, (usedTiles.get(key) ?? 0) + 1);

          return state.countUnknown(tile, usedTiles);
        };

        return completion
          .map((tile, i) =>
            tile === AllTilesPlaceholder
              ? 1
              : countUnknownTilesAndUse(tile) / (tilesCount - i)
          )
          .reduce((a, b) => a * b, factorial(completion.length));
      })
      .reduce((a, b) => a + b, 0);
  }

  private evaluatePartitionStrategy(
    state: AiGameState,
    strategy: PartitionBlockStrategy[]
  ): {
    best: PartitionBlockStrategy[] | null;
    steps: number;
    probability: number;
  } {
    const steps = strategy
      .map(
        (strategy) =>
          strategy.discards.length +
          (strategy.missing ?? 0) +
          (strategy.completion[0]?.length ?? 0)
      )
      .reduce((a, b) => a + b, 0);

    let bestProbability = 0;
    let bestStrategy = null;

    const probability = this.calculateCompletionProbability(state, [
      ...this.listPartitionStrategyCompletions(strategy),
    ]);

    if (bestStrategy == null || probability > bestProbability) {
      bestStrategy = strategy;
      bestProbability = probability;
    }

    return {
      best: bestStrategy,
      probability: bestProbability,
      steps,
    };
  }

  listBestPartitionStrategies(
    state: AiGameState,
    hand: Tile[],
    sets: number,
    pairs: number
  ): [PartitionBlockStrategy[][], number] {
    function* inner(this: DefaultStrategy): Generator<{
      strategy: PartitionBlockStrategy[];
      steps: number;
      probability: number;
    }> {
      let bestProbability = 0;
      let bestSteps = Infinity;

      for (const partition of this.listPartitions(state, hand)) {
        for (const goal of this.listPartitionGoals(partition, sets, pairs)) {
          const partitionStrategy = this.getPartitionStrategy(
            state,
            partition,
            goal
          );
          if (partitionStrategy == null) continue;

          const { best, steps, probability } = this.evaluatePartitionStrategy(
            state,
            partitionStrategy
          );

          if (best != null) {
            if (steps < bestSteps) {
              bestProbability = 0;
            }

            if (probability >= bestProbability && steps <= bestSteps) {
              yield {
                strategy: best,
                probability,
                steps,
              };
            }
          }

          bestProbability = Math.max(bestProbability, probability);
          bestSteps = Math.min(bestSteps, steps);
        }
      }
    }

    const result = [...inner.call(this)];
    const minSteps = Math.min(...result.map((strategy) => strategy.steps));
    const best = result.filter(
      (entry, _, arr) =>
        entry.steps === minSteps &&
        entry.probability >= arr[arr.length - 1].probability
    );

    return [best.map((entry) => entry.strategy), best[0]?.probability ?? 0];
  }

  private evaluateDiscardProbability(
    state: AiGameState,
    discard: Tile,
    weight?: number
  ): number {
    const historicalIndex = state.allDiscards.findIndex((tile) =>
      Tile.equal(tile, discard)
    );

    if (weight == null) {
      weight =
        historicalIndex < 0 || state.allDiscards.length === 0
          ? 1
          : state.allDiscards.length === 1
            ? 1 - +Tile.equal(state.allDiscards[0], discard)
            : 1 -
              Math.exp(
                (-Math.log(0.5) *
                  (historicalIndex - state.allDiscards.length + 1)) /
                  (state.allDiscards.length - 1)
              );
    }

    return (
      1 -
      weight *
        this.calculateCompletionProbability(
          state,
          this.completeTilesToSet(state, discard)
        )
    );
  }

  private evaluateDiscardStrategyProbability(
    state: AiGameState,
    discards: Tile[]
  ): number {
    const weights = state.allDiscards.map((_, i, arr) =>
      arr.length <= 1
        ? 0
        : 1 -
          Math.exp((-Math.log(0.5) * (i - arr.length + 1)) / (arr.length - 1))
    );

    return discards
      .map((discard) =>
        this.evaluateDiscardProbability(
          state,
          discard,
          weights.find((_, i) => Tile.equal(discard, state.allDiscards[i])) ?? 1
        )
      )
      .reduce((a, b) => a * b, 1);
  }

  getBestDiscard(
    state: AiGameState,
    strategies: PartitionBlockStrategy[][]
  ): Tile | undefined {
    const discardStrategies = strategies.map((strategy) =>
      strategy.flatMap((entry) => entry.discards)
    );

    let bestProbability = 0;
    let bestStrategy: Tile[] | undefined;

    for (const discards of discardStrategies) {
      const probability = this.evaluateDiscardStrategyProbability(
        state,
        discards
      );

      if (bestStrategy == null || probability > bestProbability) {
        bestStrategy = discards;
        bestProbability = probability;
      }
    }

    if (bestStrategy != null) {
      let bestProbability = 0;
      let bestDiscard: Tile | undefined;

      for (const discard of bestStrategy) {
        const probability = this.evaluateDiscardProbability(state, discard);

        if (bestDiscard == null || probability > bestProbability) {
          bestDiscard = discard;
          bestProbability = probability;
        }
      }

      return bestDiscard;
    }
  }
}

const hand = [
  "d2",
  "d2",
  "b6",
  "b7",
  "b9",
  "c2",
  "c8",
  "m1",
  "m3",
  "m4",
  "m7",
  "m9",
  "d3",
].map(Tile.fromString);

const state = new AiGameState().declareKnownTiles(hand);
state.jokers = hand.slice(0, 2);
const strategy = new DefaultStrategy();

state.discards.push(new Tile(TileSuit.Circle, 2));
state.allDiscards.push(new Tile(TileSuit.Circle, 2));

const bestStandardStrategy = strategy.listBestPartitionStrategies(
  state,
  hand,
  4,
  1
);
const bestSevenPairsStrategy = strategy.listBestPartitionStrategies(
  state,
  hand,
  0,
  7
);

console.log(
  JSON.stringify(bestSevenPairsStrategy),
  strategy.getBestDiscard(
    state,
    bestSevenPairsStrategy[1] > bestStandardStrategy[1]
      ? bestSevenPairsStrategy[0]
      : bestStandardStrategy[0]
  )
);

setTimeout(() => {}, 1000000000);
