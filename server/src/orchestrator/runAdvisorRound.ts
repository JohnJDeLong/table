import { rankAdvisorsByUrgency, type Advisor, type AdvisorUrgencyRating } from "./rankAdvisorsByUrgency.js";
import type { ProviderMessage } from "../providers/types.js";

export type RoundEvent =
  | {
      type: "urgency_scores";
      scores: AdvisorUrgencyRating[];
    }
  | {
      type: "speaker_start";
      advisorId: string;
      urgency: number;
      reason: string;
    }
  | {
      type: "token";
      advisorId: string;
      text: string;
    }
  | {
      type: "speaker_end";
      advisorId: string;
    }
  | {
      type: "round_end";
      spokenAdvisorIds: string[];
    }
  | {
      type: "turn_cap_reached";
      maxTurnsPerRound: number;
    };

type RunAdvisorRoundOptions = {
  speakingThreshold: number;
  maxTurnsPerRound: number;
};

export async function* runAdvisorRound(
  advisors: Advisor[],
  conversation: ProviderMessage[],
  options: RunAdvisorRoundOptions
): AsyncIterable<RoundEvent> {
  const conversationSoFar = [...conversation];
  const spokenAdvisorIds: string[] = [];
  let turnCount = 0;

  while (turnCount < options.maxTurnsPerRound) {
    const ratings = await rankAdvisorsByUrgency(advisors, conversationSoFar);

    yield {
      type: "urgency_scores",
      scores: ratings,
    };

    const [topRating] = ratings;

    if (!topRating || topRating.urgency < options.speakingThreshold) {
      break;
    }

    const advisor = advisors.find(
      (candidate) => candidate.id === topRating.advisorId
    );

    if (!advisor) {
      break;
    }

    yield {
      type: "speaker_start",
      advisorId: advisor.id,
      urgency: topRating.urgency,
      reason: topRating.reason,
    };

    let responseText = "";

    for await (const text of advisor.provider.streamResponse(
      advisor.systemPrompt,
      conversationSoFar
    )) {
      responseText += text;

      yield {
        type: "token",
        advisorId: advisor.id,
        text,
      };
    }

    conversationSoFar.push({
        role: "user",
        content: `${advisor.id} advisor said:\n${responseText}`,
    });


    spokenAdvisorIds.push(advisor.id);
    turnCount += 1;

    yield {
      type: "speaker_end",
      advisorId: advisor.id,
    };
  }

  if (turnCount >= options.maxTurnsPerRound) {
    yield {
      type: "turn_cap_reached",
      maxTurnsPerRound: options.maxTurnsPerRound,
    };
  }

  yield {
    type: "round_end",
    spokenAdvisorIds,
  };
}
