const { searchParams } = new URL(location.href);

export const SERVER = searchParams.get("server");
export const SESSION = searchParams.get("session");
