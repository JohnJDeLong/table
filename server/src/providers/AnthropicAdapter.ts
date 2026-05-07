import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, ProviderMessage, UrgencyRating, ProviderCallOptions } from "./types.js";
import { parseUrgencyRating } from "./parseUrgencyRating.js";


export class AnthropicAdapter implements LLMProvider { 
    private client: Anthropic; 

    constructor(apiKey: string | undefined) {
        this.client = new Anthropic({
            apiKey,
        });
    }
    async rateUrgency(systemPrompt: string, conversation: ProviderMessage[], options?: ProviderCallOptions): Promise<UrgencyRating> {
        const urgencyPrompt = [systemPrompt,
            `You are the Anthropic advisor in a room with other AI advisors and a human user.

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
            .join("\n\n")

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
