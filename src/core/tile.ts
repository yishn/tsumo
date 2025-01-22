export enum TileSuit {
  Bamboo = "bamboo",
  Myriad = "myriad",
  Circle = "circle",
  Wind = "wind",
  Dragon = "dragon",
}

export namespace TileSuit {
  export function list(): TileSuit[] {
    return [
      TileSuit.Bamboo,
      TileSuit.Myriad,
      TileSuit.Circle,
      TileSuit.Wind,
      TileSuit.Dragon,
    ];
  }

  export function isHonor(suit: TileSuit): boolean {
    return suit === TileSuit.Wind || suit === TileSuit.Dragon;
  }

  export function isNumeric(suit: TileSuit): boolean {
    return !isHonor(suit);
  }
}

export interface SetsPairs {
  sets: Tile[][];
  pairs: Tile[][];
}

export class Tile implements ITile {
  static compare(a: Tile, b: Tile): number {
    if (a.numeric !== b.numeric) {
      return a.numeric ? -1 : 1;
    } else if (a.suit !== b.suit) {
      return a.suit < b.suit ? -1 : 1;
    }

    return a.rank - b.rank;
  }

  static equal(a: ITile, b: ITile): boolean {
    return a.suit === b.suit && a.rank === b.rank;
  }

  static isSet(a: Tile, b: Tile, c: Tile): boolean {
    if (Tile.equal(a, b) && Tile.equal(b, c)) return true;
    if (a.suit !== b.suit || b.suit !== c.suit) return false;

    const ranks = [a.rank, b.rank, c.rank].sort();
    if (a.honor) return new Set(ranks).size === 3;

    return ranks[0] + 1 === ranks[1] && ranks[1] + 1 === ranks[2];
  }

  static isPongKong(a: Tile, b: Tile, c: Tile, d?: Tile): boolean {
    return (
      Tile.equal(a, b) && Tile.equal(b, c) && (d == null || Tile.equal(c, d))
    );
  }

  static isAlmostSet(a: Tile, b: Tile): boolean {
    if (Tile.equal(a, b)) return true;
    if (a.suit !== b.suit) return false;
    if (a.honor) return true;

    return Math.abs(a.rank - b.rank) <= 2;
  }

  static completeToSet(a: Tile, b?: Tile): Tile[][] {
    if (b == null) {
      return (
        a.numeric || a.suit === TileSuit.Wind
          ? [
              [0, 0],
              [-2, -1],
              [-1, 1],
              [1, 2],
            ]
          : a.suit === TileSuit.Dragon
            ? [
                [0, 0],
                [1, 2],
              ]
            : []
      )
        .map((deltas) =>
          deltas.map(
            (delta) =>
              new Tile(
                a.suit,
                a.numeric
                  ? a.rank + delta
                  : a.suit === TileSuit.Wind
                    ? ((a.rank - 1 + delta + 4) % 4) + 1
                    : a.suit === TileSuit.Dragon
                      ? ((a.rank - 1 + delta + 3) % 3) + 1
                      : 0
              )
          )
        )
        .filter((tiles) => tiles.every((tile) => tile.valid));
    } else {
      if (Tile.equal(a, b)) return [[a]];
      if (a.suit !== b.suit) return [];

      if (a.numeric) {
        const low = Math.min(a.rank, b.rank);
        const high = Math.max(a.rank, b.rank);

        if (low + 1 === high) {
          return [
            low > 1 ? new Tile(a.suit, low - 1) : null,
            high < 9 ? new Tile(a.suit, high + 1) : null,
          ]
            .filter((tile) => tile != null)
            .map((tile) => [tile]);
        } else if (low + 2 === high) {
          return [[new Tile(a.suit, low + 1)]];
        }
      } else if (a.honor) {
        return (a.suit === TileSuit.Wind ? [1, 2, 3, 4] : [1, 2, 3])
          .filter((rank) => rank !== a.rank && rank !== b.rank)
          .map((rank) => [new Tile(a.suit, rank)]);
      }
    }

    return [];
  }

  static isClustered(a: Tile, b: Tile): boolean {
    return a.numeric ? Tile.isAlmostSet(a, b) : Tile.equal(a, b);
  }

  static isChaotic(tiles: Tile[]): boolean {
    const honorTiles = tiles.filter((tile) => tile.honor).sort(Tile.compare);

    for (let i = 1; i < honorTiles.length; i++) {
      if (Tile.equal(honorTiles[i], honorTiles[i - 1])) return false;
    }

    const numericTiles = tiles
      .filter((tile) => tile.numeric)
      .sort(Tile.compare);

    for (let i = 1; i < numericTiles.length; i++) {
      if (Tile.isAlmostSet(numericTiles[i - 1], numericTiles[i])) {
        return false;
      }
    }

    return true;
  }

