export interface Heartbeat {
  now: number;
  id: number;
}

export interface ServerMessage {
  heartbeat?: Heartbeat;
  error?: {
    message: string;
  };
  mode?: "lobby" | "game";
  players?: {
    id: string;
    name?: string;
    avatar: number;
    dice?: number;
  }[];
  joined?: {
    id: string;
    secret: string;
  };
  lobby?: {};
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
