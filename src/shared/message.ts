import type {
  ITile,
  ActionPhase,
  EndActionPhase,
  PhaseName,
  ReactionPhase,
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
    score: number;
    tiles: number;
    discards: ITile[];
    melds: ITile[][];
  }
>;

export interface GamePlayerInfo {
  tiles: ITile[];
  lastDrawnTileIndex: number | null;
}

export interface GameInfo {
  phase: PhaseName;
  currentPlayer: string;
  dealer: string;
  jokers: [ITile, ITile];
  round: number;
  maxRound: number;
  lastDiscard: null | [playerId: string, discardIndex: number];
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
  };
}

type ClassToMessage<T> = {
  [K in keyof T]?: T[K] extends (...args: infer P) => any ? P : never;
};

export interface ClientMessage {
  heartbeat?: Heartbeat;
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
      [PhaseName.Action]?: ClassToMessage<ActionPhase>;
      [PhaseName.EndAction]?: ClassToMessage<EndActionPhase>;
      [PhaseName.Reaction]?: ClassToMessage<ReactionPhase>;
    };
  };
}
