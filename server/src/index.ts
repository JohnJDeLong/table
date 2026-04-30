import express from "express";
import type { Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config({ path: '../.env' }); 

const app = express(); 
const port = Number(process.env.PORT) || 3001; 

app.use(cors({ origin: 'http://localhost:5173'}));
app.use(express.json())

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
})

function sendSse(res: Response, event: string, data: unknown) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`); 
}

app.get("/api/health", (_req, res) => {
    res.json({ ok: true}); 
});

app.post("/api/test", async (req, res) => {
    try{
        if (!process.env.ANTHROPIC_API_KEY) { 
            res.status(500).json({ error: "ANTHROPIC_API_KEY is not set"});
            return 
        }

        const prompt = typeof req.body.prompt === 'string' && req.body.prompt.trim().length > 0 
            ? req.body.prompt 
            : "Say hello from Table in one sentence."; 

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        sendSse(res, "speaker_start", { advisorId: "anthropic" });


        const stream = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 300, 
            messages: [{role: 'user', content: prompt}], 
            stream: true,
        });
        
        for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                sendSse(res, "token", {
                    advisorId: "anthropic",
                    text: event.delta.text,
                });
            }
        }

        sendSse(res, "speaker_end", { advisorId: "anthropic" });
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
