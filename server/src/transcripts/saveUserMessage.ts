import { prisma } from "../config/prisma.js";
import { SpeakerType } from "../generated/prisma/enums.js";

type SaveUserMessageInput = {
    conversationId: string;
    turnIndex: number; 
    content: string;
};


export async function saveUserMessage(input: SaveUserMessageInput) {
    return prisma.message.create({
        data: {
            conversationId: input.conversationId,
            speakerType: SpeakerType.user,
            turnIndex: input.turnIndex,
            content: input.content,
        },
    });
}