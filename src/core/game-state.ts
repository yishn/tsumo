import { distributeAchievements } from "../shared/achievements.ts";
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
  Pull = "pull",
  Push = "push",
  Reaction = "reaction",
  Score = "score",
  End = "end",
}

export function PhaseBase<N extends Phase>(name: N) {
  return class _PhaseBase implements PhaseBase {
    name: N = name;
    allowPlayerMessageFns: Map<string, AllowPlayerMessageOptions> = new Map();

    constructor(public state: GameState<any>) {}

    protected nextPhase<P extends PhaseBase>(
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
}

export class DealPhase extends PhaseBase(Phase.Deal) {
  constructor(state: GameState) {
    super(state);

    state.turn = 1;
    state.lastDiscardInfo = undefined;
    state.kongDiscardInfo = undefined;

    for (const player of this.state.players) {
      player.tiles = [];
      player.melds = [];
      player.discards = [];
      player.order = [];
    }
  }

  deal(): GameState<PullPhase> {
    this.state.drawPile = generateShuffledFullDeck();
    this.state.primaryJoker = this.state.popDrawPile()!;

    for (const [i, player] of this.state.players.entries()) {
      for (let i = 0; i < 13; i++) {
        player.tiles.push(this.state.popDrawPile()!);
      }

      this.state.sortPlayerTiles(i);
    }

    return this.nextPhase(PullPhase);
  }
}

export class PullPhase extends PhaseBase(Phase.Pull) {
  kongBloom = false;

  constructor(state: GameState<any>) {
    super(state);

    state.currentPlayer.statistics.startThinking();
  }

  @allowPlayerMessage({ currentPlayerOnly: true })
  draw(): GameState<PushPhase | ScorePhase> {
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

    const result = this.nextPhase(PushPhase);
    result.phase.kongBloom = this.kongBloom;
    return result;
  }

  @allowPlayerMessage({ currentPlayerOnly: true })
  eat(tileIndex1: number, tileIndex2: number): GameState<PushPhase> {
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

    player.statistics.eats++;
    player.statistics.stolenDiscards++;

    return this.nextPhase(PushPhase);
  }

  @allowPlayerMessage({ currentPlayerOnly: true })
  kong(
    tileIndex1: number,
    tileIndex2: number,
    tileIndex3: number
  ): GameState<PullPhase> {
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

    player.statistics.kongs++;
    player.statistics.stolenDiscards++;

    return this.nextPhase(PullPhase);
  }

  @allowPlayerMessage({ currentPlayerOnly: true })
  win(): GameState<ScorePhase> {
    if (this.state.lastDiscard == null) throw new Error("No discard");

    return this.nextPhase(ScorePhase);
  }

  nextPhase<P extends PhaseBase>(
    phase: new (state: GameState) => P
  ): GameState<P> {
    this.state.currentPlayer.statistics.stopThinking();

    return super.nextPhase(phase);
  }
}

export class PushPhase extends PhaseBase(Phase.Push) {
  kongBloom = false;

  constructor(state: GameState<any>) {
    super(state);

    state.currentPlayer.statistics.startThinking();
  }

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
  ): GameState<PullPhase> {
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

    player.statistics.kongs++;

    return this.nextPhase(PullPhase);
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

  nextPhase<P extends PhaseBase>(
    phase: new (state: GameState) => P
  ): GameState<P> {
    this.state.currentPlayer.statistics.stopThinking();

    return super.nextPhase(phase);
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

  next(): GameState<PullPhase | PushPhase | ScorePhase> {
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

        if (tileIndex3 != null) {
          // Handle kongs

          this.state.scoreKong(playerIndex);
          this.state.lastDiscardInfo = undefined;

          player.statistics.kongs++;
          player.statistics.stolenDiscards++;

          return this.nextPhase(PullPhase);
        } else {
          // Handle pongs

          player.statistics.pongs++;
          player.statistics.stolenDiscards++;

          return this.nextPhase(PushPhase);
        }
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

      this.state.currentPlayer.statistics.kongs++;
    }

    return this.nextPhase(PullPhase);
  }
}

export enum ScoreModifierType {
  Draw = "draw",
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
  Overlord = "overlordJoker",
}

export namespace ScoreModifierType {
  export function list(): ScoreModifierType[] {
    return [
      ScoreModifierType.Draw,
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
      ScoreModifierType.Overlord,
    ];
  }
}

export type ScoreModifier = [
  type: ScoreModifierType,
  source: number,
  multiplier: number,
  constant: number,
];

export class ScorePhase extends PhaseBase(Phase.Score) {
  static getWinResult(data: ScoreModifier[][]): number[] {
    const result = data.map((_) => 0);

    for (const [i, modifiers] of data.entries()) {
      for (const [, source, multiplier, constant] of modifiers) {
        const delta = result[i] * multiplier + constant - result[i];
        result[i] += delta;
        result[source] -= delta;
      }
    }

    return result;
  }

  static getJokerBonusResult(data: ScoreModifier[][]): number[] {
    const result = data.map((_) => 0);

    for (const [i, modifiers] of data.entries()) {
      for (const [, source, multiplier, constant] of modifiers) {
        const delta = constant * multiplier;
        result[i] += delta;
        result[source] -= delta;
      }
    }

    return result;
  }

  draw = false;
  scored = false;
  kongBloom = false;
  winModifiers = this.getWinModifiers();
  jokerBonusModifiers = this.getJokerBonusModifiers();

  private getWinModifiers(): ScoreModifier[][] {
    if (this.draw) {
      return this.state.players.map((player) => {
        if (player === this.state.dealer) return [];

        return [[ScoreModifierType.Draw, this.state.dealerIndex, 1, 5]];
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
          !player.getAllTiles().some((tile) => this.state.isJoker(tile))
      );
    const winnerJokers = winner.tiles.filter((tile) =>
      this.state.isJoker(tile)
    );
    const jokerFisher =
      this.state.kongDiscard == null &&
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
                (tile1) =>
                  winningHand.filter((tile2) => Tile.equal(tile1, tile2))
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
    const overlord = jokerScores.filter((score) => score > 0).length === 1;

    return this.state.players.map((_, i) => {
      return jokerScores.flatMap<ScoreModifier>((jokerScore, j) =>
        i === j || jokerScore === 0
          ? []
          : [
              [
                !overlord
                  ? ScoreModifierType.Joker
                  : ScoreModifierType.Overlord,
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

    const winResult = ScorePhase.getWinResult(this.winModifiers);
    const jokerBonusResult = ScorePhase.getJokerBonusResult(
      this.jokerBonusModifiers
    );

    for (const [i, player] of this.state.players.entries()) {
      player.score += winResult[i] + jokerBonusResult[i];
    }

    this.scored = true;

    // Update statistics

    const scoreModifierTypes = new Set(
      this.winModifiers.flatMap((modifiers) =>
        modifiers.map((modifier) => modifier[0])
      )
    );

    if (scoreModifierTypes.has(ScoreModifierType.FalseWin)) {
      this.state.currentPlayer.statistics.falseWins++;
    } else if (scoreModifierTypes.has(ScoreModifierType.Win)) {
      this.state.currentPlayer.statistics.wins++;

      if (this.state.currentPlayer === this.state.dealer) {
        this.state.currentPlayer.statistics.dealerWins++;
      }

      if (
        this.state.lastDiscardInfo == null &&
        this.state.kongDiscard == null
      ) {
        this.state.currentPlayer.statistics.selfDrawWins++;
      } else if (this.state.lastDiscardInfo != null) {
        this.state.currentPlayer.statistics.stolenDiscards++;
        this.state.getPlayer(this.state.lastDiscardInfo[0]).statistics
          .detonatorCount++;
      } else if (scoreModifierTypes.has(ScoreModifierType.StolenKong)) {
        this.state.currentPlayer.statistics.stolenDiscards++;
      }

      if (
        [
          ScoreModifierType.HeavenlyWin,
          ScoreModifierType.EarthlyWin,
          ScoreModifierType.AllPong,
          ScoreModifierType.SevenPairs,
          ScoreModifierType.Chaotic,
        ].some((type) => scoreModifierTypes.has(type))
      ) {
        this.state.currentPlayer.statistics.specialHandWins++;
      }
    }

    for (const player of this.state.players) {
      player.statistics.jokers += player.tiles.filter((tile) =>
        this.state.isJoker(tile)
      ).length;
    }

    const overlordPLayerIndex = this.jokerBonusModifiers.findIndex(
      (modifiers) =>
        modifiers.some(([type]) => type === ScoreModifierType.Overlord)
    );

    if (overlordPLayerIndex >= 0) {
      this.state.getPlayer(overlordPLayerIndex).statistics.overlordCount++;
    }

    return this.state;
  }

  next(): GameState<DealPhase | EndPhase> {
    const winner = this.draw ? null : this.state.currentPlayer;

    if (
      winner !== this.state.dealer ||
      (!this.draw &&
        this.state.hasWinningHand(this.state.currentPlayerIndex) == null)
    ) {
      this.state.moveToNextDealer();
    }

    if (this.state.round > this.state.maxRound) {
      return this.nextPhase(EndPhase);
    } else {
      this.state.currentPlayerIndex = this.state.dealerIndex;

      return this.nextPhase(DealPhase);
    }
  }
}

export class EndPhase extends PhaseBase(Phase.End) {
  achievements = distributeAchievements(
    this.state.players.map((player) => player.statistics)
  );
}

export class GameState<P extends PhaseBase = PhaseBase> {
  phase: P;
  turn: number = 1;
  round: number = 1;
  maxRound: number = 1;
  drawPile: Tile[] = [];
  players: Player[] = [...Array(4)].map(() => new Player());
  currentPlayerIndex: number = 0;
  dealerIndex: number = 0;
  primaryJoker: Tile = new Tile(TileSuit.Bamboo, 1);
  lastDiscardInfo?: [playerIndex: number, discardIndex: number];
  kongDiscardInfo?: [playerIndex: number, tileIndex: number, meldIndex: number];

  static createNewGame(): GameState<DealPhase> {
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
    ignoreJokers: boolean = false
  ): SetsPairs | "chaotic" | undefined {
    const player = this.getPlayer(playerIndex);
    const useDiscard =
      (this.lastDiscard != null || this.kongDiscard != null) &&
      player.tiles.length + player.melds.length * 3 === 13;

    return Tile.isWinningHand(
      !useDiscard
        ? player.tiles
        : [...player.tiles, this.kongDiscard ?? this.lastDiscard!],
      ignoreJokers ? [] : [this.primaryJoker, this.secondaryJoker],
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
