import WebSocket from "ws";
import { useSignal } from "sinho";
import { GameSession } from "./game-session.ts";

export const allGameSessions = new Map<string, GameSession>();

export const clientSessionMap = new WeakMap<WebSocket, GameSession>();

export const [allClients, setAllClients] = useSignal(new Set<WebSocket>());
