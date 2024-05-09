export function uuid() {
  return crypto
    .randomUUID()
    .split("-")
    .map((x) => parseInt(x, 16).toString(36))
    .join("");
}
