import type { GameSession } from "./game-session.ts";
import { MessageHandler } from "./message-handler.ts";
import type { ClientMessage, ServerMessage } from "../shared/message.ts";

export const allGameSessions = new Map<string, GameSession>();

export const messageHandler = new MessageHandler<
  ClientMessage,
  ServerMessage,
  GameSession
>();
