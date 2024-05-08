import { allGameSessions, messageHandler } from "../global-state.ts";
import { GameSession } from "../game-session.ts";

messageHandler.register("lobby", function join(req) {
  const data = req.data.join;
  if (data == null) return;
  if (messageHandler.getSession(req.ws) != null) return;

  const sessionId = data.session;
  let session = allGameSessions.get(sessionId);

  if (session == null) {
    session = new GameSession(sessionId);
    allGameSessions.set(sessionId, session);
  }

  let secret = data.secret;
  if (secret != null && !session.peers.has(secret)) {
    req.send({
      error: {
        message: "Invalid secret",
      },
    });
    req.ws.close();
    return;
  }

  req.assignSession(session);

  if (secret == null) {
    secret = crypto.randomUUID();
  }

  const id = crypto.randomUUID();

  session.peers.set(secret, {
    id,
    alive: true,
    ws: req.ws,
    avatar: data.avatar,
  });
  session.keepAlive(req.ws);

  req.send({
    lobby: {
      joined: {
        id,
        secret,
      },
    },
  });

  for (const peer of session.peers.values()) {
    if (peer.ws === req.ws) continue;

    req.send({
      lobby: {
        playerInfo: {
          id: peer.id,
          name: peer.name,
          avatar: peer.avatar,
        },
      },
    });

    messageHandler.send(peer.ws, {
      lobby: {
        playerInfo: {
          id,
          avatar: data.avatar,
        },
      },
    });
  }
});
