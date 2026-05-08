import OpenAI from "openai";
import type { LLMProvider, ProviderCallOptions, ProviderMessage, UrgencyRating } from "./types.js";
import { parseUrgencyRating } from "./parseUrgencyRating.js";
import { buildUrgencyPrompt } from "./buildUrgencyPrompt.js";


export class GrokAdapter implements LLMProvider {
  private client: OpenAI;

  constructor(apiKey: string | undefined) {
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://api.x.ai/v1",
      timeout: 360000,
    });
  }

  async rateUrgency(systemPrompt: string, conversation: ProviderMessage[], options?: ProviderCallOptions): Promise<UrgencyRating> {
        const messages = [
    {
        role: "system" as const,
        content: buildUrgencyPrompt("Grok",systemPrompt),
    },
    ...conversation.map((message) => ({
        role: message.role,
        content: message.content,
    })),
    ];

    if (options?.signal?.aborted) {
    throw new Error("Grok request aborted");
    }

    const response = await this.client.chat.completions.create(
    {
        model: "grok-4.3",
        messages,
    },
    {
        signal: options?.signal,
    }
    );

    const text = response.choices[0]?.message.content ?? "";

    return parseUrgencyRating(text);

    
  }

  async *streamResponse(systemPrompt: string, conversation: ProviderMessage[], options?: ProviderCallOptions): AsyncIterable<string> {
        const messages = [
        {
        role: "system" as const,
        content: systemPrompt || "You are the Grok advisor at Table.",
        },
        ...conversation.map((message) => ({
        role: message.role,
        content: message.content,
        })),
    ];

    if (options?.signal?.aborted) {
        return;
    }

    const stream = await this.client.chat.completions.create(
        {
        model: "grok-4.3",
        messages,
        stream: true,
        },
        {
        signal: options?.signal,
        }
    );

    for await (const chunk of stream) {
        if (options?.signal?.aborted) {
        break;
        }

        const text = chunk.choices[0]?.delta.content;

        if (text) {
        yield text;
        }
    }
    
  }
}
