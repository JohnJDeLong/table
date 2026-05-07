import { prisma } from "../config/prisma.js";
import { Provider, SpeakerType, MessageStatus } from "../generated/prisma/enums.js";

type SaveAdvisorMessageInput = {
  conversationId: string;
  advisorId: string;
  provider: Provider;
  turnIndex: number;
  content: string;
  status?: MessageStatus;
};

type UpdateAdvisorMessageInput = {
  messageId: string;
  content: string;
  status?: MessageStatus;
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
      status: input.status ?? MessageStatus.complete,
    },
  });
}

export async function updateAdvisorMessage(input: UpdateAdvisorMessageInput) {
  return prisma.message.update({
    where: { id: input.messageId },
    data: {
      content: input.content,
      status: input.status,
    },
  });
}

export async function markAdvisorMessageStatus(
  messageId: string,
  status: MessageStatus
) {
  return prisma.message.update({
    where: { id: messageId },
    data: { status },
  });
}

