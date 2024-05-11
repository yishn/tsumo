import { uuid } from "../shared/utils.ts";

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
