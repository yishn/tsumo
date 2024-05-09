import {
  MaybeSignal,
  Signal,
  SignalSetter,
  useBatch,
  useEffect,
  useRef,
  useSignal,
  useSubscope,
} from "sinho";
import WebSocket, { MessageEvent as WsMessageEvent } from "ws";

export type MessageEvent<V> = Omit<WsMessageEvent, "data"> & { data: V };

export interface ServerComponentProps {
  clients: MaybeSignal<WebSocket[]>;
}

export interface ClientPropagationContext<T, U> {
  useClientSignal: <V>(
    path: (msg: U) => V | undefined,
    value: V
  ) => [Signal<V>, SignalSetter<V>];

  useClientEvent: <V>(
    path: (msg: T) => V,
    handler: (evt: MessageEvent<V & ({} | null)>) => void
  ) => void;
}

export abstract class ClientPropagation<T, U> {
  clients = useRef<WebSocket[]>([]);
  context: ClientPropagationContext<T, U>;
  destroy: () => void = () => {};

  constructor() {
    this.context = {
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

          const value = signal();
          if (assigneeKey == null) throw new Error("Invalid path");
          assigneeObj[assigneeKey] = value;

          for (const ws of this.clients()) {
            if (prevValue !== value || !prevClients.includes(ws)) {
              ws.send(JSON.stringify(msg));
            }
          }

          prevValue = value;
          prevClients = this.clients();
        });

        return [signal, setSignal];
      },

      useClientEvent: (path, handler) => {
        useEffect(() => {
          const clients = this.clients();
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

          for (const ws of clients) {
            ws.addEventListener("message", wsHandler);
          }

          return () => {
            for (const ws of clients) {
              ws.removeEventListener("message", wsHandler);
            }
          };
        });
      },
    };

    setImmediate(() => {
      [, this.destroy] = useSubscope(() => this.scope());
    });
  }

  abstract scope(): void;
}
