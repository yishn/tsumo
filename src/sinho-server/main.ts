import {
  MaybeSignal,
  Signal,
  SignalSetter,
  useBatch,
  useEffect,
  useSignal,
} from "sinho";
import WebSocket, { MessageEvent as WsMessageEvent } from "ws";

export type MessageEvent<V> = Omit<WsMessageEvent, "data"> & { data: V };

export interface ClientPropagationHook<T, U> {
  useClientSignal: <V>(
    path: (msg: U) => V | undefined,
    value: V
  ) => [Signal<V>, SignalSetter<V>];

  onClientEvent: <V>(
    path: (msg: T) => V,
    handler: (evt: MessageEvent<V & ({} | null)>) => void
  ) => void;
}

export function useClientPropagation<T, U>(
  clients: MaybeSignal<WebSocket[]>
): ClientPropagationHook<T, U> {
  return {
    useClientSignal: (path, value) => {
      const [signal, setSignal] = useSignal(value);

      let prevValue: any;
      let prevClients: WebSocket[] = [];

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
          if (prevValue !== value || !prevClients.includes(ws)) {
            ws.send(JSON.stringify(msg));
          }
        }

        prevValue = value;
        prevClients = clientsValue;
      });

      return [signal, setSignal];
    },

    onClientEvent: (path, handler) => {
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
  };
}
