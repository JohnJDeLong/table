import express from "express";
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

        const message = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 300, 
            messages: [{role: 'user', content: prompt}], 
        });

        const text = message.content.map((block) => (block.type === 'text' ? block.text : '')).join('');
        res.json({ text, usage: message.usage });
    } catch (error) {
        console.error(error); 
        res.status(500).json({ error: "Failed to call Anthropic"}); 
    }
});



app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
