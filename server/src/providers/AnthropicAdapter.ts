import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, ProviderMessage, UrgencyRating, ProviderCallOptions } from "./types.js";
import { parseUrgencyRating } from "./parseUrgencyRating.js";
import { buildUrgencyPrompt } from "./buildUrgencyPrompt.js";


export class AnthropicAdapter implements LLMProvider { 
    private client: Anthropic; 

    constructor(apiKey: string | undefined) {
        this.client = new Anthropic({
            apiKey,
        });
    }
    async rateUrgency(systemPrompt: string, conversation: ProviderMessage[], options?: ProviderCallOptions): Promise<UrgencyRating> {
        const urgencyPrompt = buildUrgencyPrompt("Claude", systemPrompt);


        const message = await this.client.messages.create(
            {
                model: "claude-haiku-4-5-20251001",
                max_tokens: 200,
                system: urgencyPrompt,
                messages: conversation,
            },
            {
                signal: options?.signal,
            }
        );

        const text = message.content
            .map((block) => (block.type === "text" ? block.text : ""))
            .join('')
            .trim();

        return parseUrgencyRating(text); 
    }

    async *streamResponse(systemPrompt: string, conversation: ProviderMessage[], options?: ProviderCallOptions): AsyncIterable<string> {
        const stream = await this.client.messages.create(
            {
                model: "claude-haiku-4-5-20251001",
                max_tokens: 300,
                system: systemPrompt || undefined,
                messages: conversation,
                stream: true,
            },
            {
                signal: options?.signal,
            }
        );

        for await (const event of stream ) {
            if( event.type === "content_block_delta" && event.delta.type === "text_delta") { 
                yield event.delta.text;
            }
        }
    }
}
