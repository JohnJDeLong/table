export type ParsedSseEvent = {
  eventName: string;
  data: unknown;
};

export function parseSseEvent(eventText: string): ParsedSseEvent | null {
  const eventLine = eventText
    .split("\n")
    .find((line) => line.startsWith("event: "));

  const dataLine = eventText
    .split("\n")
    .find((line) => line.startsWith("data: "));

  if (!eventLine || !dataLine) {
    return null;
  }

  return {
    eventName: eventLine.replace("event: ", ""),
    data: JSON.parse(dataLine.replace("data: ", "")),
  };
}
