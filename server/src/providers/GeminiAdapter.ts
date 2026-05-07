import { GoogleGenAI } from "@google/genai";
import type { LLMProvider, ProviderCallOptions, ProviderMessage, UrgencyRating } from "./types.js";
import { parseUrgencyRating } from "./parseUrgencyRating.js";

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

        const urgencyInstructions = [
        systemPrompt,
        `You are the Gemini advisor in a room with other AI advisors and a human user.

        Each participant may notice different risks, opportunities, tradeoffs, or useful next steps.

        Rate how urgently you should speak next in the current conversation.

        Do not answer the user yet. This is only a routing decision.

        Return only valid JSON. Do not include Markdown, headings, code fences, or commentary.

        JSON shape:
        {"urgency": 0, "reason": "short explanation"}

        Rules:
        - urgency must be a number from 0 to 10
        - reason must be one short sentence
        - 0 means you should stay silent
        - 10 means you should speak immediately
        - speak when your contribution would add meaningful value
        - stay quieter when another participant is likely to cover the point just as well`,
        ]
            .filter(Boolean)
            .join("\n\n");

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