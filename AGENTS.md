# Agents Guide

If you're an AI assistant (Claude, Codex, Cursor, etc.) helping with this codebase, read this first. It captures conventions and load-bearing decisions that aren't obvious from the code alone.

## Project Philosophy

Table is opinionated about three things. Don't suggest changes to these without flagging them explicitly:

1. **The urgency mechanic is the differentiator.** Don't replace it with round-robin or a simpler turn-order even if it would "simplify" things.
2. **Provider abstraction is non-negotiable.** Don't bypass the adapter interface to call a provider SDK directly, even for "just this one case."
3. **The UI is meeting Minutes, not chat.** Don't add chat bubbles, message reactions, or other social-app patterns. The aesthetic is a typed document.

## Collaboration Model

- **John** is the owner, primary learner, implementer, and final decision-maker. AI assistants should support John's understanding and execution rather than take ownership away from him.
- **Codex** is the primary lead coordinator and teacher. Keep the MVP moving, explain important choices, suggest scoped next steps, run checks when asked, and summarize outcomes clearly.
- **Claude** is the secondary lead coordinator and teacher. Claude's role is identical to Codex's role, except Codex is primary and Claude is secondary when both are available.
- AI assistants should work from the current docs first, especially `architecture.md`, `todo.md`, and this guide.

## Coding Conventions

- TypeScript strict mode, no `any` without a comment explaining why
- Functional React components with hooks, no class components
- Server: Express + TypeScript, with route handlers in `server/src/routes/` and business logic in `server/src/services/`
- Client: React + Vite, components in `client/src/components/`, pages in `client/src/pages/`
- Provider adapters in `server/src/providers/<provider>.ts`, all implementing the `LLMProvider` interface from `server/src/providers/types.ts`
- Async/await always, no raw promise chains
- Environment variables in `.env`, loaded via `dotenv`. Never commit `.env`. A committed `.env.example` documents the required keys.

## Model Identifiers — Verify Before Hardcoding

Foundation model names rotate frequently. Before hardcoding any model identifier (e.g. `claude-sonnet-4-6`, `gpt-4o`, `gemini-1.5-pro`, `grok-4`), check the provider's current docs to confirm the identifier is still valid and is the current best-fit choice for the role. Each advisor uses two models — a cheap one for Phase 1 urgency rating, a flagship one for Phase 2 response — both configurable per-advisor, both worth re-verifying at build time.

## The Provider Adapter Contract

Every adapter must implement:

```typescript
type ProviderMessage = {
  role: "user" | "assistant";
  content: string;
};

interface LLMProvider {
  rateUrgency(
    systemPrompt: string,
    conversation: ProviderMessage[]
  ): Promise<{ urgency: number; reason: string }>;

  streamResponse(
    systemPrompt: string,
    conversation: ProviderMessage[]
  ): AsyncIterable<string>;
}
```

Both methods take a *normalized* `ProviderMessage[]`. Each adapter is responsible for converting that into its provider's native message format. The orchestrator never sees provider-specific shapes.

Important: `ProviderMessage` is **not** the same as the `Message` entity in the data model. The DB `Message` carries metadata (id, timestamps, urgency scores, speaker info) that providers don't need or accept. Always transform `Message[]` → `ProviderMessage[]` at the boundary before calling an adapter.

If a provider's API doesn't support streaming, fake it by buffering the full response and emitting it in chunks. Don't break the interface.

## The Author Is Hand-Coding

The author is using AI assistants as **teachers and reviewers**, not as code generators. When asked questions:

- Explain concepts; don't just dump working code
- When the author writes code, review it and explain what's good or off — don't rewrite it unless asked
- Prefer Socratic questions when the author is debugging ("what does this log show? what did you expect?")
- When you do show code, narrate the *why* of every non-obvious line
- Frame explanations for someone newer to backend systems but not new to programming generally

If the author explicitly asks "just write it for me," then write it. Otherwise, default to teach mode.

## Common Gotchas

- **SSE behind proxies.** Some local dev proxies buffer responses, which kills streaming. If tokens arrive in clumps in dev, check proxy config (Vite dev server, nginx if used).
- **Anthropic system prompt format** is separate from the messages array. OpenAI and Gemini put system as a message with role `system`. Adapters must handle this difference.
- **Token counting differs across providers.** Don't assume parity. If you need an estimate, use each provider's own tokenizer.
- **Rate limits.** Phase 1 fans out parallel calls per round. With many rounds this can hit rate limits on free tiers. Backoff with retry on 429.
- **Cost.** Each round costs N×Phase1 + N×Phase2 calls. A 10-round conversation with 4 advisors is ~80 API calls. Use cheap tiers for Phase 1.

## What's Done / In Progress / Deferred

See `roadmap.md` for the phased plan and `todo.md` for the active block-by-block task list. Update those files as work progresses; don't track status here.

## Testing Approach

- Unit tests for provider adapters (mock the underlying SDK, verify normalization)
- Integration tests for the orchestration loop (stub providers, verify ordering and cross-context)
- No E2E tests for MVP

## Commits, PRs, and Comments

Follow `CONTRIBUTING.md`. Specifically:
- Commit messages use Conventional Commits format
- Pull request descriptions follow the project's PR template
- Code comments explain *why*, not *what*, and are used sparingly

## When in Doubt

Re-read `architecture.md`. If the architecture doc and this guide conflict, the architecture doc wins and this guide should be updated to match.
