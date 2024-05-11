export interface Heartbeat {
  now: number;
  id: number;
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
  mode?: "lobby" | "game";
  players?: {
    id: string;
    name?: string;
    avatar: number;
    dice?: [number, number];
  }[];
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
