import { WebSocket } from "ws";

export interface Request<T, U, S> {
  ws: WebSocket;
  session?: S;
  data: T;
  send(data: U): void;
  assignSession(session: S): void;
}

export interface CloseRequest<S> {
  ws: WebSocket;
  session?: S;
}

export class MessageHandler<T, U, S = any> {
  private sessionMap: WeakMap<WebSocket, S> = new WeakMap();
  private messageHandlers: {
    path: (msg: T) => any;
    handler: (req: Request<any, U, S>) => void;
  }[] = [];
  private closeHandlers: ((req: CloseRequest<S>) => void)[] = [];

  getSession(ws: WebSocket): S | undefined {
    return this.sessionMap.get(ws);
  }

  handleMessage(ws: WebSocket, data: T): void {
    for (const { path, handler } of this.messageHandlers) {
      const value = path(data);

      if (value !== undefined) {
        handler({
          session: this.sessionMap.get(ws),
          data: value,
          ws,
          send: (data) => ws.send(JSON.stringify(data)),
          assignSession: (session) => this.sessionMap.set(ws, session),
        });
      }
    }
  }

  onMessage<V>(
    path: (msg: T) => V,
    handler: (req: Request<Exclude<V, undefined>, U, S>) => void
  ): void {
    this.messageHandlers.push({
      path,
      handler,
    });
  }

  handleClose(ws: WebSocket): void {
    const session = this.sessionMap.get(ws);
    this.sessionMap.delete(ws);

    for (const handler of this.closeHandlers) {
      handler({
        ws,
        session,
      });
    }
  }

  onClose(handler: (req: CloseRequest<S>) => void): void {
    this.closeHandlers.push(handler);
  }

  send(ws: WebSocket, data: U): void {
    ws.send(JSON.stringify(data));
  }
}
