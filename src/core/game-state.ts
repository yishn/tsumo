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
  constructor(state: GameState) {
    super(state);

    state.turn = 1;

    for (const player of this.state.players) {
      player.tiles = [];
      player.melds = [];
      player.discards = [];
      player.order = [];
    }
  }

  deal(): GameState<ActionPhase> {
    this.state.drawPile = generateShuffledFullDeck();
    this.state.primaryJoker = this.state.popDrawPile()!;

    for (const [i, player] of this.state.players.entries()) {
      for (let i = 0; i < 13; i++) {
        player.tiles.push(this.state.popDrawPile()!);
      }

      this.state.sortPlayerTiles(i);
    }

    return this.nextPhase(ActionPhase);
  }
}

export class ActionPhase extends PhaseBase(Phase.Action) {
  kongBloom = false;

  @allowPlayerMessage({ currentPlayerOnly: true })
  draw(): GameState<EndActionPhase | ScorePhase> {
    const player = this.state.currentPlayer;
    const tile = this.state.popDrawPile();

    if (tile == null) {
      const result = this.nextPhase(ScorePhase);
      result.phase.draw = true;
      return result;
    }

    player.lastDrawnTileIndex = player.tiles.length;
    player.tiles.push(tile);

    this.state.lastDiscardInfo = undefined;

    const result = this.nextPhase(EndActionPhase);
    result.phase.kongBloom = this.kongBloom;
    return result;
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
    return this.nextPhase(ScorePhase);
  }
}

export class EndActionPhase extends PhaseBase(Phase.EndAction) {
  kongBloom = false;

