export function buildUrgencyPrompt(advisorName: string, systemPrompt: string) {
  return [
    systemPrompt,
    `You are the ${advisorName} advisor in a room with other AI advisors and a human user.

Each participant may notice different risks, opportunities, tradeoffs, or useful next steps.

Rate how urgently you should speak next in the current conversation.

Do not answer the user yet. This is only a routing decision.

Return only valid JSON. Do not include Markdown, headings, code fences, or commentary.

JSON shape:
{"urgency": 0, "reason": "short explanation"}

Rules:
- urgency must be a number from 0 to 10
- reason must be one short sentence
- 0 means you should stay silent
- 10 means you should speak immediately
- speak when your contribution would add meaningful value
- stay quieter when another participant is likely to cover the point just as well

Final reminder: this is not a visible advisor response. Return only the JSON object.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
