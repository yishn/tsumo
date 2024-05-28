import type {
  ITile,
  ActionPhase,
  EndActionPhase,
  Phase,
  ReactionPhase,
  Reaction,
  ScoreModifier,
} from "../core/main.ts";

export interface Heartbeat {
  now: number;
  id: number;
}

export type AppMode = "lobby" | "game";

export interface PlayerInfo {
  id: string;
  name?: string;
  avatar: number;
  dice?: [number, number];
}

export type GamePlayersInfo = Record<
  string,
  {
    index: number;
    score: number;
    tilesCount: number;
    discards: ITile[];
    melds: ITile[][];
    order: [type: "discard" | "meld", index: number][];
  }
>;

export interface GamePlayerInfo {
  tiles: ITile[];
  lastDrawnTileIndex: number | null;
}

export interface GameInfo {
  phase: Phase;
  currentPlayer: string;
  dealer: string;
  jokers: [ITile, ITile];
  round: number;
  maxRound: number;
  lastDiscard: ITile | null;
  lastDiscardInfo: [playerId: string, discardIndex: number] | null;
  reactions: Reaction[];
}

export interface ScoreInfo {
  tiles: ITile[];
  melds: ITile[][];
  winModifiers: ScoreModifier[][];
  jokerBonusModifiers: ScoreModifier[][];
}

export interface ServerMessage {
  heartbeat?: Heartbeat;
  error?: {
    message: string;
  };
  joined?: {
    id: string;
    secret: string;
  };
  mode?: AppMode;
  players?: PlayerInfo[];
  deadPlayers?: string[];
  game?: {
    info?: GameInfo;
    players?: GamePlayersInfo;
    player?: GamePlayerInfo;
    score?: ScoreInfo | null;
  };
}

type ClassToMessage<T> = {
  [K in keyof T]?: T[K] extends (...args: infer P) => any ? P : never;
};

export interface ClientMessage {
  heartbeat?: Heartbeat;
  ready?: {};
  join?: {
    session: string;
    secret?: string;
  };
  lobby?: {
    playerInfo?: {
      secret: string;
      name?: string;
      avatar: number;
      ready?: boolean;
    };
  };
  game?: {
    operation?: {
      [Phase.Action]?: ClassToMessage<ActionPhase>;
      [Phase.EndAction]?: ClassToMessage<EndActionPhase>;
      [Phase.Reaction]?: ClassToMessage<ReactionPhase>;
    };
  };
}
