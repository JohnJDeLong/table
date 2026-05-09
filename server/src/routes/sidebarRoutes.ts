import { Router } from "express";
import { prisma } from "../config/prisma.js";

export const sidebarRouter = Router();

sidebarRouter.get("/", async (_req, res) => {
   try {
      const workspaces = await prisma.workspace.findMany({
        orderBy: {
          createdAt: "asc",
        },
        include: {
          tables: {
            orderBy: {
              createdAt: "asc",
            },
            include: {
              advisors: {
                orderBy: {
                  position: "asc",
                },
                include: {
                  advisorProfile: true,
                },
              },
            },
          },
        },
      });
  
      res.json({
        workspaces: workspaces.map((workspace) => ({
          id: workspace.id,
          name: workspace.name,
          tables: workspace.tables.map((table) => ({
            id: table.id,
            name: table.name,
            description: table.description,
            pauseThreshold: table.pauseThreshold,
            maxTurnsPerRound: table.maxTurnsPerRound,
            advisors: table.advisors.map((tableAdvisor) => ({
              id: tableAdvisor.id,
              profileId: tableAdvisor.advisorProfile.id,
              speakerId: tableAdvisor.advisorProfile.provider,
              name: tableAdvisor.advisorProfile.displayName,
              provider: tableAdvisor.advisorProfile.provider,
              enabled: tableAdvisor.enabled,
              position: tableAdvisor.position,
            })),
          })),
        })),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to load sidebar" });
    }
});
