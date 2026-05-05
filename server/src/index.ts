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
import { Provider } from "./generated/prisma/enums.js";
import type { Prisma } from "./generated/prisma/client.js";
import { createConversation } from "./transcripts/createConversation.js";
import { saveAdvisorMessage } from "./transcripts/saveAdvisorMessage.js";
import { saveRoundEvent } from "./events/saveRoundEvent.js";
import { loadBoardroomAdvisors } from "./orchestrator/loadBoardroomAdvisors.js";


dotenv.config({ path: '../.env' }); 

const app = express(); 
const port = Number(process.env.PORT) || 3001; 

app.use(cors({ origin: 'http://localhost:5173'}));
app.use(express.json())

const anthropicProvider = new AnthropicAdapter(process.env.ANTHROPIC_API_KEY);
const openaiProvider = new OpenAIAdapter(process.env.OPENAI_API_KEY);



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


app.post("/api/round-test", async (req, res) => {
  try {
    const prompt =
      typeof req.body.prompt === "string" && req.body.prompt.trim().length > 0
        ? req.body.prompt
        : "Start a short advisor round.";

    const savedConversation = await createConversation(prompt);
    const conversation: ProviderMessage[] = [{ role: "user", content: prompt }];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let sequence = 0; 
    let turnIndex = 1; 
    const responseTextByAdvisor = new Map<string, string>();
    
    const advisors = await loadBoardroomAdvisors(); 


    for await (const event of runAdvisorRound(advisors, conversation, {
      speakingThreshold: 3,
      maxTurnsPerRound: 10,
    })) {
      sendSse(res, event.type, event);
      await saveRoundEvent({
        conversationId: savedConversation.id,
        sequence,
        type: event.type,
        advisorId: "advisorId" in event ? event.advisorId : undefined, 
        payload: getRoundEventPayload(event),
      });

      sequence += 1; 

      if (event.type === 'token') {
        responseTextByAdvisor.set(
          event.advisorId,
          `${responseTextByAdvisor.get(event.advisorId) ?? ""}${event.text}`
        );
      }

      if (event.type === "speaker_end") {
        const advisor = advisors.find((candidate) => candidate.id === event.advisorId);
        const content = responseTextByAdvisor.get(event.advisorId) ?? ""; 

        if (advisor && content.trim().length > 0) {
          await saveAdvisorMessage({
            conversationId: savedConversation.id,
            advisorId: event.advisorId, 
            provider: advisor.dbProvider,
            turnIndex,
            content,
          });
          turnIndex += 1; 
          responseTextByAdvisor.delete(event.advisorId);
        }
      }
    }

    res.end();
  } catch (error) {
    console.error(error);

    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to run advisor round" });
      return;
    }

    sendSse(res, "error", { message: "Failed to run advisor round" });
    res.end();
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
