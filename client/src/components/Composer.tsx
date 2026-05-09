import type { SyntheticEvent } from "react";

type ComposerProps = {
  prompt: string;
  isLoading: boolean;
  onPromptChange: (prompt: string) => void;
  onSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
  onStop: () => void;
};

export function Composer({
  prompt,
  isLoading,
  onPromptChange,
  onSubmit,
  onStop,
}: ComposerProps) {
  return (
    <form className="composer" onSubmit={onSubmit}>
      <label htmlFor="prompt">Prompt</label>

      <textarea
        id="prompt"
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
      />

      <button
        type={isLoading ? "button" : "submit"}
        onClick={isLoading ? onStop : undefined}
      >
        {isLoading ? "Stop" : "Ask"}
      </button>
    </form>
  );
}
