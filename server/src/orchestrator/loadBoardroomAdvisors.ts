import { prisma } from "../config/prisma.js";
import { Provider } from "../generated/prisma/enums.js";
import { AnthropicAdapter } from "../providers/AnthropicAdapter.js";
import { OpenAIAdapter } from "../providers/OpenAIAdapter.js";
import type { LLMProvider } from "../providers/types.js";
import type { Advisor } from "./rankAdvisorsByUrgency.js";
import { GeminiAdapter } from "../providers/GeminiAdapter.js";
import { GrokAdapter } from "../providers/GrokAdapter.js";

const defaultBoardroomId = "seed_boardroom_default";

function createProviderAdapter(provider: Provider): LLMProvider | null {

    if (provider === Provider.anthropic) {
        return new AnthropicAdapter(process.env.ANTHROPIC_API_KEY);
    }

    if (provider === Provider.openai) {
        return new OpenAIAdapter(process.env.OPENAI_API_KEY);
    }

    if (provider === Provider.gemini) {
        return new GeminiAdapter(process.env.GEMINI_API_KEY);
    }
    
    if (provider === Provider.grok) {
        return new GrokAdapter(process.env.XAI_API_KEY);
    }


  return null;
}

export async function loadBoardroomAdvisors(boardroomId = defaultBoardroomId): Promise<Advisor[]> {
    const boardroomAdvisors = await prisma.boardroomAdvisor.findMany({
        where: {
            boardroomId,
            enabled: true,
        },
        include: {
            advisorProfile: true,
        },
        orderBy: {
            position: "asc",
        },
    });

    return boardroomAdvisors.flatMap((boardroomAdvisor) => {
        const profile = boardroomAdvisor.advisorProfile;
        const provider = createProviderAdapter(profile.provider);

        if (!provider) {
            return [];
        }
        return [
            {
                id: profile.provider,
                provider,
                dbProvider: profile.provider,
                systemPrompt: profile.systemPrompt,
            },
        ]

    });
}