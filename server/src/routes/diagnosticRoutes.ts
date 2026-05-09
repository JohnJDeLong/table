import { Router } from "express";
import { prisma } from "../config/prisma.js";
import type { ProviderMessage } from "../providers/types.js";
import { rankAdvisorsByUrgency } from "../orchestrator/rankAdvisorsByUrgency.js";
import { loadTableAdvisors } from "../orchestrator/loadTableAdvisors.js";

export const diagnosticRouter = Router();


diagnosticRouter.get("/db-test", async (_req, res) => {
  try {
      const [userCount, workspaceCount, tableCount, advisorCount, conversationCount, messageCount, roundEventCount] =
        await Promise.all([
          prisma.user.count(),
          prisma.workspace.count(),
          prisma.table.count(),
          prisma.advisorProfile.count(),
          prisma.conversation.count(),
          prisma.message.count(),
          prisma.roundEvent.count(),
  
        ]);
  
      res.json({
        ok: true,
        userCount,
        workspaceCount,
        tableCount,
        advisorCount,
        conversationCount,
        messageCount,
        roundEventCount,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to query database" });
    }
});

diagnosticRouter.post("/urgency-test", async (req, res) => {
  try {
      const prompt =
        typeof req.body.prompt === "string" && req.body.prompt.trim().length > 0
          ? req.body.prompt
          : "Should I respond to this conversation?";
  
      const conversation: ProviderMessage[] = Array.isArray(req.body.conversation)
        ? req.body.conversation
        : [{ role: "user", content: prompt }];
      
      const advisors = await loadTableAdvisors();
  
      const ratings = await rankAdvisorsByUrgency(advisors, conversation);
  
      res.json({ ratings });
  
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to rate urgency" });
    }
});
