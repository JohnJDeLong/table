import { Router } from "express";
import { activeRoundControllers } from "../services/activeRoundControllers.js";

export const conversationRouter = Router();

conversationRouter.post("/:conversationId/stop", (req, res) => {
  const controller = activeRoundControllers.get(req.params.conversationId);

  if (!controller) {
    res.json({ ok: true, stopped: false });
    return;
  }

  controller.abort();
  activeRoundControllers.delete(req.params.conversationId);

  res.json({ ok: true, stopped: true });
});
