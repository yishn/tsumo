import { Player } from "./player.ts";
import { Tile, TileSuit } from "./tile.ts";

function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

export function generateShuffledFullDeck(): Tile[] {
  return shuffleArray(
    [
      TileSuit.Bamboo,
      TileSuit.Circle,
      TileSuit.Myriad,
      TileSuit.Wind,
      TileSuit.Dragon,
    ].flatMap((suit) =>
      [
        ...Array(suit === TileSuit.Wind ? 4 : suit === TileSuit.Dragon ? 3 : 9),
      ].flatMap((_, i) => [...Array(4)].map(() => new Tile(suit, i + 1)))
    )
  );
}

export enum Phase {
  Deal,
  Action,
  EndAction,
  Reaction,
  Score,
}

export function PhaseBase(name: Phase) {
  return class _PhaseBase {
    name: Phase = name;

    constructor(public state: GameState) {}

    nextPhase<P extends _PhaseBase>(
      phase: new (state: GameState) => P
    ): GameState<P> {
      this.state.phase = new phase(this.state);
      return this.state;
    }
  };
}

export type PhaseBase = InstanceType<ReturnType<typeof PhaseBase>>;

export class DealPhase extends PhaseBase(Phase.Deal) {
  deal(): GameState<ActionPhase> {
    this.state.drawPile = generateShuffledFullDeck();
    this.state.primaryJoker = this.state.popDeck()!;

    for (const player of this.state.players) {
      player.tiles = [];

      for (let i = 0; i < 13; i++) {
        player.tiles.push(this.state.popDeck()!);
      }
    }

    return this.nextPhase(ActionPhase);
  }
}

export class ActionPhase extends PhaseBase(Phase.Action) {
  draw(): GameState<EndActionPhase> {
    const player = this.state.currentPlayer;
    const tile = this.state.popDeck();
    if (tile == null) {
      // TODO
      throw new Error("not implemented");
    }

    player.tiles.push(tile);

    return this.nextPhase(EndActionPhase);
  }

  eat(tileIndex1: number, tileIndex2: number): GameState<EndActionPhase> {
    const player = this.state.currentPlayer;
    const lastDiscard = this.state.lastDiscard;
    if (lastDiscard == null) throw new Error("No discard");

    const tile1 = player.getTile(tileIndex1);
    const tile2 = player.getTile(tileIndex2);
    if (!Tile.isSet(tile1, tile2, lastDiscard)) throw new Error("Invalid eat");

    player.removeTile(tileIndex1);
    player.removeTile(tileIndex2);
    this.state.removeLastDiscard();

    player.melds.push([tile1, tile2, lastDiscard]);

    return this.nextPhase(EndActionPhase);
  }

  kong(
    tileIndex1: number,
    tileIndex2: number,
    tileIndex3: number
  ): GameState<EndActionPhase> {
    return new ReactionPhase(this.state).pongKong(
      this.state.currentPlayerIndex,
      tileIndex1,
      tileIndex2,
      tileIndex3
    );
  }

  win(): GameState<ScorePhase> {
    return new ReactionPhase(this.state).win(this.state.currentPlayerIndex);
  }
}

export class EndActionPhase extends PhaseBase(Phase.EndAction) {
  discard(tileIndex: number): GameState<ReactionPhase> {
    const player = this.state.currentPlayer;
    const tile = player.removeTile(tileIndex);

    player.discards.push(tile);

    return this.nextPhase(ReactionPhase);
  }

  kong(
    tileIndex1: number,
    tileIndex2: number,
    tileIndex3: number,
    tileIndex4: number
  ): GameState<EndActionPhase> {
    const player = this.state.currentPlayer;
    const tile1 = player.getTile(tileIndex1);
    const tile2 = player.getTile(tileIndex2);
    const tile3 = player.getTile(tileIndex3);
    const tile4 = player.getTile(tileIndex4);
    if (
      !Tile.equal(tile1, tile2) ||
      !Tile.equal(tile2, tile3) ||
      !Tile.equal(tile3, tile4)
    )
      throw new Error("Invalid kong");

    player.removeTile(tileIndex1);
    player.removeTile(tileIndex2);
    player.removeTile(tileIndex3);
    player.removeTile(tileIndex4);

    player.melds.push([tile1, tile2, tile3, tile4]);

    // Draw from the bottom of the deck
    const tile = this.state.shiftDeck()!;
    // TODO handle empty deck
    player.tiles.push(tile);

    this.state.scoreKong(this.state.currentPlayerIndex);
    return this.nextPhase(EndActionPhase);
  }

  meldKong(tileIndex: number, meldIndex: number): GameState<EndActionPhase> {
    const player = this.state.currentPlayer;
    const tile = player.getTile(tileIndex);
    const meld = player.melds[meldIndex];
    if (meld == null) throw new Error("Invalid meld");

    if (
      !Tile.equal(tile, meld[0]) ||
      !Tile.equal(meld[0], meld[1]) ||
      !Tile.equal(meld[1], meld[2])
    )
      throw new Error("Invalid kong");

    player.removeTile(tileIndex);
    meld.push(tile);

    // Draw from the bottom of the deck
    const drawnTile = this.state.shiftDeck()!;
    // TODO handle empty deck
    player.tiles.push(drawnTile);

    this.state.scoreKong(this.state.currentPlayerIndex);
    return this.nextPhase(EndActionPhase);
  }

  win(): GameState<ScorePhase> {
    const player = this.state.currentPlayer;
    const win = this.state.isWinningHand(player.tiles, player.melds.length);
    if (!win) throw new Error("Invalid win");

    return this.nextPhase(ScorePhase);
  }
}

