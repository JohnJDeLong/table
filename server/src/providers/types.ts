export type ProviderMessage = {
  role: "user" | "assistant";
  content: string;
};

export interface LLMProvider {
  streamResponse(
    systemPrompt: string,
    conversation: ProviderMessage[]
  ): AsyncIterable<string>;
}