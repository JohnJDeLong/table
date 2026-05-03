import { useState, type SyntheticEvent } from 'react';
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

type AdvisorMessage = {
  advisorId: string;
  text: string;
};



function App() {
  const [prompt, setPrompt] = useState ("Say hello from Table in one sentence."); 
  const [response, setResponse] = useState<StreamState | null>(null); 
  const [isLoading, setIsLoading] = useState(false); 
  const [urgencyRatings, setUrgencyRatings] = useState<UrgencyRating[]>([]);
  const [messages, setMessages] = useState<AdvisorMessage[]>([]);


  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    setMessages([]);
    setUrgencyRatings([]); // clears old ratings 
    event.preventDefault();// prevents entire page reload 
    setIsLoading(true); // ui will use this to disable submit button and render loading indicator. 
    setResponse({ text: '' });// starts a fresh streamed response 



    //post request made to front end that get forwarded to backend via configured proxy 
    const res = await fetch('/api/round-test', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    }); 

    if(!res.body) {
      setResponse({ text: "", error: "No response stream returned."});
      setIsLoading(false);
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

        if (eventName === "urgency_scores") {
          setUrgencyRatings(data.scores);
        }

        if (eventName === "speaker_start") {
          setMessages((current) => [
            ...current,
            {
              advisorId: data.advisorId,
              text: "",
            },
          ]);
        }

        if (eventName === "token") {
          setMessages((current) => {
            const next = [...current];
            const lastMessage = next[next.length - 1];

            if (!lastMessage || lastMessage.advisorId !== data.advisorId) {
              return [
                ...next,
                {
                  advisorId: data.advisorId,
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

    setIsLoading(false); 
  }

  return (
    <main className='app-shell'>
      <section className='transcript'>
        <header className="transcript-header">
          <p className="eyebrow">Table</p>
          <h1>Advisory Room</h1>
          <p>Ask one advisor through the backend. Multi-advisor orchestration comes next.</p>
        </header>

        <form className='composer' onSubmit={handleSubmit}>
          <label htmlFor='prompt'>Prompt</label>
          <textarea 
            id='prompt'
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          

          <button type='submit' disabled={isLoading}>
            {isLoading? "thinking..." : "Ask"}
          </button>
        </form>

        {urgencyRatings.length > 0 && (
          <section className="urgency-panel">
            <p className="eyebrow">Show of hands</p>
            {urgencyRatings.map((rating) => (
              <article className="urgency-card" key={rating.advisorId}>
                <p className="speaker">{rating.advisorId}</p>
                <p>{rating.urgency}/10</p>
                <p>{rating.reason}</p>
              </article>
            ))}
          </section>
        )}


        {messages.map((message, index) => (
          <article className="message-block" key={`${message.advisorId}-${index}`}>
            <p className="speaker">{message.advisorId}</p>
            <p>{message.text}</p>
          </article>
        ))}

        {response?.error && (
          <article className="message-block">
            <p className="speaker">Error</p>
            <p>{response.error}</p>
          </article>
        )}


      </section>
    </main>
  );

}

export default App; 