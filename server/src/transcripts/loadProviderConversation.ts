import { prisma } from "../config/prisma.js"
import { SpeakerType } from "../generated/prisma/enums.js";
import { ProviderMessage } from "../providers/types.js";


export async function loadProviderConversation(conversationId: string): Promise<ProviderMessage[]> {
    const messages = await prisma.message.findMany({
        where: { conversationId},
        orderBy: { turnIndex: "asc"},
    });

    return messages.map((message) => {
        if (message.speakerType === SpeakerType.user) {
            return {
                role: 'user',
                content: message.content,
            };
        }

        const speaker = message.speakerId ?? message.provider ?? "advisor";
        return {
            role: "user",
            content: `${speaker} advisor said: \n${message.content}`,

        };
    });
}