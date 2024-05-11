const { searchParams } = new URL(location.href);

export const SERVER = searchParams.get("server");
export const SESSION = searchParams.get("session");
export let SECRET = searchParams.get("secret") ?? "";

export function setSecret(secret: string) {
  SECRET = secret;
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
