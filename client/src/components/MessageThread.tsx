import { useEffect, useRef } from "react";
import type { ChatMessage, StreamState } from "../types/chat";

type MessageThreadProps = {
  messages: ChatMessage[];
  response: StreamState | null;
  getSpeakerName: (speakerId: string) => string;
};

export function MessageThread({
  messages,
  response,
  getSpeakerName,
}: MessageThreadProps) {
    const threadEndRef = useRef<HTMLDivElement | null>(null);
    
    useEffect(() => {
        threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, [messages]);
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
