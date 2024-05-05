import { Player } from "./player.ts";
import { Tile, TileSuit } from "./tile.ts";

function generateFullDeck(): Tile[] {
  return [
    TileSuit.Bamboo,
    TileSuit.Circle,
    TileSuit.Myriad,
    TileSuit.Wind,
    TileSuit.Dragon,
  ].flatMap((suit) =>
    [
      ...Array(suit === TileSuit.Wind ? 4 : suit === TileSuit.Dragon ? 3 : 9),
    ].flatMap((_, i) => [...Array(4)].map(() => new Tile(suit, i + 1)))
  );
}

function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

export class GameState {
  deck: Tile[] = shuffleArray(generateFullDeck());
  players: Player[] = [...Array(4)].map(() => new Player([]));
  currentPlayerIndex: number = 0;
  dealerIndex: number = 0;

  constructor() {
    for (const player of this.players) {
      for (let i = 0; i < 13; i++) {
        player.tiles.push(this.popTile()!);
      }
    }
  }

  get currentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
  }

  popTile(): Tile | undefined {
    return this.deck.pop();
  }

  shiftTile(): Tile | undefined {
    return this.deck.shift();
  }

  nextPlayer(): this {
    this.currentPlayerIndex =
      (this.currentPlayerIndex + 1) % this.players.length;
    return this;
  }
}
