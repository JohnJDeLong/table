import { useRef, useState, type SyntheticEvent } from "react";
import "./App.css";
import { Composer } from "./components/Composer";
import { MessageThread } from "./components/MessageThread";
import { Sidebar } from "./components/Sidebar";
import { useSidebarData } from "./hooks/useSidebarData";
import type { ChatMessage, StreamState, UrgencyRating } from "./types/chat";
import { parseSseEvent } from "./utils/parseSseEvent";

function App() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<StreamState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [urgencyRatings, setUrgencyRatings] = useState<UrgencyRating[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const {
    activeWorkspace,
    activeTable,
    sidebarAdvisors,
    selectActiveTable,
    getSpeakerName,
  } = useSidebarData();

  const abortControllerRef = useRef<AbortController | null>(null);


  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault(); // prevents entire page reload

    if (isLoading) {
      return;
    }

    const submittedPrompt = prompt.trim();

    if (!submittedPrompt) {
      return;
    }

    setPrompt("");
    setUrgencyRatings([]);

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        speakerId: "User",
        speakerType: "user",
        text: submittedPrompt,
      },
    ]);

    setIsLoading(true); // ui will use this to disable submit button and render loading indicator.
    setResponse({ text: "" }); // starts a fresh streamed response
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // post request made to front end that get forwarded to backend via configured proxy
      const res = await fetch("/api/conversations/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: submittedPrompt, conversationId }),
        signal: abortController.signal,
      });

      if (!res.body) {
        setResponse({ text: "", error: "No response stream returned." });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const eventText of events) {
          const parsedEvent = parseSseEvent(eventText);

            if (!parsedEvent) {
              continue;
            }

            const { eventName, data } = parsedEvent;
            const eventData = data as {
              conversationId?: string;
              scores?: UrgencyRating[];
              advisorId?: string;
              text?: string;
              message?: string;
            };


          if (eventName === "conversation_ready" && eventData.conversationId) {
            setConversationId(eventData.conversationId);
          }

          if (eventName === "urgency_scores" && eventData.scores) {
            setUrgencyRatings(eventData.scores);
          }

          if (eventName === "speaker_start" && eventData.advisorId) {
            const advisorId = eventData.advisorId; 
            setMessages((current) => [
              ...current,
              {
                id: crypto.randomUUID(),
                speakerId: advisorId,
                speakerType: "advisor",
                text: "",
              },
            ]);
          }

          if (eventName === "token" && eventData.advisorId && eventData.text) {
            const advisorId = eventData.advisorId;
            const text = eventData.text;
            setMessages((current) => {
              const next = [...current];
              const lastMessage = next[next.length - 1];

              if (
                !lastMessage ||
                lastMessage.speakerType !== "advisor" ||
                lastMessage.speakerId !== advisorId
              ) {
                return [
                  ...next,
                  {
                    id: crypto.randomUUID(),
                    speakerId: advisorId,
                    speakerType: "advisor",
                    text,
                  },
                ];
              }

              next[next.length - 1] = {
                ...lastMessage,
                text: `${lastMessage.text}${text}`,
              };

              return next;
            });
          }

          if (eventName === "error") {
            setResponse({
              text: "",
              error: eventData.message,
            });
          }
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setResponse({ text: "", error: "Failed to stream response." });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }

  async function handleStop() {
    if (conversationId) {
      await fetch(`/api/conversations/${conversationId}/stop`, {
        method: "POST",
      });
    }
    abortControllerRef.current?.abort();
  }

  return (
    <main className="app-shell">
      <Sidebar
        activeWorkspace={activeWorkspace}
        activeTable={activeTable}
        sidebarAdvisors={sidebarAdvisors}
        urgencyRatings={urgencyRatings}
        selectActiveTable={selectActiveTable}
      />
      <section className="room-shell">
        <header className="room-header">
          <h1 className="room-title">Table</h1>
          <p className="room-subtitle">
            A live room for multi-advisor decisions.
          </p>
        </header>

        <MessageThread
          messages={messages}
          response={response}
          getSpeakerName={getSpeakerName}
        />

        <Composer
          prompt={prompt}
          isLoading={isLoading}
          onPromptChange={setPrompt}
          onSubmit={handleSubmit}
          onStop={handleStop}
        />
      </section>
    </main>
  );
}

export default App;
