import type { Session } from "@supabase/supabase-js";
import { useEffect, useState, type SyntheticEvent } from "react";
import "./App.css";
import { Composer } from "./components/Composer";
import { LoginPage } from "./components/LoginPage";
import { MessageThread } from "./components/MessageThread";
import { Sidebar } from "./components/Sidebar";
import { useConversationRound } from "./hooks/useConversationRound";
import { useSidebarData } from "./hooks/useSidebarData";
import { supabase } from "./lib/supabase";

function App() {
  const [prompt, setPrompt] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const {
    response,
    isLoading,
    urgencyRatings,
    messages,
    sendPrompt,
    stopRound,
  } = useConversationRound(session?.access_token);

  const {
    activeWorkspace,
    activeTable,
    sidebarAdvisors,
    selectActiveTable,
    getSpeakerName,
  } = useSidebarData();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setIsProfileMenuOpen(false);
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    const submittedPrompt = prompt;
    setPrompt("");

    await sendPrompt(submittedPrompt);
  }

  if (isAuthLoading) {
    return <main className="login-shell">Loading...</main>;
  }

  if (!session) {
    return (
      <LoginPage
        onAuthenticated={async () => {
          const { data } = await supabase.auth.getSession();
          setSession(data.session);
        }}
      />
    );
  }

  return (
    <main className="app-shell">
      <Sidebar
        activeWorkspace={activeWorkspace}
        activeTable={activeTable}
        sidebarAdvisors={sidebarAdvisors}
        urgencyRatings={urgencyRatings}
        selectActiveTable={selectActiveTable}
        profileEmail={session.user.email ?? null}
        isProfileMenuOpen={isProfileMenuOpen}
        onProfileMenuToggle={() =>
          setIsProfileMenuOpen((current) => !current)
        }
        onSignOut={handleSignOut}
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
