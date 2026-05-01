import OpenAI from "openai";
import type { LLMProvider, ProviderMessage } from "./types.js";


export class OpenAIAdapter implements LLMProvider {
  private client: OpenAI;

  constructor(apiKey: string | undefined) {
    this.client = new OpenAI({
      apiKey,
    });
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
