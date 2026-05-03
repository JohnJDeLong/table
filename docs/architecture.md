# Architecture

Source of truth: this is the system map. Detailed protocol rules live in `orchestration.md`, provider details live in `providers.md`, event payloads live in `events.md`, and transcript storage details live in `transcript.md`.

## Overview


Table is a multi-provider, multi-agent decision workspace. Advisors speak in urgency order, continue round by round, and pause when the room has nothing important left to add or when the user intervenes.

The system has three logical layers:

1. **Provider adapter layer** — normalizes the differences between LLM provider SDKs behind a single streaming interface
2. **Orchestration layer** — runs the urgency-rating round, sequences responses, manages cross-agent context, decides when the room pauses
3. **UI layer** — group-conversation interface with real-time streaming, user controls, and meeting-minutes export

## The Urgency Mechanic

This is the core product mechanic. Every user message triggers a live urgency loop.

### Step 1: Urgency Rating (parallel, fast, cheap)

All advisors are called in parallel with a small prompt:

> "Rate your urgency to respond on a 1-10 scale. 10 means staying quiet would seriously hurt the conversation. 1 means you have nothing distinct to add. Reply only with JSON: { urgency: number, reason: string }."

Urgency rating uses each provider's *cheap* tier (e.g. claude-haiku, gpt-4o-mini, gemini-flash) since the response is a small JSON. Cost matters here because urgency is recalculated after each advisor response.

### Step 2: Highest-Urgency Response

Advisors are sorted by urgency descending. If the top advisor meets the speaking threshold, that advisor generates a full streamed response using the current conversation context. The response is appended to the conversation, then all advisors rate urgency again against the updated context before the next speaker is chosen. An advisor may speak more than once in the same round if the conversation makes their input newly important.

### Pause Conditions

After each advisor response, a fresh urgency check runs. The conversation auto-pauses when:

- Maximum urgency across all advisors falls below a threshold (default 3) — "the room has gone quiet"
- Temporary turn counter hits a hard cap (default 10) — MVP safety net against runaway loops
- User manually interrupts

### Prompting Note

Frame urgency as "how much would the conversation suffer if you stayed quiet?" — *not* "how strongly do you feel about this?" The first produces meaningful variance. The second just gets every model rating itself 7+.

## Orchestration Loop (Pseudo-Code)

The full orchestration protocol is defined in `orchestration.md`.

while (true):

  turn_count = 0

  while turn_count < max_turns_per_round:
      scores = parallel(rateUrgency(advisors, conversation_so_far))

      if max(scores) < pause_threshold:
          emit("room_quiet")
          break

      speaker = highest_urgency(scores)
      streamResponse(speaker)
      append response to conversation_so_far
      turn_count += 1

  if turn_count >= max_turns_per_round:
      emit("turn_cap_reached")
      break

## Provider Abstraction

The adapter contract and provider-specific behavior are defined in `providers.md`.

Each provider sits behind a uniform interface. Note the distinction between the **provider input shape** (`ProviderMessage`) and the **persisted entity** (`Message` in the data model below). The DB `Message` carries metadata — id, timestamps, urgency scores, speaker info — that providers don't need or accept. The orchestrator transforms `Message[]` into `ProviderMessage[]` at the adapter boundary.

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

Adapter implementations:

- `AnthropicAdapter` — wraps `@anthropic-ai/sdk`
- `OpenAIAdapter` — wraps `openai` SDK
- `GeminiAdapter` — wraps `@google/generative-ai`
- `GrokAdapter` — wraps xAI's API (or Mistral fallback if Grok access is blocked)

Each adapter handles its provider's quirks:

- Streaming format normalization (each provider streams differently)
- Message format normalization (system prompt placement, role names)
- Error handling and retries
- Token counting (for cost tracking)

The orchestrator never knows or cares which provider is behind a given advisor. Adding a fifth provider in the future means writing one new adapter file.

## Data Model

