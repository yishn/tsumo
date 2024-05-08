import { WebSocket } from "ws";

export class GameSession {
  peers: Map<
    string,
    {
      id: string;
      alive: boolean;
      aliveTimeout?: NodeJS.Timeout;
      ws: WebSocket;
      name?: string;
      avatar: number;
    }
  > = new Map();

  constructor(public id: string) {}

  keepAlive(ws: WebSocket): void {
    const peer = [...this.peers.values()].find((peer) => peer.ws === ws);
    if (peer == null) return;

    peer.alive = true;

    clearTimeout(peer.aliveTimeout);
    peer.aliveTimeout = setTimeout(() => {
      peer.alive = false;
      peer.ws.terminate();
    }, 30000);
  }
}
