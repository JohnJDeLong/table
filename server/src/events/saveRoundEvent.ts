import { prisma } from "../config/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import { RoundEventType } from "../generated/prisma/enums.js";

type SaveRoundEventInput = {
  conversationId: string;
  sequence: number;
  type: RoundEventType;
  advisorId?: string;
  payload: Prisma.InputJsonValue;
};

export async function saveRoundEvent(input: SaveRoundEventInput) {
  return prisma.roundEvent.create({
    data: {
      conversationId: input.conversationId,
      sequence: input.sequence,
      type: input.type,
      advisorId: input.advisorId,
      payload: input.payload,
    },
  });
}
