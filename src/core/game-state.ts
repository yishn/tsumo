import { Player } from "./player.ts";
import { SetsPairs, Tile, TileSuit } from "./tile.ts";

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

interface AllowPlayerMessageOptions {
  currentPlayerOnly?: boolean;
  verifyPlayerIndex?: number;
}

function allowPlayerMessage(opts: AllowPlayerMessageOptions = {}) {
  return (method: any, context: ClassMethodDecoratorContext<PhaseBase>) => {
    context.addInitializer(function () {
      this.allowPlayerMessageFns.set(context.name as string, opts);
    });
  };
}

export enum Phase {
  Deal = "deal",
  Action = "action",
  EndAction = "endaction",
  Reaction = "reaction",
  Score = "score",
}

export function PhaseBase<N extends Phase>(name: N) {
  return class _PhaseBase implements PhaseBase {
    name: N = name;
    allowPlayerMessageFns: Map<string, AllowPlayerMessageOptions> = new Map();

    constructor(public state: GameState<any>) {}

    nextPhase<P extends PhaseBase>(
      phase: new (state: GameState) => P
    ): GameState<P> {
      this.state.phase = new phase(this.state);
      return this.state;
    }
  };
}

export interface PhaseBase {
  name: Phase;
  allowPlayerMessageFns: Map<string, AllowPlayerMessageOptions>;

  nextPhase<P extends PhaseBase>(
    phase: new (state: GameState) => P
  ): GameState<P>;
}

export class DealPhase extends PhaseBase(Phase.Deal) {
  deal(): GameState<ActionPhase> {
    this.state.drawPile = generateShuffledFullDeck();
    this.state.primaryJoker = this.state.popDrawPile()!;

    for (const [i, player] of this.state.players.entries()) {
      player.tiles = [];

      for (let i = 0; i < 13; i++) {
        player.tiles.push(this.state.popDrawPile()!);
      }

      this.state.sortPlayerTiles(i);
    }

    return this.nextPhase(ActionPhase);
  }
}

export class ActionPhase extends PhaseBase(Phase.Action) {
  @allowPlayerMessage({ currentPlayerOnly: true })
  draw(): GameState<EndActionPhase> {
    const player = this.state.currentPlayer;
    const tile = this.state.popDrawPile();
    if (tile == null) {
      // TODO
      throw new Error("not implemented");
    }

    player.lastDrawnTileIndex = player.tiles.length;
    player.tiles.push(tile);

    this.state.lastDiscardInfo = undefined;

    return this.nextPhase(EndActionPhase);
  }

  @allowPlayerMessage({ currentPlayerOnly: true })
  eat(tileIndex1: number, tileIndex2: number): GameState<EndActionPhase> {
    const player = this.state.currentPlayer;
    const lastDiscard = this.state.lastDiscard;
    if (lastDiscard == null) throw new Error("No discard");

    const tile1 = player.getTile(tileIndex1);
    const tile2 = player.getTile(tileIndex2);
    if (tileIndex1 === tileIndex2 || !Tile.isSet(tile1, tile2, lastDiscard))
      throw new Error("Invalid eat");

    player.removeTiles(tileIndex1, tileIndex2);
    this.state.removeLastDiscard();

    player.pushMeld([tile1, tile2, lastDiscard]);
    player.lastDrawnTileIndex = undefined;

    return this.nextPhase(EndActionPhase);
  }

  @allowPlayerMessage({ currentPlayerOnly: true })
  kong(
    tileIndex1: number,
    tileIndex2: number,
    tileIndex3: number
  ): GameState<ActionPhase> {
    const player = this.state.currentPlayer;
    if (this.state.lastDiscard == null) throw new Error("No discard");

    const tile1 = player.getTile(tileIndex1);
    const tile2 = player.getTile(tileIndex2);
    const tile3 = player.getTile(tileIndex3);
    if (
      [tile1, tile2, tile3].some(
        (tile) => !Tile.equal(tile, this.state.lastDiscard!)
      )
    ) {
      throw new Error("Invalid kong");
    }

    const discard = this.state.removeLastDiscard();
    player.removeTiles(tileIndex1, tileIndex2, tileIndex3);
    player.pushMeld([tile1, tile2, tile3, discard]);

    this.state.scoreKong(this.state.currentPlayerIndex);
    this.state.lastDiscardInfo = undefined;

    return this.nextPhase(ActionPhase);
  }

