import { GoogleGenAI } from "@google/genai";
import type { LLMProvider, ProviderCallOptions, ProviderMessage, UrgencyRating } from "./types.js";
import { parseUrgencyRating } from "./parseUrgencyRating.js";
import { buildUrgencyPrompt } from "./buildUrgencyPrompt.js";


export class GeminiAdapter implements LLMProvider { 
    private client: GoogleGenAI; 

    constructor(apiKey: string | undefined) {
        this.client = new GoogleGenAI({
            apiKey,
        });
    }

    async rateUrgency(systemPrompt: string, conversation: ProviderMessage[], options?: ProviderCallOptions): Promise<UrgencyRating> {
        const input = conversation
        .map((message) => `${message.role}: ${message.content}`)
        .join("\n\n");

        const urgencyInstructions = buildUrgencyPrompt("Gemini", systemPrompt);


        if (options?.signal?.aborted) {
            throw new Error("Gemini request aborted");
        }


        const response = await this.client.models.generateContent(
            {
                model: "gemini-2.5-flash-lite",
                contents: input,
                config: {
                    systemInstruction: urgencyInstructions,
                },
            }
        );

        return parseUrgencyRating(response.text ?? "");

        
    }

    async *streamResponse(systemPrompt: string, conversation: ProviderMessage[], options?: ProviderCallOptions): AsyncIterable<string> {
        const input = conversation.map((message) =>`${message.role}: ${message.content}`).join("\n\n");

        const stream = await this.client.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: input, 
            config: {
                systemInstruction: systemPrompt || undefined,
            },
        });

        for await( const chunk of stream) {
            if(options?.signal?.aborted) {
                break;
            }
            if (chunk.text) {
                yield chunk.text; 
            }
        }
    }
}