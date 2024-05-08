import { messageHandler } from "../global-state.ts";

messageHandler.register("heartbeat", function heartbeat(req) {
  req.session?.keepAlive(req.ws);

  req.send({
    heartbeat: {
      id: req.data.id,
      now: Date.now(),
    },
  });
});