```
Boardroom
  id
  name              "Career Council"
  description
  pause_threshold   3
  max_turns_per_round  10
  created_at

Advisor
  id
  boardroom_id
  name              "Marcus"
  role              "CTO, pragmatic operator"
  persona_prompt    "You push back hard on hype..."
  provider          "anthropic" | "openai" | "google" | "xai"
  model             flagship model identifier
  rating_model      cheap model identifier for Phase 1
  color             "#e74c3c"
  position          ordering within the boardroom

Conversation
  id
  boardroom_id
  title             auto-generated from first user message
  created_at

Message
  id
  conversation_id
  speaker_type      "user" | "advisor"
  speaker_id        nullable, advisor_id when type="advisor"
  round_number
  urgency_score     nullable, populated for advisor messages
  urgency_reason    nullable
  content
  created_at
```

For MVP, advisors are created from a hardcoded set of 4 defaults (one per provider). Custom advisor creation is a stretch feature.

## API Surface

The exact SSE payloads are defined in `events.md`.

Backend exposes:

- `POST /api/conversations` — start a new conversation in a boardroom
- `GET /api/conversations/:id` — fetch full conversation history
- `POST /api/conversations/:id/messages` — user sends a message; opens an SSE stream emitting round events
- `POST /api/conversations/:id/interrupt` — user interrupts the current round
- `GET /api/boardrooms` — list boardrooms
- `GET /api/boardrooms/:id` — fetch boardroom + advisors

The SSE stream from `POST /api/conversations/:id/messages` emits typed events:

- `round_start` — `{ roundIndex }`
- `urgency_scores` — `{ scores: [{ advisorId, urgency, reason }] }`
- `speaker_start` — `{ advisorId }`
- `token` — `{ advisorId, text }`
- `speaker_end` — `{ advisorId }`
- `round_end` — `{ roundIndex, paused: boolean, pauseReason: string }`
- `error` — `{ message }`

## Frontend Structure

The UI is a single-page React app. The main view is a focused **group conversation** where user and advisor turns appear as readable message blocks. Each advisor has a color and name so the back-and-forth is easy to follow. When the user is done, the conversation can be exported as a meeting-minutes PDF.

Key components:

- `ConversationThread` — the main scrolling group conversation
- `MessageBlock` — one user message or one advisor response
- `UrgencyBadges` — the live "show of hands" before responses start streaming
- `RoundIndicator` — tells the user which round and whether the room paused
- `ComposerBar` — input field with pause/interrupt controls
- `MinutesExport` — generate/download a meeting-minutes PDF from the finished discussion
- `BoardroomSidebar` — switch between boardrooms (stretch)

## Key Trade-offs and Decisions

| Decision | Choice | Reasoning |
|---|---|---|
| Turn order | Urgency-based, not round-robin | Differentiator and emergent behavior |
| Cross-agent awareness | Yes — each speaker sees prior speakers in this round and urgency recalibrates after each response | Enables real debate, not parallel monologues |
| Round termination | Self-paused via urgency threshold, with temporary turn cap during MVP | Preserves the natural "room goes quiet" mechanic while giving early builds a safety fuse |
| Persona work | Baked-in defaults for MVP, custom in stretch | Demo magic requires personas; building a persona editor is post-MVP |
| Persistence | PostgreSQL via Prisma | Real relational persistence is part of the learning goal; Supabase Postgres is the likely hosted database |
| Deploy | Stretch goal | Local + recorded video demo is acceptable fallback |
| UI aesthetic | Live group conversation plus meeting-minutes export | Chat is the clearest interaction model for live discussion; minutes remain the durable artifact |

## Known Limitations & Future Work

- **Token context growth.** Long conversations include the full transcript in every model's context, which scales quadratically in cost. Future: after round N, summarize older rounds into a rolling context summary while preserving recent turns verbatim.
- **No agent memory across conversations.** Each conversation is independent. Future: per-advisor long-term memory of the user.
- **No multi-modal.** Text only. Future: voice input/output, image attachment.
- **Single-user.** No accounts or auth. Future: shared boardrooms, collaborative sessions.
- **No analytics.** No usage tracking, no quality scoring, no A/B framework.


## Terminology

Advisor = configured persona backed by a provider model
Agent = runtime execution of an advisor during a turn
Provider = LLM backend (Anthropic, OpenAI, Google, xAI)
Round = the room's full response to one user message, ending when the room goes quiet
Turn = one advisor speaking
Conversation = one persisted discussion session
Transcript = persistent meeting record