  @allowPlayerMessage({ currentPlayerOnly: true })
  win(): GameState<ScorePhase> {
    const win = this.state.hasWinningHand(this.state.currentPlayerIndex);
    if (win == null) throw new Error("Invalid win");

    return this.nextPhase(ScorePhase);
  }
}

export class EndActionPhase extends PhaseBase(Phase.EndAction) {
  @allowPlayerMessage({ currentPlayerOnly: true })
  discard(tileIndex: number): GameState<ReactionPhase> {
    const player = this.state.currentPlayer;
    const [tile] = player.removeTiles(tileIndex);

    player.lastDrawnTileIndex = undefined;
    player.pushDiscard(tile);

    this.state.sortPlayerTiles(this.state.currentPlayerIndex);
    this.state.lastDiscardInfo = [
      this.state.currentPlayerIndex,
      player.discards.length - 1,
    ];

    return this.nextPhase(ReactionPhase);
  }

  @allowPlayerMessage({ currentPlayerOnly: true })
  kong(
    tileIndex1: number,
    tileIndex2: number,
    tileIndex3: number,
    tileIndex4: number
  ): GameState<ActionPhase> {
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

    player.removeTiles(tileIndex1, tileIndex2, tileIndex3, tileIndex4);
    player.pushMeld([tile1, tile2, tile3, tile4]);

    this.state.scoreKong(this.state.currentPlayerIndex);
    this.state.lastDiscardInfo = undefined;

    return this.nextPhase(ActionPhase);
  }

  @allowPlayerMessage({ currentPlayerOnly: true })
  meldKong(tileIndex: number, meldIndex: number): GameState<ActionPhase> {
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

    player.removeTiles(tileIndex);
    meld.push(tile);

    this.state.scoreKong(this.state.currentPlayerIndex);
    this.state.lastDiscardInfo = undefined;

    return this.nextPhase(ActionPhase);
  }

  @allowPlayerMessage({ currentPlayerOnly: true })
  win(): GameState<ScorePhase> {
    const win = this.state.hasWinningHand(this.state.currentPlayerIndex);
    if (win == null) throw new Error("Invalid win");

    return this.nextPhase(ScorePhase);
  }
}

export interface Reaction {
  type: "pongKong" | "win";
  playerIndex: number;
  tileIndices: number[];
}

export namespace Reaction {
  export function compare(state: GameState, a: Reaction, b: Reaction): number {
    // Prefer wins
    if (a.type !== b.type) {
      return a.type === "win" ? 1 : -1;
    }

    // Prefer kong over pong
    if (a.type !== "win" && a.tileIndices.length !== b.tileIndices.length) {
      return a.tileIndices.length - b.tileIndices.length;
    }

    // Prefer the player who is closer to the current player
    const nextTurnA =
      a.playerIndex < state.currentPlayerIndex
        ? a.playerIndex + state.players.length
        : a.playerIndex;
    const nextTurnB =
      b.playerIndex < state.currentPlayerIndex
        ? b.playerIndex + state.players.length
        : b.playerIndex;

    return nextTurnB - nextTurnA;
  }
}

export class ReactionPhase extends PhaseBase(Phase.Reaction) {
  reactions: Reaction[] = [];

  private pushReaction(reaction: Reaction): void {
    this.reactions.push(reaction);
    this.reactions.sort((a, b) => Reaction.compare(this.state, a, b));
  }

  @allowPlayerMessage({ verifyPlayerIndex: 0 })
  pongKong(
    playerIndex: number,
    ...tileIndices: number[]
  ): GameState<ReactionPhase> {
    const player = this.state.getPlayer(playerIndex);
    if (this.state.lastDiscard == null) throw new Error("No discard");
    if (
      tileIndices.length < 2 ||
      tileIndices.some(
        (i) =>
          player.tiles[i] == null ||
          !Tile.equal(player.tiles[i], this.state.lastDiscard!)
      )
    ) {
      throw new Error("Invalid tiles");
    }

    this.pushReaction({
      type: "pongKong",
      playerIndex,
      tileIndices,
    });

    return this.state;
  }

