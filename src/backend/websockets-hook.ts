import {
  MaybeSignal,
  Signal,
  SignalSetter,
  useBatch,
  useEffect,
  useSignal,
} from "sinho";
import WebSocket, { CloseEvent, MessageEvent as WsMessageEvent } from "ws";

export type MessageEvent<V> = Omit<WsMessageEvent, "data"> & { data: V };

export interface WebSocketsHook<T, U> {
  useClientSignal: <V>(
    path: (msg: U) => V | undefined,
    value: V
  ) => [Signal<V>, SignalSetter<V>];

  onClientMessage: <V>(
    path: (msg: T) => V,
    handler: (evt: MessageEvent<V & ({} | null)>) => void
  ) => void;

  onClientClose: (handler: (evt: CloseEvent) => void) => void;

  broadcastMessage: (msg: U) => void;

  sendMessage: (ws: WebSocket, msg: U) => void;
}

export function useWebSockets<T, U>(
  clients: MaybeSignal<Set<WebSocket>>
): WebSocketsHook<T, U> {
  const result: WebSocketsHook<T, U> = {
    useClientSignal: (path, value) => {
      const [signal, setSignal] = useSignal(value);

      let prevValue: any;
      let prevClients: Set<WebSocket> = new Set();

      useEffect(() => {
        const msg = {} as U;
        let assigneeObj: any = msg;
        let assigneeKey: string | undefined;
        const msgBuilder = new Proxy(
          {},
          {
            get: (_, key) => {
              if (assigneeKey != null) {
                assigneeObj = assigneeObj[assigneeKey] = {};
              }
              assigneeKey = key.toString();
              return msgBuilder;
            },
          }
        ) as U;

        path(msgBuilder);
        if (assigneeKey == null) throw new Error("Invalid path");

        const clientsValue = MaybeSignal.get(clients);
        const value = signal();
        assigneeObj[assigneeKey] = value;

        for (const ws of clientsValue) {
          if (prevValue !== value || !prevClients.has(ws)) {
            result.sendMessage(ws, msg);
          }
        }

        prevValue = value;
        prevClients = clientsValue;
      });

      return [signal, setSignal];
    },

    onClientMessage: (path, handler) => {
      useEffect(() => {
        const clientsValue = MaybeSignal.get(clients);
        const wsHandler = (evt: WsMessageEvent) => {
          const msg = JSON.parse(evt.data.toString()) as T;
          const data = path(msg);
          if (data === undefined) return;

          useBatch(() =>
            handler({
              type: evt.type,
              target: evt.target,
              data,
            })
          );
        };

        for (const ws of clientsValue) {
          ws.addEventListener("message", wsHandler);
        }

        return () => {
          for (const ws of clientsValue) {
            ws.removeEventListener("message", wsHandler);
          }
        };
      });
    },

    onClientClose: (handler) => {
      useEffect(() => {
        const clientsValue = MaybeSignal.get(clients);
        const wsHandler = (evt: CloseEvent) => useBatch(() => handler(evt));

        for (const ws of clientsValue) {
          ws.addEventListener("close", wsHandler);
        }

        return () => {
          for (const ws of clientsValue) {
            ws.removeEventListener("close", wsHandler);
          }
        };
      });
    },

    broadcastMessage: (msg) => {
      for (const ws of MaybeSignal.get(clients)) {
        result.sendMessage(ws, msg);
      }
    },

    sendMessage: (ws, msg) => {
      ws.send(JSON.stringify(msg));
    },
  };

  return result;
}
