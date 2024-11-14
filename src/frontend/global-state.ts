import { uuid } from "../shared/utils.ts";
import { useWebSocket } from "./websocket-hook.ts";
import type { ClientMessage, ServerMessage } from "../shared/message.ts";

const { searchParams } = new URL(location.href);

export const SERVER = process.env.MJ_SERVER;
export let SESSION = searchParams.get("session")!;
export let SECRET = searchParams.get("secret") ?? "";

if (!SESSION) {
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
        session: SESSION ?? "",
        secret: SECRET,
      }).toString()
  );
}

export const webSocketHook = useWebSocket<ServerMessage, ClientMessage>(
  SERVER ?? ""
);

webSocketHook.onServerMessage(
  (msg) => msg.error,
  (data) => {
    console.error("[Server]", data.message);
    webSocketHook.close();
  }
);
