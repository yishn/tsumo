export interface Heartbeat {
  now: number;
  id: number;
}

export interface ServerMessage {
  heartbeat?: Heartbeat;
  error?: {
    message: string;
  };
  lobby?: {
    joined?: {
      id: string;
      secret: string;
    };
    players?: {
      id: string;
      name?: string;
      avatar: number;
      dice?: number;
    }[];
  };
}

export interface ClientMessage {
  heartbeat?: Heartbeat;
  lobby?: {
    join?: {
      session: string;
      secret?: string;
    };
    playerInfo?: {
      secret: string;
      name?: string;
      avatar: number;
      ready?: boolean;
    };
  };
}
