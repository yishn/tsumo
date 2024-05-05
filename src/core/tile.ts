export enum TileSuit {
  Bamboo = "bamboo",
  Myriad = "myriad",
  Circle = "circle",
  Wind = "wind",
  Dragon = "dragon",
}

export class Tile {
  static sort(a: Tile, b: Tile): number {
    if (a.numeric !== b.numeric) {
      return a.numeric ? -1 : 1;
    } else if (a.suit !== b.suit) {
      return a.suit < b.suit ? -1 : 1;
    }

    return a.rank - b.rank;
  }

  static equal(a: Tile, b: Tile): boolean {
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

  static countSetsPairs(
    tiles: Tile[]
  ): [sets: number, pairs: number, others: Tile[]] {
    if (tiles.length === 0) return [0, 0, []];

    const sortedTiles = [...tiles].sort(Tile.sort);

    if (Tile.isSet(tiles[0], tiles[1], tiles[2])) {
      const [sets, pairs, others] = Tile.countSetsPairs(sortedTiles.slice(3));
      return [sets + 1, pairs, others];
    } else if (Tile.equal(tiles[0], tiles[1])) {
      const [sets, pairs, others] = Tile.countSetsPairs(sortedTiles.slice(2));
      return [sets, pairs + 1, others];
    }

    const [sets, pairs, others] = Tile.countSetsPairs(sortedTiles.slice(1));
    others.push(sortedTiles[0]);
    return [sets, pairs, others];
  }

  static formSetsPairs(
    tiles: Tile[],
    jokers: number
  ): [sets: number, pairs: number][] {
    if (tiles.length === 0) return [[0, 0]];
    if (jokers <= 0) return [[0, 0]];

    const result: [sets: number, pairs: number][] = [];

    if (Tile.isAlmostSet(tiles[0], tiles[1])) {
      result.push(
        ...Tile.formSetsPairs(tiles.slice(2), jokers - 1).map<[number, number]>(
          ([sets, pairs]) => [sets + 1, pairs]
        )
      );
    }

    result.push(
      ...Tile.formSetsPairs(tiles.slice(1), jokers - 1).map<[number, number]>(
        ([sets, pairs]) => [sets, pairs + 1]
      )
    );

    result.push(...Tile.formSetsPairs(tiles.slice(1), jokers));

    return result;
  }

  static isChaotic(tiles: Tile[]): boolean {
    const honorTiles = tiles.filter((tile) => tile.honor).sort(Tile.sort);

    for (let i = 1; i < honorTiles.length; i++) {
      if (Tile.equal(honorTiles[i], honorTiles[i - 1])) return false;
    }

    const numericTiles = tiles.filter((tile) => tile.numeric).sort(Tile.sort);

    for (let i = 1; i < numericTiles.length - 1; i++) {
      if (
        numericTiles[i].suit === numericTiles[i - 1].suit &&
        numericTiles[i].rank - numericTiles[i - 1].rank < 3
      ) {
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
}
