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

  removeTile(index: number): Tile {
    const tile = this.getTile(index);
    this.tiles.splice(index, 1);
    return tile;
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
