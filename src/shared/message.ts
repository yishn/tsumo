import { PhaseName } from "../core/game-state.ts";
import { ITile } from "../core/tile.ts";

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
}

export interface GameInfo {
  phase: PhaseName;
  currentPlayer: string;
  dealer: string;
  jokers: [ITile, ITile];
  round: number;
  maxRounds: number;
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
    player?: GamePlayerInfo
  };
}

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
}
