import { Tile } from "./tile";

export class Player {
  discards: Tile[] = [];
  melds: Tile[][] = [];

  constructor(public tiles: Tile[]) {}
}