  @allowPlayerMessage({ currentPlayerOnly: true })
  discard(tileIndex: number): GameState<ReactionPhase> {
    const player = this.state.currentPlayer;
    const [tile] = player.removeTiles(tileIndex);

    player.lastDrawnTileIndex = undefined;
    player.pushDiscard(tile);

    this.state.turn++;
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
  meldKong(tileIndex: number, meldIndex: number): GameState<ReactionPhase> {
    const player = this.state.currentPlayer;
    const tile = player.getTile(tileIndex);
    const meld = player.melds[meldIndex];
    if (meld == null) throw new Error("Invalid meld");

    if (
      !Tile.equal(tile, meld[0]) ||
      !Tile.equal(meld[0], meld[1]) ||
      !Tile.equal(meld[1], meld[2])
    ) {
      throw new Error("Invalid kong");
    }

    this.state.kongDiscardInfo = [
      this.state.currentPlayerIndex,
      tileIndex,
      meldIndex,
    ];

    return this.nextPhase(ReactionPhase);
  }

  @allowPlayerMessage({ currentPlayerOnly: true })
  win(): GameState<ScorePhase> {
    const result = this.nextPhase(ScorePhase);
    result.phase.kongBloom = this.kongBloom;
    return result;
  }
}

export interface Reaction {
  type: "pong" | "kong" | "win";
  playerIndex: number;
  tileIndices: number[];
}

export namespace Reaction {
  export function compare(state: GameState, a: Reaction, b: Reaction): number {
    // Prefer wins, then kongs
    if (a.type !== b.type) {
      if (a.type === "win") return 1;
      if (b.type === "win") return -1;
      if (a.type === "kong") return 1;
      if (b.type === "kong") return -1;
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

  private pushReaction(playerIndex: number, reaction: Reaction): void {
    if (
      this.reactions.some((reaction) => reaction.playerIndex === playerIndex)
    ) {
      return;
    }

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
    if (this.state.kongDiscard != null) throw new Error("Cannot pong/kong");
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

    this.pushReaction(playerIndex, {
      type: tileIndices.length >= 3 ? "kong" : "pong",
      playerIndex,
      tileIndices,
    });

    return this.state;
  }

  @allowPlayerMessage({ verifyPlayerIndex: 0 })
  win(playerIndex: number): GameState<ReactionPhase> {
    if (this.state.kongDiscard == null && this.state.lastDiscard == null) {
      throw new Error("No discard");
    }

    this.pushReaction(playerIndex, {
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
      this.reactions = [];

      if (type === "pong" || type === "kong") {
        const tile1 = player.getTile(tileIndex1);
        const tile2 = player.getTile(tileIndex2);
        const tile3 =
          tileIndex3 == null ? undefined : player.getTile(tileIndex3);

        if (tileIndex3 == null) {
          player.removeTiles(tileIndex1, tileIndex2);
        } else {
          player.removeTiles(tileIndex1, tileIndex2, tileIndex3);
        }
        player.lastDrawnTileIndex = undefined;

        const discard = this.state.removeLastDiscard();
        player.pushMeld(
          tile3 == null
            ? [tile1, tile2, discard]
            : [tile1, tile2, tile3, discard]
        );

        this.state.turn++;
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

    if (this.state.kongDiscard == null) {
      // Handle normal discard

      this.state.moveToNextPlayer();
    } else {
      // Handle kong discard into meld

      const [playerIndex, tileIndex] = this.state.kongDiscardInfo!;

      this.state.players[playerIndex].removeTiles(tileIndex);
      this.state.kongDiscardMeld!.push(this.state.kongDiscard);

      this.state.scoreKong(this.state.currentPlayerIndex);
      this.state.lastDiscardInfo = undefined;
      this.state.kongDiscardInfo = undefined;
    }

    return this.nextPhase(ActionPhase);
  }
}

export enum ScoreModifierType {
  DealerPenalty = "dealerPenalty",
  HeavenlyWin = "heavenlyWin",
  EarthlyWin = "earthlyWin",
  FalseWin = "falseWin",
  Win = "win",
  Dealer = "dealer",
  SelfDraw = "selfDraw",
  Detonator = "detonator",
  JokerFisher = "jokerFisher",
  KongBloom = "kongBloom",
  StolenKong = "stolenKong",
  AllPong = "allPong",
  SevenPairs = "sevenPairs",
  Chaotic = "chaotic",
  SevenStars = "sevenStars",
  JokerFree = "jokerFree",
  PureJokerFree = "pureJokerFree",
  Joker = "joker",
}

export const scoreModifierTypeOrder = [
  ScoreModifierType.DealerPenalty,
  ScoreModifierType.HeavenlyWin,
  ScoreModifierType.EarthlyWin,
  ScoreModifierType.FalseWin,
  ScoreModifierType.Win,
  ScoreModifierType.Dealer,
  ScoreModifierType.SelfDraw,
  ScoreModifierType.Detonator,
  ScoreModifierType.JokerFisher,
  ScoreModifierType.KongBloom,
  ScoreModifierType.StolenKong,
  ScoreModifierType.AllPong,
  ScoreModifierType.SevenPairs,
  ScoreModifierType.Chaotic,
  ScoreModifierType.SevenStars,
  ScoreModifierType.JokerFree,
  ScoreModifierType.PureJokerFree,
  ScoreModifierType.Joker,
];

export type ScoreModifier = [
  type: ScoreModifierType,
  target: number,
  multiplier: number,
  constant: number,
];

export class ScorePhase extends PhaseBase(Phase.Score) {
  draw = false;
  scored = false;
  kongBloom = false;
  winModifiers = this.getWinModifiers();
  jokerBonusModifiers = this.getJokerBonusModifiers();

  private getWinModifiers(): ScoreModifier[][] {
    if (this.draw) {
      return this.state.players.map((player) => {
        if (player === this.state.dealer) return [];

        return [
          [ScoreModifierType.DealerPenalty, this.state.dealerIndex, 1, 5],
        ];
      });
    }

    const winner = this.state.currentPlayer;
    const winnerIndex = this.state.currentPlayerIndex;
    const win = this.state.hasWinningHand(winnerIndex);

    if (win == null) {
      // False win

      return this.state.players.map((player) => {
        if (player === winner) return [];

        return [[ScoreModifierType.FalseWin, winnerIndex, 1, 10]];
      });
    }

    const winningHand = this.state.getScoreHand(winnerIndex);
    const jokerFreeWin = this.state.hasWinningHand(winnerIndex, true);
    const pureJokerFree =
      jokerFreeWin != null &&
      this.state.players.every(
        (player) =>
          player === winner ||
          !player.melds
            .flatMap((meld) => meld)
            .concat(player.tiles)
            .concat(player.discards)
            .some((tile) => this.state.isJoker(tile))
      );
    const winnerJokers = winner.tiles.filter((tile) =>
      this.state.isJoker(tile)
    );
    const jokerFisher =
      this.state.lastDiscard == null &&
      winner.lastDrawnTileIndex != null &&
      winnerJokers.length >= 1 &&
      Tile.formSetsPairs(
        winner.tiles.filter(
          (tile, i) =>
            !this.state.isJoker(tile) && i !== winner.lastDrawnTileIndex
        ),
        winnerJokers.length - 1
      ).some(
        ({ sets, pairs }) =>
          pairs.length === 6 || sets.length + winner.melds.length === 4
      );

    return this.state.players.map((player, i) => {
      if (winner === player) return [];

      if (this.state.turn === 1) {
        return [[ScoreModifierType.HeavenlyWin, winnerIndex, 1, -20]];
      } else if (this.state.turn === 2 && this.state.lastDiscard != null) {
        return [[ScoreModifierType.EarthlyWin, winnerIndex, 1, -20]];
      }

      const types: Partial<Record<ScoreModifierType, [number, number] | null>> =
        {
          [ScoreModifierType.Win]: [1, -1],
          [ScoreModifierType.Dealer]:
            this.state.dealer === winner || this.state.dealer === player
              ? [2, 0]
              : null,
          [ScoreModifierType.SelfDraw]:
            winner.lastDrawnTileIndex != null ? [2, 0] : null,
          [ScoreModifierType.Detonator]:
            this.state.lastDiscardInfo?.[0] === i ? [2, 0] : null,
          [ScoreModifierType.JokerFisher]: jokerFisher ? [2, 0] : null,
          [ScoreModifierType.KongBloom]: this.kongBloom ? [2, 0] : null,
          [ScoreModifierType.StolenKong]:
            this.state.kongDiscard != null ? [2, 0] : null,
          [ScoreModifierType.AllPong]:
            winner.melds.every((meld) =>
              Tile.isPongKong(...(meld as [Tile, Tile, Tile, Tile?]))
            ) &&
            winningHand
              .filter(
                (tile) =>
                  winningHand.filter((tile2) => Tile.equal(tile2, tile))
                    .length < 3
              )
              .every(
                (_, __, arr) => arr.length === 2 && Tile.equal(arr[0], arr[1])
              )
              ? [2, 0]
              : null,
          [ScoreModifierType.SevenPairs]:
            typeof win === "object" && win.pairs.length === 7 ? [2, 0] : null,
          [ScoreModifierType.Chaotic]: win === "chaotic" ? [2, 0] : null,
          [ScoreModifierType.SevenStars]:
            win === "chaotic" &&
            new Set(
              winningHand
                .filter((tile) => tile.honor)
                .map((tile) => tile.valueOf())
            ).size === 7
              ? [2, 0]
              : null,
          [ScoreModifierType.JokerFree]:
            jokerFreeWin != null && !pureJokerFree ? [2, -5] : null,
          [ScoreModifierType.PureJokerFree]: pureJokerFree ? [4, -5] : null,
        };

      return Object.entries(types)
        .filter(
          (entry): entry is [ScoreModifierType, [number, number]] =>
            entry[1] != null
        )
        .map<ScoreModifier>(([type, value]) => [type, winnerIndex, ...value]);
    });
  }

  private getJokerBonusModifiers(): ScoreModifier[][] {
    const jokerScores = this.state.players.map((player) =>
      player.melds
        .flatMap((meld) => meld)
        .concat(player.tiles)
        .map<number>((tile) =>
          Tile.equal(tile, this.state.primaryJoker)
            ? 2
            : Tile.equal(tile, this.state.secondaryJoker)
              ? 1
              : 0
        )
        .reduce((sum, n) => sum + n, 0)
    );
    const overlord = jokerScores.filter((score) => score !== 0).length === 1;

    return this.state.players.map((_, i) => {
      return jokerScores.flatMap<ScoreModifier>((jokerScore, j) =>
        i === j || jokerScore === 0
          ? []
          : [
              [
                ScoreModifierType.Joker,
                j,
                (jokerScore >= 5 ? jokerScore - 3 : 1) * (overlord ? 2 : 1),
                -jokerScore,
              ],
            ]
      );
    });
  }

  score(): GameState<ScorePhase> {
    if (this.scored) throw new Error("Already scored");

    const winModifiers = this.winModifiers;
    const jokerModifiers = this.jokerBonusModifiers;

    for (const [i, player] of this.state.players.entries()) {
      let delta = 0;

      for (const [_, target, multiplier, constant] of winModifiers[i]) {
        const newDelta = multiplier * delta + constant;

        player.score += newDelta - delta;
        this.state.players[target].score -= newDelta - delta;

        delta = newDelta;
      }

      delta = 0;

      for (const [, target, multiplier, constant] of jokerModifiers[i]) {
        const newDelta = multiplier * delta + constant;

        player.score += newDelta - delta;
        this.state.players[target].score -= newDelta - delta;

        delta = newDelta;
      }
    }

    this.scored = true;
    return this.state;
  }

  next(): GameState<DealPhase> {
    const winner = this.draw ? null : this.state.currentPlayer;

    if (
      winner !== this.state.dealer ||
      (!this.draw &&
        this.state.hasWinningHand(this.state.currentPlayerIndex) == null)
    ) {
      this.state.moveToNextDealer();
    }

    this.state.currentPlayerIndex = this.state.dealerIndex;

    return this.nextPhase(DealPhase);
  }
}

export class GameState<P extends PhaseBase = PhaseBase> {
  phase: P;
  turn: number = 1;
  round: number = 1;
  maxRound: number = 4;
  drawPile: Tile[] = [];
  players: Player[] = [...Array(4)].map(() => new Player());
  currentPlayerIndex: number = 0;
  dealerIndex: number = 0;
  primaryJoker: Tile = new Tile(TileSuit.Bamboo, 1);
  lastDiscardInfo?: [playerIndex: number, discardIndex: number];
  kongDiscardInfo?: [playerIndex: number, tileIndex: number, meldIndex: number];

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

  get kongDiscard(): Tile | undefined {
    if (this.kongDiscardInfo == null) return;

    const [playerIndex, tileIndex] = this.kongDiscardInfo;
    return this.players[playerIndex].tiles[tileIndex];
  }

  get kongDiscardMeld(): Tile[] | undefined {
    if (this.kongDiscardInfo == null) return;

    const [playerIndex, , meldIndex] = this.kongDiscardInfo;
    return this.players[playerIndex].melds[meldIndex];
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
    if (this.dealerIndex === 0) this.round++;
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

  getScoreHand(playerIndex: number): Tile[] {
    const player = this.getPlayer(playerIndex);
    const useDiscard =
      (this.lastDiscard != null || this.kongDiscard != null) &&
      player.tiles.length + player.melds.length * 3 === 13;

    return [
      ...player.melds.flat(),
      ...player.tiles,
      ...(useDiscard ? [this.kongDiscard ?? this.lastDiscard!] : []),
    ];
  }

  hasWinningHand(
    playerIndex: number,
    noJokers: boolean = false
  ): SetsPairs | "chaotic" | undefined {
    const player = this.getPlayer(playerIndex);
    const useDiscard =
      (this.lastDiscard != null || this.kongDiscard != null) &&
      player.tiles.length + player.melds.length * 3 === 13;

    return Tile.isWinningHand(
      !useDiscard
        ? player.tiles
        : [...player.tiles, this.kongDiscard ?? this.lastDiscard!],
      noJokers ? [] : [this.primaryJoker, this.secondaryJoker],
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
