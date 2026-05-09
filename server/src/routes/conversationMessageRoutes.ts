import { Router, type Response } from "express";
import { activeRoundControllers } from "../services/activeRoundControllers.js";
import { prisma } from "../config/prisma.js";
import { MessageStatus } from "../generated/prisma/enums.js";
import type { Prisma } from "../generated/prisma/client.js";
import { createConversation } from "../transcripts/createConversation.js";
import { saveUserMessage } from "../transcripts/saveUserMessage.js";
import { loadProviderConversation } from "../transcripts/loadProviderConversation.js";
import { loadTableAdvisors } from "../orchestrator/loadTableAdvisors.js";
import { runAdvisorRound, type RoundEvent } from "../orchestrator/runAdvisorRound.js";
import { saveRoundEvent } from "../events/saveRoundEvent.js";
import { markAdvisorMessageStatus, saveAdvisorMessage, updateAdvisorMessage } from "../transcripts/saveAdvisorMessage.js";
import { sendSse } from "../utils/sendSse.js";


export const conversationMessageRouter = Router();

function getRoundEventPayload(event: RoundEvent): Prisma.InputJsonValue {
  return event as Prisma.InputJsonValue;
}



conversationMessageRouter.post("/messages", async (req, res) => {
  let clientDisconnected = false;
  let activeConversationId: string | null = null;

  res.on("close", () => {
    clientDisconnected = true;
  });
    try {
      
      const prompt =
        typeof req.body.prompt === "string" && req.body.prompt.trim().length > 0
          ? req.body.prompt
          : "Start a short advisor round.";
  
      const requestedConversationId = typeof req.body.conversationId === "string" && req.body.conversationId.length > 0
        ? req.body.conversationId
        : null;
  
      let savedConversation; 
  
      if (requestedConversationId) {
        savedConversation = await prisma.conversation.findUnique({
          where: { id: requestedConversationId},
        });
  
        if(!savedConversation) {
          res.status(404).json({ error: "Conversation not found" }); 
          return; 
        }
  
        const latestMessage = await prisma.message.findFirst({
          where: { conversationId: savedConversation.id },
          orderBy: { turnIndex: "desc"},
          select: { turnIndex: true }, 
        });
  
        await saveUserMessage({
          conversationId: savedConversation.id, 
          turnIndex: (latestMessage?.turnIndex ?? -1) + 1, 
          content: prompt,
  
        });
      } else{
        savedConversation = await createConversation(prompt);
      }
  
      activeConversationId = savedConversation.id;
  
      const roundController = new AbortController();
      activeRoundControllers.set(savedConversation.id, roundController);
      const conversation = await loadProviderConversation(savedConversation.id);
      
  
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();
  
      sendSse(res, "conversation_ready", { conversationId: savedConversation.id });
  
      const latestRoundEvent = await prisma.roundEvent.findFirst({
        where: { conversationId: savedConversation.id },
        orderBy: { sequence: "desc" },
        select: { sequence: true },
      });
  
      const latestMessage = await prisma.message.findFirst({
        where: { conversationId: savedConversation.id },
        orderBy: { turnIndex: "desc" },
        select: { turnIndex: true },
      });
  
      let sequence = (latestRoundEvent?.sequence ?? -1) + 1;
      let turnIndex = (latestMessage?.turnIndex ?? -1) + 1;
  
      const responseTextByAdvisor = new Map<string, string>();
      const messageIdByAdvisor = new Map<string, string>();
      
      const advisors = await loadTableAdvisors();
  
  
      for await (const event of runAdvisorRound(advisors, conversation, {
        speakingThreshold: 3,
        maxTurnsPerRound: 10,
        signal: roundController.signal, 
      })) {
        if (roundController.signal.aborted || clientDisconnected || res.destroyed || res.writableEnded) {
          break; 
        }
        sendSse(res, event.type, event);
  
        await saveRoundEvent({
          conversationId: savedConversation.id,
          sequence,
          type: event.type,
          advisorId: "advisorId" in event ? event.advisorId : undefined, 
          payload: getRoundEventPayload(event),
        });
  
        sequence += 1; 
  
  
        if (event.type === "speaker_start") {
          const advisor = advisors.find((candidate) => candidate.id === event.advisorId);
  
          if (advisor) {
            const message = await saveAdvisorMessage({
              conversationId: savedConversation.id,
              advisorId: event.advisorId,
              provider: advisor.dbProvider,
              turnIndex,
              content: "",
              status: MessageStatus.streaming,
            });
  
            messageIdByAdvisor.set(event.advisorId, message.id);
          }
        }
  
  
        if (event.type === "token") {
          const nextContent = `${responseTextByAdvisor.get(event.advisorId) ?? ""}${event.text}`;
  
          responseTextByAdvisor.set(event.advisorId, nextContent);
  
          const messageId = messageIdByAdvisor.get(event.advisorId);
  
          if (messageId) {
            await updateAdvisorMessage({
              messageId,
              content: nextContent,
            });
          }
        }
  
  
        if (event.type === "speaker_end") {
          const messageId = messageIdByAdvisor.get(event.advisorId);
  
          if (messageId) {
            await markAdvisorMessageStatus(messageId, MessageStatus.complete);
            messageIdByAdvisor.delete(event.advisorId);
          }
  
          responseTextByAdvisor.delete(event.advisorId);
          turnIndex += 1;
        }
  
      }
  
      if (messageIdByAdvisor.size > 0) {
        const finalStatus = roundController.signal.aborted
          ? MessageStatus.cancelled
          : MessageStatus.failed;
  
        for (const messageId of messageIdByAdvisor.values()) {
          await markAdvisorMessageStatus(messageId, finalStatus);
        }
      }
  
  
  
      if (!clientDisconnected && !res.writableEnded) {
        res.end();
      }
    } catch (error) {
      console.error(error);
  
      if (clientDisconnected || res.destroyed || res.writableEnded) {
        return;
      }
  
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to run advisor round" });
        return;
      }
  
      sendSse(res, "error", { message: "Failed to run advisor round" });
      res.end();
    } finally {
      if (activeConversationId) {
        activeRoundControllers.delete(activeConversationId);
      }
    }
});
