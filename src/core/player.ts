import { Tile } from "./tile.ts";

export class Player {
  tiles: Tile[] = [];
  lastDrawnTileIndex?: number;
  discards: Tile[] = [];
  melds: Tile[][] = [];
  order: [type: "discard" | "meld", index: number][] = [];
  score: number = 50;

  getTile(index: number): Tile {
    const tile = this.tiles[index];
    if (tile == null) throw new Error("Invalid tile");
    return tile;
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
    this.melds.push(meld);
    this.order.push(["meld", this.melds.length - 1]);
  }
}
