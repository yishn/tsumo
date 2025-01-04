import type {
  ITile,
  PullPhase,
  PushPhase,
  Phase,
  ReactionPhase,
  Reaction,
  ScoreModifier,
  OtherPlayer,
} from "../core/main.ts";
import { Achievement } from "./achievements.ts";

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

export type GamePlayersInfo = Record<string, { index: number } & OtherPlayer>;

export interface GamePlayerInfo {
  tiles: ITile[];
  lastDrawnTileIndex: number | null;
}

export interface GameInfo {
  phase: Phase;
  currentPlayer: string;
  dealer: string;
  jokers: [ITile, ITile];
  rotation: number;
  maxRotation: number;
  lastDiscard: ITile | null;
  lastDiscardInfo: [playerId: string, discardIndex: number] | null;
  kongDiscard: ITile | null;
  reactions: Reaction[];
  reactionTimeout: number;
}

export interface ScoreInfo {
  tiles: ITile[];
  melds: ITile[][];
  winModifiers: ScoreModifier[][];
  jokerBonusModifiers: ScoreModifier[][];
}

export interface GameEndInfo {
  achievements: Record<string, Achievement | null>;
  nextSession: string;
}

export interface GameSettings {
  maxRotation: number;
  reactionTimeout: number;
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
  gameSettings?: GameSettings;
  game?: {
    info?: GameInfo;
    players?: GamePlayersInfo;
    player?: GamePlayerInfo;
    score?: ScoreInfo | null;
    end?: GameEndInfo | null;
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
    gameSettings?: GameSettings;
  };
  game?: {
    operation?: {
      [Phase.Pull]?: ClassToMessage<PullPhase>;
      [Phase.Push]?: ClassToMessage<PushPhase>;
      [Phase.Reaction]?: ClassToMessage<ReactionPhase>;
    };
  };
}