  static formSetsPairs(tiles: Tile[], jokers: number): SetsPairs[] {
    if (tiles.length + jokers <= 1) {
      return [
        {
          sets: [],
          pairs: [],
        },
      ];
    }

    const result: SetsPairs[] = [];
    const pivot = tiles[0];

    for (let i = 1; i < tiles.length; i++) {
      for (let j = i + 1; j < tiles.length; j++) {
        if (Tile.isSet(pivot, tiles[i], tiles[j])) {
          const subresult = Tile.formSetsPairs(
            tiles.filter((_, index) => ![0, i, j].includes(index)),
            jokers
          );

          result.push(
            ...subresult.map(({ sets, pairs }) => ({
              sets: (sets.unshift([pivot, tiles[i], tiles[j]]), sets),
              pairs,
            }))
          );
        }
      }

      const residue = tiles.filter((_, index) => ![0, i].includes(index));

      if (Tile.equal(pivot, tiles[i])) {
        const subresult = Tile.formSetsPairs(residue, jokers);

        result.push(
          ...subresult.map(({ sets, pairs }) => ({
            sets,
            pairs: (pairs.unshift([pivot, tiles[i]]), pairs),
          }))
        );
      }

      if (Tile.isAlmostSet(pivot, tiles[i]) && jokers >= 1) {
        const subresult = Tile.formSetsPairs(residue, jokers - 1);

        result.push(
          ...subresult.map(({ sets, pairs }) => ({
            sets: (sets.unshift([pivot, tiles[i]]), sets),
            pairs,
          }))
        );
      }
    }

    const residue = tiles.slice(1);

    if (jokers >= 2) {
      const subresult = Tile.formSetsPairs(residue, jokers - 2);

      result.push(
        ...subresult.map(({ sets, pairs }) =>
          pivot != null
            ? {
                sets: (sets.unshift([pivot]), sets),
                pairs,
              }
            : {
                sets,
                pairs: (pairs.unshift([]), pairs),
              }
        )
      );
    }

    if (pivot != null && jokers >= 1) {
      const subresult = Tile.formSetsPairs(residue, jokers - 1);

      result.push(
        ...subresult.map(({ sets, pairs }) => ({
          sets,
          pairs: (pairs.unshift([pivot]), pairs),
        }))
      );
    }

    return result;
  }

  static isWinningHand(
    tiles: Tile[],
    jokers: ITile[],
    melds: number
  ): SetsPairs | "chaotic" | undefined {
    const nonJokers = tiles.filter(
      (tile) => !jokers.some((joker) => Tile.equal(joker, tile))
    );

    if (tiles.length === 14 && Tile.isChaotic(nonJokers)) {
      // Chaotic thirteen
      return "chaotic";
    } else {
      const jokerCount = tiles.length - nonJokers.length;
      const setsPairs = Tile.formSetsPairs(nonJokers, jokerCount);

      return setsPairs.find(
        ({ sets, pairs }) =>
          // Seven pairs
          pairs.length === 7 ||
          // Four sets and one pair
          (sets.length + melds === 4 && pairs.length >= 1)
      );
    }
  }

  static fromString(tile: string): Tile {
    const suit = TileSuit.list().find((value) =>
      value.startsWith(tile[0].toLowerCase())
    );
    const rank = parseInt(tile.slice(1), 10);

    if (suit == null) {
      throw new Error("Invalid tile");
    }

    return new Tile(suit, rank);
  }

  constructor(
    public readonly suit: TileSuit,
    public readonly rank: number
  ) {}

  get valid(): boolean {
    return !(
      this.rank <= 0 ||
      this.rank > 9 ||
      (this.suit === TileSuit.Wind && this.rank > 4) ||
      (this.suit === TileSuit.Dragon && this.rank > 3)
    );
  }

  get honor(): boolean {
    return TileSuit.isHonor(this.suit);
  }

  get numeric(): boolean {
    return TileSuit.isNumeric(this.suit);
  }

  nextTile(): Tile | undefined {
    if (this.honor) return this.nextWrappingTile();
    if (this.rank < 9) return this.nextWrappingTile();
  }

  nextWrappingTile(): Tile {
    const suitRanks =
      this.suit === TileSuit.Wind ? 4 : this.suit === TileSuit.Dragon ? 3 : 9;

    return new Tile(this.suit, this.rank === suitRanks ? 1 : this.rank + 1);
  }

  static fromJSON(tile: ITile): Tile {
    return new Tile(tile.suit, tile.rank);
  }

  toJSON(): ITile {
    return {
      suit: this.suit,
      rank: this.rank,
    };
  }

  valueOf(): string {
    return `${this.suit[0]}${this.rank}`;
  }

  toString(): string {
    return this.valueOf();
  }
}

export interface ITile {
  suit: TileSuit;
  rank: number;
}
