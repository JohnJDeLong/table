import { useState, type SyntheticEvent } from 'react';
import './App.css';

type StreamState = { 
  text: string;
  error?: string;
};

type ProviderId = "anthropic" | "openai";


function App() {
  const [prompt, setPrompt] = useState ("Say hello from Table in one sentence."); 
  const [response, setResponse] = useState<StreamState | null>(null); 
  const [isLoading, setIsLoading] = useState(false); 
  const [provider, setProvider] = useState<ProviderId>("anthropic");


  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();// prevents entire page reload 
    setIsLoading(true); // ui will use this to disable submit button and render loading indicator. 
    setResponse({ text: '' });// starts a fresh streamed response 

    //post request made to front end that get forwarded to backend via configured proxy 
    const res = await fetch('/api/test', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, provider }),
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

        if (eventName === "token") {
          setResponse((current) => ({
            text: `${current?.text ?? ""}${data.text}`,
          }));
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
          <label htmlFor="provider">Provider</label>
            <select
              id="provider"
              value={provider}
              onChange={(event) => setProvider(event.target.value as ProviderId)}
            >
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
            </select>

          <button type='submit' disabled={isLoading}>
            {isLoading? "thinking..." : "Ask"}
          </button>
        </form>
        {response && ( 
            <article className='message-block'>
              <p className='speaker'>{provider}</p>
              {response.error ? <p>{response.error}</p>: <p>{response.text}</p>}
            </article>
          )}

      </section>
    </main>
  );

}

export default App; 