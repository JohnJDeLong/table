import type { LLMProvider, ProviderMessage, UrgencyRating, } from "../providers/types.js";

export type Advisor = {
  id: string;
  provider: LLMProvider;
  systemPrompt: string;
};

export type AdvisorUrgencyRating = UrgencyRating & {
  advisorId: string;
};

export async function rankAdvisorsByUrgency(advisors: Advisor[], conversation: ProviderMessage[]): Promise<AdvisorUrgencyRating[]> {
  const ratingsWithOrder = await Promise.all(
    advisors.map(async (advisor, order) => {
      const rating = await advisor.provider.rateUrgency(
        advisor.systemPrompt,
        conversation
      );

      return {
        advisorId: advisor.id,
        order,
        ...rating,
      };
    })
  );

  return ratingsWithOrder
    .sort((a, b) => b.urgency - a.urgency || a.order - b.order)
    .map(({ order: _order, ...rating }) => rating);
}
