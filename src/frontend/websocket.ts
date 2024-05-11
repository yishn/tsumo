import { MaybeSignal, Signal, useEffect, useSignal } from "sinho";
import { ClientMessage, ServerMessage } from "../shared/message.ts";
import { SERVER, SESSION } from "./global-state.ts";

export interface WebSocketHook<T, U> {
  connected: Signal<boolean>;
  error: Signal<Event | undefined>;
  onMessage<V>(
    path: (msg: T) => V,
    handler: (data: Exclude<V, undefined>) => void
  ): () => void;
  send(data: U): void;
  close(): void;
}

export function useWebSocket<T, U>(
  url: MaybeSignal<string | URL>
): WebSocketHook<T, U> {
  let socket: WebSocket;
  const handlers: Set<{
    path: (msg: T) => any;
    handler: (data: any) => void;
  }> = new Set();
  const [connected, setConnected] = useSignal(false);
  const [error, setError] = useSignal<Event>();
  const queuedMessages: U[] = [];

  useEffect(() => {
    socket = new WebSocket(MaybeSignal.get(url));

    socket.addEventListener("open", () => {
      setConnected(true);
      setError(undefined);

      queuedMessages.length = 0;
    });

    socket.addEventListener("close", () => {
      setConnected(false);
    });

    socket.addEventListener("error", (evt) => {
      setError(evt);
    });

    socket.addEventListener("message", (evt) => {
      const data = JSON.parse(evt.data);

      for (const { path, handler } of handlers) {
        const value = path(data);

        if (value !== undefined) {
          handler(value);
        }
      }
    });

    return () => {
      socket.close();
    };
  });

  return {
    connected,
    error,
    onMessage: (path, handler) => {
      const entry = { path, handler };
      handlers.add(entry);
      return () => handlers.delete(entry);
    },
    send: (data) => {
      if (connected()) {
        socket.send(JSON.stringify(data));
      } else {
        queuedMessages.push(data);
      }
    },
    close: () => {
      socket.close();
    },
  };
}

export const messageHandler = useWebSocket<ServerMessage, ClientMessage>(SERVER!); // TODO

let heartbeatTimeout: ReturnType<typeof setTimeout> | undefined;

messageHandler.onMessage(
  (msg) => msg,
  (msg) => {
    clearTimeout(heartbeatTimeout);

    if (msg.heartbeat != null) {
      messageHandler.send({
        heartbeat: {
          id: msg.heartbeat.id,
          now: Date.now(),
        },
      });
    }

    heartbeatTimeout = setTimeout(() => {
      console.warn("[WebSocket] Server not responsive");
      messageHandler.close();
    }, 30000);
  }
);

messageHandler.onMessage(
  (msg) => msg.error,
  (data) => {
    console.error("[Server]", data.message);
    messageHandler.close();
  }
);
