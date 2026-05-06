export type UrgencyRating = {
  urgency: number;
  reason: string;
};


export type ProviderMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ProviderCallOptions = { 
  signal?: AbortSignal;
}

export interface LLMProvider {
  rateUrgency(systemPrompt: string, conversation: ProviderMessage[], options?: ProviderCallOptions): Promise<UrgencyRating>;
  streamResponse(systemPrompt: string,conversation: ProviderMessage[], options?: ProviderCallOptions): AsyncIterable<string>;
}
