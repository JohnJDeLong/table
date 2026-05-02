import OpenAI from "openai";
import type { LLMProvider, ProviderMessage, UrgencyRating } from "./types.js";
import { parseUrgencyRating } from "./parseUrgencyRating.js";


export class OpenAIAdapter implements LLMProvider {
  private client: OpenAI;

  constructor(apiKey: string | undefined) {
    this.client = new OpenAI({
      apiKey,
    });
  }

  async rateUrgency(systemPrompt: string, conversation: ProviderMessage[]): Promise<UrgencyRating> {
    const input = conversation
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n\n");
      const urgencyInstructions = [
          systemPrompt,
          `You are the OpenAI advisor in a room with other AI advisors and a human user.

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

      const response = await this.client.responses.create({
        model: "gpt-5.5",
        instructions: urgencyInstructions,
        input,
      });

      return parseUrgencyRating(response.output_text);
    
  }

  async *streamResponse(systemPrompt: string, conversation: ProviderMessage[]): AsyncIterable<string> {
    const input = conversation
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n\n");

    const stream = await this.client.responses.create({
      model: "gpt-5.5",
      instructions: systemPrompt || undefined,
      input,
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        yield event.delta;
      }
    }
  }
}
