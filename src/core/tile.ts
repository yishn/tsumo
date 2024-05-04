export enum TileSuit {
  Bamboo = "bamboo",
  Myriad = "myriad",
  Circle = "circle",
  Wind = "wind",
  Dragon = "dragon",
}

export class Tile {
  constructor(
    public suit: TileSuit,
    public rank: number
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
}
