export enum TileSuit {
  Bamboo = "bamboo",
  Myriad = "myriad",
  Circle = "circle",
  Wind = "wind",
  Dragon = "dragon",
}

export interface SetsPairs {
  sets: Tile[][];
  pairs: Tile[][];
}

export class Tile implements ITile {
  static sort(a: Tile, b: Tile): number {
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

  static isAlmostSet(a: Tile, b: Tile): boolean {
    if (Tile.equal(a, b)) return true;
    if (a.suit !== b.suit) return false;
    if (a.honor) return true;

    return Math.abs(a.rank - b.rank) <= 2;
  }

  static formSetsPairs(tiles: Tile[], jokers: number): SetsPairs[] {
    if (tiles.length + jokers <= 1)
      return [
        {
          sets: [],
          pairs: [],
        },
      ];

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

  static isChaotic(tiles: Tile[]): boolean {
    const honorTiles = tiles.filter((tile) => tile.honor).sort(Tile.sort);

    for (let i = 1; i < honorTiles.length; i++) {
      if (Tile.equal(honorTiles[i], honorTiles[i - 1])) return false;
    }

    const numericTiles = tiles.filter((tile) => tile.numeric).sort(Tile.sort);

    for (let i = 1; i < numericTiles.length - 1; i++) {
      if (Tile.isAlmostSet(numericTiles[i - 1], numericTiles[i])) {
        return false;
      }
    }

    return true;
  }

  constructor(
    public readonly suit: TileSuit,
    public readonly rank: number
  ) {
    if (
      isNaN(rank) ||
      rank <= 0 ||
      rank > 9 ||
      (suit === TileSuit.Wind && rank > 4) ||
      (suit === TileSuit.Dragon && rank > 3)
    ) {
      throw new TypeError("Invalid rank");
    }

    if (!Object.keys(TileSuit).some((key) => key.toLowerCase() === suit)) {
      throw new TypeError("Invalid suit");
    }
  }

  get honor(): boolean {
    return this.suit === TileSuit.Wind || this.suit === TileSuit.Dragon;
  }

  get numeric(): boolean {
    return !this.honor;
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
}

export interface ITile {
  suit: TileSuit;
  rank: number;
}

console.log(
  Tile.formSetsPairs(
    [
      new Tile(TileSuit.Bamboo, 1),
      new Tile(TileSuit.Bamboo, 2),
      new Tile(TileSuit.Bamboo, 3),
      new Tile(TileSuit.Bamboo, 5),
      new Tile(TileSuit.Bamboo, 6),
      new Tile(TileSuit.Bamboo, 7),
      new Tile(TileSuit.Bamboo, 8),
      new Tile(TileSuit.Bamboo, 9),
    ],
    1
  )
);
