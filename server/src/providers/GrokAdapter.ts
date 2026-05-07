import OpenAI from "openai";
import type { LLMProvider, ProviderCallOptions, ProviderMessage, UrgencyRating } from "./types.js";
import { parseUrgencyRating } from "./parseUrgencyRating.js";

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
        content: [
        systemPrompt,
        `You are the Grok advisor in a room with other AI advisors and a human user.

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
        .join("\n\n"),
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
        model: "grok-4-1-fast-non-reasoning",
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
