export type UrgencyRating = {
  urgency: number;
  reason: string;
};


export type ProviderMessage = {
  role: "user" | "assistant";
  content: string;
};

export interface LLMProvider {
  rateUrgency(systemPrompt: string, conversation: ProviderMessage[]): Promise<UrgencyRating>;
  streamResponse(systemPrompt: string,conversation: ProviderMessage[]): AsyncIterable<string>;
}