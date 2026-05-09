import { useState, type SyntheticEvent } from "react";
import "./App.css";
import { Composer } from "./components/Composer";
import { MessageThread } from "./components/MessageThread";
import { Sidebar } from "./components/Sidebar";
import { useSidebarData } from "./hooks/useSidebarData";
import { useConversationRound } from "./hooks/useConversationRound";


function App() {
  const [prompt, setPrompt] = useState("");
  
  const {
    response,
    isLoading,
    urgencyRatings,
    messages,
    sendPrompt,
    stopRound,
  } = useConversationRound();

  const {
    activeWorkspace,
    activeTable,
    sidebarAdvisors,
    selectActiveTable,
    getSpeakerName,
  } = useSidebarData();

  


  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    await sendPrompt(prompt);
    setPrompt("");
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
          onStop={stopRound}
        />
      </section>
    </main>
  );
}

export default App;
