import { useState, type SyntheticEvent } from "react";
import { supabase } from "../lib/supabase";

type LoginPageProps = {
  onAuthenticated: () => void | Promise<void>;
};

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setIsLoading(true);

    const result =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setIsLoading(false);

    if (result.error) {
      setNotice(result.error.message);
      return;
    }

    if (mode === "sign-up" && !result.data.session) {
      setNotice("Check your email to confirm your account, then come back and sign in.");
      setMode("sign-in");
      return;
    }

    onAuthenticated();
  }

  return (
    <main className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <div>
          <p className="login-eyebrow">Table</p>
          <h1>{mode === "sign-in" ? "Welcome back" : "Create your account"}</h1>
          <p className="login-copy">
            {mode === "sign-in"
              ? "Sign in to reopen your workspace."
              : "Create an account to start saving your Table sessions."}
          </p>
        </div>

        <div className="login-field">
          <label htmlFor="email">Email</label>
          <input
            autoComplete="email"
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="login-field">
          <label htmlFor="password">Password</label>
          <input
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {notice && <p className="login-notice">{notice}</p>}

        <button className="login-primary-button" type="submit" disabled={isLoading}>
          {isLoading
            ? "Working..."
            : mode === "sign-in"
              ? "Sign in"
              : "Create account"}
        </button>

        <button
          className="login-secondary-button"
          type="button"
          onClick={() =>
            setMode((current) =>
              current === "sign-in" ? "sign-up" : "sign-in"
            )
          }
        >
          {mode === "sign-in"
            ? "Need an account?"
            : "Already have an account?"}
        </button>
      </form>
    </main>
  );
}
