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
    value: V,
    embed: (value: V) => U
  ) => [Signal<V>, SignalSetter<V>];

  useClientEvent: <V>(
    path: (msg: T) => V,
    handler: (evt: MessageEvent<V & ({} | null)>) => void
  ) => void;
}

export abstract class ClientPropagation<T, U> {
  clients = useRef<WebSocket[]>([]);
  context: ClientPropagationContext<T, U>;
  destroy: () => void;

  constructor() {
    this.context = {
      useClientSignal: (value, embed) => {
        const [signal, setSignal] = useSignal(value);

        useEffect(() => {
          const msg = embed(signal());

          for (const ws of this.clients()) {
            ws.send(JSON.stringify(msg));
          }
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

    [, this.destroy] = useSubscope(() => this.scope());
  }

  abstract scope(): void;
}
