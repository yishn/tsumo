import { WebSocket } from "ws";

export class Session {
  peers: Map<
    string,
    {
      id: string;
      ws: WebSocket;
      name?: string;
      avatar: number;
    }
  > = new Map();
  lastMessageTimestamp?: number;

  constructor(public id: string) {}
}
