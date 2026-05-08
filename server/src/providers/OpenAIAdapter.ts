import OpenAI from "openai";
import type { LLMProvider, ProviderMessage, UrgencyRating, ProviderCallOptions } from "./types.js";
import { parseUrgencyRating } from "./parseUrgencyRating.js";
import { buildUrgencyPrompt } from "./buildUrgencyPrompt.js";


export class OpenAIAdapter implements LLMProvider {
  private client: OpenAI;

  constructor(apiKey: string | undefined) {
    this.client = new OpenAI({
      apiKey,
    });
  }

  async rateUrgency(systemPrompt: string, conversation: ProviderMessage[], options?: ProviderCallOptions): Promise<UrgencyRating> {
    const input = conversation
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n\n");
      
      const urgencyInstructions = buildUrgencyPrompt("OpenAI", systemPrompt);


      const response = await this.client.responses.create(
        {
          model: "gpt-5.5",
          instructions: urgencyInstructions,
          input,
        },
        {
          signal: options?.signal,
        }
    );

      return parseUrgencyRating(response.output_text);
    
  }

  async *streamResponse(systemPrompt: string, conversation: ProviderMessage[], options?: ProviderCallOptions): AsyncIterable<string> {
    const input = conversation
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n\n");

    const stream = await this.client.responses.create(
      {
        model: "gpt-5.5",
        instructions: systemPrompt || undefined,
        input,
        stream: true,
      },
      {
        signal: options?.signal,
      }
    );

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        yield event.delta;
      }
    }
  }
}