  @allowPlayerMessage({ verifyPlayerIndex: 0 })
  win(playerIndex: number): GameState<ReactionPhase> {
    if (this.state.lastDiscard == null) throw new Error("No discard");

    const win = this.state.hasWinningHand(playerIndex);
    if (win == null) throw new Error("Invalid win");

    this.pushReaction({
      type: "win",
      playerIndex,
      tileIndices: [],
    });

    return this.state;
  }

  next(): GameState<ActionPhase | EndActionPhase | ScorePhase> {
    if (this.reactions.length > 0) {
      const {
        type,
        playerIndex,
        tileIndices: [tileIndex1, tileIndex2, tileIndex3],
      } = this.reactions[this.reactions.length - 1];
      const player = this.state.getPlayer(playerIndex);

      if (type === "pongKong") {
        const tile1 = player.getTile(tileIndex1);
        const tile2 = player.getTile(tileIndex2);
        const tile3 =
          tileIndex3 == null ? undefined : player.getTile(tileIndex3);

        player.removeTiles(tileIndex1, tileIndex2, tileIndex3);
        player.lastDrawnTileIndex = undefined;

        const discard = this.state.removeLastDiscard();
        player.pushMeld(
          tile3 == null
            ? [tile1, tile2, discard]
            : [tile1, tile2, tile3, discard]
        );

        this.state.currentPlayerIndex = playerIndex;

        // Handle kongs
        if (tileIndex3 != null) {
          this.state.scoreKong(playerIndex);
          this.state.lastDiscardInfo = undefined;

          return this.nextPhase(ActionPhase);
        }

        return this.nextPhase(EndActionPhase);
      } else if (type === "win") {
        this.state.currentPlayerIndex = playerIndex;

        return this.nextPhase(ScorePhase);
      }
    }

    this.state.moveToNextPlayer();

    return this.nextPhase(ActionPhase);
  }
}

export class ScorePhase extends PhaseBase(Phase.Score) {
  score(): GameState<DealPhase> {
    const winner = this.state.currentPlayer;

    // TODO

    this.state.moveToNextDealer();
    this.state.currentPlayerIndex = this.state.dealerIndex;

    return this.nextPhase(DealPhase);
  }
}

export class GameState<P extends PhaseBase = PhaseBase> {
  phase: P;
  round: number = 1;
  maxRound: number = 4;
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

  popDrawPile(): Tile | undefined {
    return this.drawPile.pop();
  }

  shiftDeck(): Tile | undefined {
    return this.drawPile.shift();
  }

  removeLastDiscard(): Tile {
    if (this.lastDiscardInfo == null) throw new Error("No discard");

    const [playerIndex, discardIndex] = this.lastDiscardInfo;
    delete this.lastDiscardInfo;
    const player = this.getPlayer(playerIndex);
    player.order = player.order.filter(
      ([type, index]) => type !== "discard" || index !== discardIndex
    );

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

  sortPlayerTiles(playerIndex: number): void {
    const jokers = [this.primaryJoker, this.secondaryJoker];
    const isJoker = (tile: Tile) =>
      jokers.some((joker) => Tile.equal(joker, tile));

    this.getPlayer(playerIndex).tiles.sort((a, b) => {
      if (isJoker(a) !== isJoker(b)) {
        if (isJoker(a)) return -1;
        return 1;
      }

      return Tile.compare(a, b);
    });
  }

  hasWinningHand(playerIndex: number): SetsPairs | "chaotic" | undefined {
    const player = this.getPlayer(playerIndex);
    const useDiscard =
      this.lastDiscard != null &&
      player.tiles.length + player.melds.length * 3 === 13;

    return Tile.isWinningHand(
      !useDiscard ? player.tiles : [...player.tiles, this.lastDiscard],
      [this.primaryJoker, this.secondaryJoker],
      player.melds.length
    );
  }

  scoreKong(playerIndex: number): void {
    for (let i = 0; i < this.players.length; i++) {
      if (i === playerIndex) continue;

      this.getPlayer(i).score -= 2;
      this.getPlayer(playerIndex).score += 2;
    }
  }
}
