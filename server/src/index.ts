import express from "express";
import type { Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AnthropicAdapter } from "./providers/AnthropicAdapter.js";
import type { ProviderMessage } from "./providers/types.js";

dotenv.config({ path: '../.env' }); 

const app = express(); 
const port = Number(process.env.PORT) || 3001; 

app.use(cors({ origin: 'http://localhost:5173'}));
app.use(express.json())

const anthropicProvider = new AnthropicAdapter(process.env.ANTHROPIC_API_KEY)

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


        const conversation: ProviderMessage[] = [{ role: "user", content: prompt}];

        for await (const text of anthropicProvider.streamResponse("",conversation)) {
            sendSse(res, "token", {
                advisorId: "anthropic",
                text,
            });
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
