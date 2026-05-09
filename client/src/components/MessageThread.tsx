import type { RefObject } from "react";
import type { ChatMessage, StreamState } from "../types/chat";



type MessageThreadProps = {
  messages: ChatMessage[];
  response: StreamState | null;
  getSpeakerName: (speakerId: string) => string;
  threadEndRef: RefObject<HTMLDivElement | null>;
};

export function MessageThread({
  messages,
  response,
  getSpeakerName,
  threadEndRef,
}: MessageThreadProps) {
  return (
    <section className="room-thread">
      {messages.map((message) => (
        <article
          className={`message-block message-block--${message.speakerType}`}
          key={message.id}
        >
          <p className="speaker">{getSpeakerName(message.speakerId)}</p>
          <p className="message-text">{message.text}</p>
        </article>
      ))}

      {response?.error && (
        <article className="message-block message-block--error">
          <p className="speaker">Error</p>
          <p className="message-text">{response.error}</p>
        </article>
      )}

      <div ref={threadEndRef} />
    </section>
  );
}
