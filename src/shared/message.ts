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
