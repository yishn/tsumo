import { uuid } from "../shared/utils.ts";
import { useWebSocket } from "./websocket-hook.ts";
import type { ClientMessage, ServerMessage } from "../shared/message.ts";

const { searchParams } = new URL(location.href);

export const SERVER = searchParams.get("server");
export let SESSION = searchParams.get("session");
export let SECRET = searchParams.get("secret") ?? "";

if (SESSION == null) {
  SESSION = uuid();
  replaceHistory();
}

export function setSecret(secret: string) {
  SECRET = secret;
  replaceHistory();
}

function replaceHistory() {
  history.replaceState(
    null,
    "",
    "?" +
      new URLSearchParams({
        server: SERVER ?? "",
        session: SESSION ?? "",
        secret: SECRET,
      }).toString()
  );
}

export const webSocketHook = useWebSocket<ServerMessage, ClientMessage>(
  SERVER!
); // TODO

let heartbeatTimeout: ReturnType<typeof setTimeout> | undefined;

webSocketHook.onServerMessage(
  (msg) => msg,
  (msg) => {
    clearTimeout(heartbeatTimeout);

    if (msg.heartbeat != null) {
      webSocketHook.sendMessage({
        heartbeat: {
          id: msg.heartbeat.id,
          now: Date.now(),
        },
      });
    }

    heartbeatTimeout = setTimeout(() => {
      console.warn("[WebSocket] Server not responsive");
      webSocketHook.close();
    }, 30000);
  }
);

webSocketHook.onServerMessage(
  (msg) => msg.error,
  (data) => {
    console.error("[Server]", data.message);
    webSocketHook.close();
  }
);
