import express from "express";
import type { Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AnthropicAdapter } from "./providers/AnthropicAdapter.js";
import { OpenAIAdapter } from "./providers/OpenAIAdapter.js";
import type { LLMProvider, ProviderMessage } from "./providers/types.js";
import { rankAdvisorsByUrgency, type Advisor } from "./orchestrator/rankAdvisorsByUrgency.js";
import { runAdvisorRound, type RoundEvent } from "./orchestrator/runAdvisorRound.js";
import { prisma } from "./config/prisma.js"
import { Provider, MessageStatus } from "./generated/prisma/enums.js";
import type { Prisma } from "./generated/prisma/client.js";
import { createConversation } from "./transcripts/createConversation.js";
import { saveAdvisorMessage, markAdvisorMessageStatus, updateAdvisorMessage } from "./transcripts/saveAdvisorMessage.js";
import { saveRoundEvent } from "./events/saveRoundEvent.js";
import { loadBoardroomAdvisors } from "./orchestrator/loadBoardroomAdvisors.js";
import { saveUserMessage } from "./transcripts/saveUserMessage.js";
import { loadProviderConversation } from "./transcripts/loadProviderConversation.js";

dotenv.config({ path: '../.env' }); 

const app = express(); 
const port = Number(process.env.PORT) || 3001; 

app.use(cors({ origin: 'http://localhost:5173'}));
app.use(express.json())

const anthropicProvider = new AnthropicAdapter(process.env.ANTHROPIC_API_KEY);
const openaiProvider = new OpenAIAdapter(process.env.OPENAI_API_KEY);

const activeRoundControllers = new Map<string, AbortController>();


function getRoundEventPayload(event:RoundEvent): Prisma.InputJsonValue {
  return event as Prisma.InputJsonValue;
}


function sendSse(res: Response, event: string, data: unknown) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`); 
}

app.get("/api/health", (_req, res) => {
    res.json({ ok: true}); 
});

//smoke test route 
app.get("/api/db-test", async (_req, res) => {
  try {
    const [userCount, workspaceCount, boardroomCount, advisorCount, conversationCount, messageCount, roundEventCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.workspace.count(),
        prisma.boardroom.count(),
        prisma.advisorProfile.count(),
        prisma.conversation.count(),
        prisma.message.count(),
        prisma.roundEvent.count(),

      ]);

    res.json({
      ok: true,
      userCount,
      workspaceCount,
      boardroomCount,
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


app.post("/api/urgency-test", async (req, res) => {
  try {
    const prompt =
      typeof req.body.prompt === "string" && req.body.prompt.trim().length > 0
        ? req.body.prompt
        : "Should I respond to this conversation?";

    const conversation: ProviderMessage[] = Array.isArray(req.body.conversation)
      ? req.body.conversation
      : [{ role: "user", content: prompt }];
    
    const advisors = await loadBoardroomAdvisors(); 

    const ratings = await rankAdvisorsByUrgency(advisors, conversation);

    res.json({ ratings });


  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to rate urgency" });
  }
});


app.post("/api/conversations/:conversationId/stop", (req, res) => {
  const controller = activeRoundControllers.get(req.params.conversationId);

  if (!controller) {
    res.json({ ok: true, stopped: false });
    return;
  }

  controller?.abort();
  activeRoundControllers.delete(req.params.conversationId);

  res.json({ ok: true, stopped: true });
});


app.post("/api/round-test", async (req, res) => {
  let clientDisconnected = false; 
  let activeConversationId: string | null = null;

  res.on("close", ()=> {clientDisconnected = true });

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
    
    const advisors = await loadBoardroomAdvisors(); 


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




app.post("/api/test", async (req, res) => {
    try{
        const providerId = req.body.provider === "openai" ? "openai" : "anthropic";

        const provider: LLMProvider = providerId === "openai" ? openaiProvider : anthropicProvider;
        const missingApiKey = providerId === "openai" ? !process.env.OPENAI_API_KEY : !process.env.ANTHROPIC_API_KEY;

        if (missingApiKey) {
            res.status(500).json({ error: `${providerId} API key is not set` });
            return;
        }
        const prompt = typeof req.body.prompt === 'string' && req.body.prompt.trim().length > 0 
            ? req.body.prompt 
            : "Say hello from Table in one sentence."; 

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        sendSse(res, "speaker_start", { advisorId: providerId });


        const conversation: ProviderMessage[] = [{ role: "user", content: prompt}];

        for await (const text of provider.streamResponse("",conversation)) {
            sendSse(res, "token", {
                advisorId: providerId,
                text,
            });
        }

        sendSse(res, "speaker_end", { advisorId: providerId });
        res.end();
    } catch (error) {
        console.error(error); 

        if (!res.headersSent) { 
            res.status(500).json({ error: "Failed to call Anthropic" });
            return; 
        }
        sendSse(res, "error", { message: "Failed to call Anthropic" });
        res.end();
    }
});



app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
