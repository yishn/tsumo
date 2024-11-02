import { Tile } from "./tile.ts";

export class PlayerStatistics {
  score = 50;
  pongs = 0;
  kongs = 0;
  eats = 0;
  stolenDiscards = 0;
  wins = 0;
  dealerWins = 0;
  selfDrawnWins = 0;
  specialHandWins = 0;
  falseWins = 0;
  detonatorCount = 0;
  jokers = 0;
  overlordCount = 0;
  thinkingTime = 0;

  private _startThinkingTime: Date | undefined;

  startThinking(): void {
    this._startThinkingTime = new Date();
  }

  stopThinking(): void {
    if (this._startThinkingTime == null) return;

    this.thinkingTime += Date.now() - this._startThinkingTime.getTime();
    this._startThinkingTime = undefined;
  }
}

export class Player {
  tiles: Tile[] = [];
  lastDrawnTileIndex?: number;
  discards: Tile[] = [];
  melds: Tile[][] = [];
  order: [type: "discard" | "meld", index: number][] = [];
  statistics = new PlayerStatistics();

  get score(): number {
    return this.statistics.score;
  }

  set score(value: number) {
    this.statistics.score = value;
  }

  getTile(index: number): Tile {
    const tile = this.tiles[index];
    if (tile == null) throw new Error("Invalid tile");
    return tile;
  }

  getAllTiles(): Tile[] {
    return this.melds
      .flatMap((meld) => meld)
      .concat(this.tiles)
      .concat(this.discards);
  }

  removeTiles(...indices: number[]): Tile[] {
    const result = indices.map((i) => this.getTile(i));
    this.tiles = this.tiles.filter((_, i) => !indices.includes(i));
    return result;
  }

  pushDiscard(tile: Tile): void {
    this.discards.push(tile);
    this.order.push(["discard", this.discards.length - 1]);
  }

  pushMeld(meld: Tile[]): void {
    this.melds.push(meld.sort(Tile.compare));
    this.order.push(["meld", this.melds.length - 1]);
  }
}