export class ReactionPhase extends PhaseBase(Phase.Reaction) {
  pongKong(
    playerIndex: number,
    tileIndex1: number,
    tileIndex2: number,
    tileIndex3?: number
  ): GameState<EndActionPhase> {
    const player = this.state.getPlayer(playerIndex);
    if (this.state.lastDiscard == null) throw new Error("No discard");

    const tile1 = player.getTile(tileIndex1);
    const tile2 = player.getTile(tileIndex2);
    const tile3 = tileIndex3 == null ? undefined : player.getTile(tileIndex3);
    if (!Tile.equal(tile1, tile2) || !Tile.equal(tile1, this.state.lastDiscard))
      throw new Error("Invalid pong");
    if (tile3 != null && !Tile.equal(tile1, tile3))
      throw new Error("Invalid kong");

    player.removeTile(tileIndex1);
    player.removeTile(tileIndex2);
    if (tileIndex3 != null) player.removeTile(tileIndex3);

    const discard = this.state.removeLastDiscard();
    player.melds.push(
      tile3 == null ? [tile1, tile2, discard] : [tile1, tile2, tile3, discard]
    );

    this.state.currentPlayerIndex = playerIndex;

    // Handle kongs
    if (tileIndex3 != null) {
      // Draw from the bottom of the deck
      const tile = this.state.shiftDeck()!;
      // TODO handle empty deck
      player.tiles.push(tile);
      this.state.scoreKong(playerIndex);
    }

    return this.nextPhase(EndActionPhase);
  }

  win(playerIndex: number): GameState<ScorePhase> {
    const player = this.state.getPlayer(playerIndex);
    if (this.state.lastDiscard == null) throw new Error("No discard");

    const win = this.state.isWinningHand(
      [...player.tiles, this.state.lastDiscard],
      player.melds.length
    );
    if (!win) throw new Error("Invalid win");

    this.state.currentPlayerIndex = playerIndex;

    return this.nextPhase(ScorePhase);
  }
}

export class ScorePhase extends PhaseBase(Phase.Score) {
  score(): GameState<DealPhase> {
    const player = this.state.currentPlayer;
    player.score += 1;

    if (player.score === 3) {
      // TODO end game
      throw new Error("not implemented");
    }

    this.state.dealerIndex =
      (this.state.dealerIndex + 1) % this.state.players.length;
    this.state.currentPlayerIndex = this.state.dealerIndex;

    return this.nextPhase(DealPhase);
  }
}

export class GameState<P extends PhaseBase = any> {
  phase: P;
  drawPile: Tile[] = [];
  players: Player[] = [...Array(4)].map(() => new Player());
  currentPlayerIndex: number = 0;
  dealerIndex: number = 0;
  primaryJoker: Tile = new Tile(TileSuit.Bamboo, 1);
  lastDiscardInfo?: [playerIndex: number, discardIndex: number];

  static newGame(): GameState<DealPhase> {
    return new GameState(DealPhase);
  }

  protected constructor(mode: new (state: GameState) => P) {
    this.phase = new mode(this);
  }

  get currentPlayer(): Player {
    return this.getPlayer(this.currentPlayerIndex);
  }

  get dealer(): Player {
    return this.getPlayer(this.dealerIndex);
  }

  get lastDiscard(): Tile | undefined {
    if (this.lastDiscardInfo == null) return;

    const [playerIndex, discardIndex] = this.lastDiscardInfo;
    return this.players[playerIndex].discards[discardIndex];
  }

  get secondaryJoker(): Tile {
    return this.primaryJoker.nextWrappingTile();
  }

  isJoker(tile: Tile): boolean {
    return (
      Tile.equal(tile, this.primaryJoker) ||
      Tile.equal(tile, this.secondaryJoker)
    );
  }

  popDeck(): Tile | undefined {
    return this.drawPile.pop();
  }

  shiftDeck(): Tile | undefined {
    return this.drawPile.shift();
  }

  removeLastDiscard(): Tile {
    if (this.lastDiscardInfo == null) throw new Error("No discard");

    const [playerIndex, discardIndex] = this.lastDiscardInfo;
    delete this.lastDiscardInfo;
    return this.players[playerIndex].discards.splice(discardIndex, 1)[0];
  }

  getPlayer(playerIndex: number): Player {
    const player = this.players[playerIndex];
    if (player == null) throw new Error("Invalid player");
    return player;
  }

  moveToNextPlayer(): this {
    this.currentPlayerIndex =
      (this.currentPlayerIndex + 1) % this.players.length;
    return this;
  }

  moveToNextDealer(): this {
    this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
    return this;
  }

  isWinningHand(tiles: Tile[], melds: number): boolean {
    const lastDiscard = this.lastDiscard;
    if (lastDiscard == null) throw new Error("No discard");

    const nonJokers = tiles.filter((tile) => !this.isJoker(tile));

    let win = false;

    if (tiles.length === 13 && Tile.isChaotic(nonJokers)) {
      // Chaotic thirteen
      win = true;
    } else {
      const jokers = tiles.filter((tile) => this.isJoker(tile)).length;
      const [sets, pairs, others] = Tile.countSetsPairs(nonJokers);

      if (pairs + Math.min(others.length, jokers) === 7) {
        // Seven pairs

        win = true;
      } else {
        // Regular win

        win = Tile.formSetsPairs(others, jokers).some(
          ([formedSets, formedPairs]) =>
            sets + melds + formedSets === 4 && pairs + formedPairs >= 1
        );
      }
    }

    return win;
  }

  scoreKong(playerIndex: number): void {
    for (let i = 0; i < this.players.length; i++) {
      if (i === playerIndex) continue;

      this.getPlayer(i).score -= 2;
      this.getPlayer(playerIndex).score += 2;
    }
  }
}
