export interface Heartbeat {
  now: number;
  id: number;
}

export interface ServerMessage {
  heartbeat?: Heartbeat;
  lobby?: {
    joined?: {
      id: string;
      avatar: number;
    };
    playerInfo?: {
      id: string;
      name?: string;
      avatar?: number;
      dice?: number;
    };
  };
}

export interface ClientMessage {
  heartbeat?: Heartbeat;
  lobby?: {
    join?: {
      secret: string;
      game: string;
    };
    playerInfo?: {
      secret: string;
      name?: string;
      avatar?: number;
      ready?: boolean;
    };
  };
}
