import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, ProviderMessage } from "./types.js";


export class AnthropicAdapter implements LLMProvider { 
    private client: Anthropic; 

    constructor(apiKey: string | undefined) {
        this.client = new Anthropic({
            apiKey,
        });
    }

    async *streamResponse(_systemPrompt: string, conversation: ProviderMessage[]): AsyncIterable<string> {
        const stream = await this.client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens:300, 
            messages: conversation,
            stream: true, 
        });
        for await (const event of stream ) {
            if( event.type === "content_block_delta" && event.delta.type === "text_delta") { 
                yield event.delta.text;
            }
        }
    }
}