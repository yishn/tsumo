export interface Heartbeat {
  now: number;
  id: number;
}

export interface ServerMessage {
  heartbeat?: Heartbeat;
  error?: {
    msg: string;
  };
  lobby?: {
    players: {
      name: string;
      avatar: string;
    }[];
  };
}

export interface ClientMessage {
  heartbeat?: Heartbeat;
  join?: {
    user: string;
    game: string;
    name: string;
    avatar: string;
  };
}
