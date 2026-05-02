import type { UrgencyRating } from "./types.js";

export function parseUrgencyRating(rawText: string): UrgencyRating {
  const trimmed = rawText.trim();

  const withoutCodeFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const jsonStart = withoutCodeFence.indexOf("{");
  const jsonEnd = withoutCodeFence.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
    throw new Error(`Urgency rating did not include JSON: ${rawText}`);
  }

  const parsed = JSON.parse(
    withoutCodeFence.slice(jsonStart, jsonEnd + 1)
  ) as Partial<UrgencyRating>;

  const urgency = Number(parsed.urgency);

  return {
    urgency: Number.isFinite(urgency) ? Math.max(0, Math.min(10, urgency)) : 0,
    reason:
      typeof parsed.reason === "string" && parsed.reason.trim().length > 0
        ? parsed.reason
        : "No reason returned.",
  };
}
