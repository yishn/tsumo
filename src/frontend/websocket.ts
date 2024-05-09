import { MaybeSignal, Signal, useEffect, useSignal } from "sinho";
import { ClientMessage, ServerMessage } from "../shared/message.ts";
import { SERVER } from "./global-state.ts";

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

export const globalWsHook = useWebSocket<ServerMessage, ClientMessage>(SERVER!); // TODO

let heartbeatId = 0;
let heartbeatTimeout: NodeJS.Timeout | number | undefined;

const sendHeartbeat = () => {
  globalWsHook.send({
    heartbeat: {
      id: heartbeatId++,
      now: Date.now(),
    },
  });

  clearTimeout(heartbeatTimeout);
  heartbeatTimeout = setTimeout(() => globalWsHook.close(), 10000);
};

globalWsHook.onMessage(
  (msg) => msg,
  (data) => {
    if (data.heartbeat != null) {
      clearTimeout(heartbeatTimeout);
    }
  }
);

globalWsHook.onMessage(
  (msg) => msg.error,
  (data) => {
    console.error("[Server]", data.message);
    globalWsHook.close();
  }
);

let connectedOnce = false;

useEffect(() => {
  let intervalId: NodeJS.Timeout | number | undefined;

  if (globalWsHook.connected()) {
    connectedOnce = true;
    intervalId = setInterval(sendHeartbeat, 15000);
  } else if (connectedOnce) {
    console.warn("[WebSocket] Connection lost");
  }

  return () => {
    clearTimeout(intervalId);
  };
});
