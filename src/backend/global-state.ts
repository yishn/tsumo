import WebSocket from "ws";
import { useRef } from "sinho";
import { GameSession } from "./game-session.ts";

export const maxSessions = process.env.MAX_SESSIONS
  ? +process.env.MAX_SESSIONS
  : 1000;

export const allGameSessions = new Map<string, GameSession>();

export const clientInfoMap = new WeakMap<
  WebSocket,
  { session?: GameSession }
>();

export const allClients = useRef(new Set<WebSocket>());
