import { prisma } from "../config/prisma.js";
import { SpeakerType } from "../generated/prisma/enums.js";

const defaultWorkspaceId = "seed_workspace_default"; 
const defaultBoardroomId = "seed_boardroom_default"; 

export async function createConversation(initialPrompt: string) {
    const conversation = await prisma.conversation.create({
        data: {
            workspaceId: defaultWorkspaceId,
            boardroomId: defaultBoardroomId,
            title: initialPrompt.slice(0,80),
            initialPrompt,
            messages: {
                create: {
                    speakerType: SpeakerType.user,
                    turnIndex: 0, 
                    content: initialPrompt,
                },
            },
        },
        include: {
            messages: true,
        },
    });
    return conversation; 
}