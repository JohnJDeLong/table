import { useState, type SyntheticEvent } from 'react';
import './App.css';

type TestResponse = { 
  text?: string;
  usage?: unknown;
  error?: string;
};

function App() {
  const [prompt, setPrompt] = useState ("Say hello from Table in one sentence."); 
  const [response, setResponse] = useState<TestResponse | null>(null); 
  const [isLoading, setIsLoading] = useState(false); 

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();// prevents entire page reload 
    setIsLoading(true); // ui will use this to disable submit button and render loading indicator. 
    setResponse(null);// clears out old responses saved in state

    //post request made to front end that get forwarded to backend via configured proxy 
    const res = await fetch('/api/test', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    }); 

    const data = (await res.json()) as TestResponse; // recive back the data 
    setResponse(data); // save the data in response var
    setIsLoading(false) // reset the loading variable because process is complete
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
        {response && ( 
            <article className='message-block'>
              <p className='speaker'>Anthropic</p>
              {response.error ? <p>{response.error}</p>: <p>{response.text}</p>}
            </article>
          )}

      </section>
    </main>
  );

}

export default App; 