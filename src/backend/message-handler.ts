import { WebSocket } from "ws";

export interface Request<T, U, S> {
  session?: S;
  data: T;
  ws: WebSocket;
  send(data: U): void;
  assignSession(session: S): void;
}

export class MessageHandler<T, U, S = any> {
  private sessionMap: WeakMap<WebSocket, S> = new WeakMap();
  private handlers: {
    [K in keyof T | "*"]?: ((
      req: K extends "*"
        ? Request<T, U, S>
        : K extends keyof T
          ? Request<NonNullable<T[K]>, U, S>
          : never
    ) => void)[];
  } = {};

  getSession(ws: WebSocket): S | undefined {
    return this.sessionMap.get(ws);
  }

  handle(ws: WebSocket, data: T): void {
    for (const key in data) {
      const genericHandlers = this.handlers["*"];
      const handlers = this.handlers[key] as
        | ((req: Request<NonNullable<T[keyof T]>, U, S>) => void)[]
        | undefined;

      genericHandlers?.forEach((handler) =>
        handler({
          session: this.sessionMap.get(ws),
          data,
          ws,
          send: (data) => ws.send(JSON.stringify(data)),
          assignSession: (session) => this.sessionMap.set(ws, session),
        })
      );

      if (key !== "*" && data[key] != null) {
        handlers?.forEach((handler) =>
          handler({
            session: this.sessionMap.get(ws),
            data: data[key]!,
            ws,
            send: (data) => ws.send(JSON.stringify(data)),
            assignSession: (session) => this.sessionMap.set(ws, session),
          })
        );
      }
    }
  }

  register<K extends keyof T | "*">(
    key: K,
    handler: (
      req: K extends "*"
        ? Request<T, U, S>
        : K extends keyof T
          ? Request<NonNullable<T[K]>, U, S>
          : never
    ) => void
  ): void {
    if (!this.handlers[key]) {
      this.handlers[key] = [];
    }

    this.handlers[key]!.push(handler);
  }

  send(ws: WebSocket, data: U): void {
    ws.send(JSON.stringify(data));
  }
}
