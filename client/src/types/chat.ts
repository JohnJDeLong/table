export type StreamState = {
  text: string;
  error?: string;
};

export type UrgencyRating = {
  advisorId: string;
  urgency: number;
  reason: string;
};

export type ChatMessage = {
  id: string;
  speakerId: string;
  speakerType: "user" | "advisor";
  text: string;
};
