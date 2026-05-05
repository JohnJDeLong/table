import { prisma } from "../config/prisma.js";
import { Provider, SpeakerType } from "../generated/prisma/enums.js";

type SaveAdvisorMessageInput = {
  conversationId: string;
  advisorId: string;
  provider: Provider;
  turnIndex: number;
  content: string;
};

export async function saveAdvisorMessage(input: SaveAdvisorMessageInput) {
  return prisma.message.create({
    data: {
      conversationId: input.conversationId,
      speakerType: SpeakerType.advisor,
      speakerId: input.advisorId,
      provider: input.provider,
      turnIndex: input.turnIndex,
      content: input.content,
    },
  });
}
