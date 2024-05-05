import { Tile } from "./tile";

export class Player {
  tiles: Tile[] = [];
  discards: Tile[] = [];
  melds: Tile[][] = [];
  score: number = 0;

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
}
