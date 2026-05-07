import { useEffect, useRef, useState, type CSSProperties, type SyntheticEvent, } from 'react';
import './App.css';

type StreamState = { 
  text: string;
  error?: string;
};



type UrgencyRating = {
  advisorId: string;
  urgency: number;
  reason: string;
};

type ChatMessage = {
  id: string;
  speakerId: string;
  speakerType: "user" | "advisor";
  text: string;
};

const sidebarAdvisors = [
  { id: "anthropic", name: "Claude", enabled: true },
  { id: "openai", name: "OpenAI", enabled: true },
  { id: "gemini", name: "Gemini", enabled: true },
  { id: "grok", name: "Grok", enabled: true },
];

const advisorDisplayNames = Object.fromEntries(
  sidebarAdvisors.map((advisor) => [advisor.id, advisor.name])
);

function getSpeakerName(speakerId: string) {
  return advisorDisplayNames[speakerId] ?? speakerId;
}


function App() {
  const [prompt, setPrompt] = useState (""); 
  const [response, setResponse] = useState<StreamState | null>(null); 
  const [isLoading, setIsLoading] = useState(false); 
  const [urgencyRatings, setUrgencyRatings] = useState<UrgencyRating[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth"});
  }, [messages]);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    
    
    event.preventDefault();// prevents entire page reload 

    if (isLoading) {
      return;
    }

    const submittedPrompt = prompt.trim(); 

    if (!submittedPrompt) {
      return; 
    }

    setPrompt(''); 
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
    setResponse({ text: '' });// starts a fresh streamed response 
    const abortController = new AbortController();
    abortControllerRef.current = abortController;



    try {
      //post request made to front end that get forwarded to backend via configured proxy 
      const res = await fetch('/api/round-test', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: submittedPrompt, conversationId }),
        signal: abortController.signal,
      }); 

      if(!res.body) {
        setResponse({ text: "", error: "No response stream returned."});
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
          const eventLine = eventText
            .split('\n')
            .find((line) => line.startsWith('event: '));
          
          const dataLine = eventText
            .split('\n')
            .find((line) => line.startsWith('data: '));
          
          if(!eventLine || !dataLine) {
            continue;
          }
          
          const eventName = eventLine.replace("event: ", "");
          const data = JSON.parse(dataLine.replace("data: ", ''));
          
          if (eventName === "conversation_ready") {
            setConversationId(data.conversationId);
          }

          if (eventName === "urgency_scores") {
            setUrgencyRatings(data.scores);
          }

          if (eventName === "speaker_start") {
            setMessages((current) => [
              ...current,
              {
                id: crypto.randomUUID(),
                speakerId: data.advisorId,
                speakerType: "advisor",
                text: "",
              },
            ]);
          }

          if (eventName === "token") {
            setMessages((current) => {
              const next = [...current];
              const lastMessage = next[next.length - 1];

              if (!lastMessage || lastMessage.speakerType !== 'advisor'|| lastMessage.speakerId !== data.advisorId) {
                return [
                  ...next,
                  {
                    id: crypto.randomUUID(),
                    speakerId: data.advisorId,
                    speakerType: "advisor",
                    text: data.text,
                  },
                ];
              }

              next[next.length - 1] = {
                ...lastMessage,
                text: `${lastMessage.text}${data.text}`,
              };

              return next;
            });
          }

          if (eventName === "error") {
            setResponse({
              text: "",
              error: data.message,
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
    if(conversationId) {
      await fetch (`/api/conversations/${conversationId}/stop`, {
        method: "POST",
      })
    }
    abortControllerRef.current?.abort();
  }


 return (
  <main className="app-shell">
    <aside className="sidebar">
      <div>
        <div className="sidebar-brand">Table</div>

        <section className="sidebar-section">
          <div className="sidebar-section-header">
            <span>Workspaces</span>
            <button
              type="button"
              className="icon-button"
              aria-label="Add workspace"
            >
              +
            </button>
          </div>

          <details className="workspace-group" open>
            <summary className="workspace-button">
              Default Workspace
            </summary>

            <div className="room-list">
              <div className="sidebar-section-header sidebar-section-header--nested">
                <span>Boardrooms</span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Add boardroom"
                >
                  +
                </button>
              </div>

              <button type="button" className="room-item room-item--active">
                Default Boardroom
              </button>

              <div className="advisor-list">
                <div className="sidebar-section-header sidebar-section-header--nested">
                  <span>Advisors</span>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Add advisor"
                  >
                    +
                  </button>
                </div>

                {sidebarAdvisors.map((advisor) => {
                  const rating = urgencyRatings.find(
                    (item) => item.advisorId === advisor.id
                  );
                  const urgencyOpacity = rating
                    ? Math.max(0.12, rating.urgency / 10)
                    : 0.12;
                  const tooltipText = rating
                    ? `${rating.urgency}/10 - ${rating.reason}`
                    : advisor.enabled
                      ? "No rating yet"
                      : "Disabled";

                  return (
                    <div
                      className={`advisor-row ${
                        advisor.enabled
                          ? "advisor-row--online"
                          : "advisor-row--disabled"
                      }`}
                      key={advisor.id}
                    >
                      <div className="advisor-meta">
                        <span className="advisor-name">{advisor.name}</span>
                      </div>
                      <span
                        aria-label={`${advisor.name}: ${tooltipText}`}
                        className="advisor-urgency-dot"
                        data-tooltip={tooltipText}
                        style={
                          advisor.enabled
                            ? ({ "--urgency-opacity": urgencyOpacity } as CSSProperties)
                            : undefined
                        }
                        tabIndex={0}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </details>
        </section>
      </div>

      <div className="sidebar-footer">
        <button type="button" className="footer-button">
          Settings
        </button>
        <button type="button" className="footer-button">
          Profile
        </button>
      </div>
    </aside>


    <section className="room-shell">
      <header className="room-header">
        <h1 className="room-title">Table</h1>
        <p className="room-subtitle">
          A live room for multi-advisor decisions.
        </p>
      </header>

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

      <form className="composer" onSubmit={handleSubmit}>
        <label htmlFor="prompt">Prompt</label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />


        <button
          type={isLoading ? "button" : "submit"}
          onClick={isLoading ? handleStop : undefined}
        >
          {isLoading ? "Stop" : "Ask"}
        </button>
      </form>
    </section>
  </main>
);


}

export default App; 
