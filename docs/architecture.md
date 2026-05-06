# Architecture

Source of truth: this is the system map. Detailed protocol rules live in `orchestration.md`, provider details live in `providers.md`, event payloads live in `events.md`, and transcript storage details live in `transcript.md`.

## Overview


Table is a multi-provider, multi-agent decision workspace. Provider-backed advisors speak in urgency order, continue until the room has nothing important left to add, and pause when collective urgency drops below threshold or when the user intervenes.

The system has three logical layers:

1. **Provider adapter layer** — normalizes the differences between LLM provider SDKs behind a single streaming interface
2. **Orchestration layer** — runs the urgency-rating round, sequences responses, manages cross-agent context, decides when the room pauses
3. **UI layer** — chat-like live room with real-time streaming, user controls, and meeting-minutes export

## The Urgency Mechanic

This is the core product mechanic. Every user message triggers a live urgency loop.

### Step 1: Urgency Rating (parallel, fast, cheap)

All active provider-backed advisors are called in parallel with a small prompt:

> "Rate how urgently you should speak next in the current conversation. 10 means staying quiet would seriously hurt the conversation. 0 means you have nothing distinct to add. Reply only with JSON: { urgency: number, reason: string }."

Urgency rating should use each provider's fast/low-cost configured model where available, since the response is a small JSON. Cost matters here because urgency is recalculated after each advisor response.

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
          emit("round_end")
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

Current adapter implementations:

- `AnthropicAdapter` — wraps `@anthropic-ai/sdk`
- `OpenAIAdapter` — wraps `openai` SDK

Planned adapter implementations:

- `GeminiAdapter` — wraps Google's Gemini API
- `GrokAdapter` — wraps xAI's API (or Mistral fallback if Grok access is blocked)

Each adapter handles its provider's quirks:

- Streaming format normalization (each provider streams differently)
- Message format normalization (system prompt placement, role names)
- Error handling and retries
- Token counting (for cost tracking)

The orchestrator never knows or cares which provider SDK is behind a given advisor seat. Adding another provider means writing one new adapter file and adding it to the runtime advisor list.

## Data Model

The database is designed for the future product shape — users, workspaces, reusable advisor profiles, boardrooms, conversations, and trace data — even though the MVP only uses a seeded default path. This avoids redesigning persistence when auth, team workspaces, custom advisors, and multiple boardrooms arrive later.

MVP persistence is still for observability first: save what happened, why the room chose each speaker, and enough event history to debug or reload the conversation. The MVP does not need login, workspace management, boardroom editing, or advisor editing UI.

```
User
  id
  email
  display_name
  created_at
  updated_at

Workspace
  id
  name
  created_at
  updated_at

WorkspaceMember
  id
  workspace_id
  user_id
  role              "owner" | "admin" | "member" | "viewer"
  created_at
  updated_at

AdvisorProfile
  id
  owner_type        "user" | "workspace"
  owner_user_id     nullable
  owner_workspace_id nullable
  visibility        "private" | "workspace"
  can_copy
  display_name
  description
  provider          "anthropic" | "openai" | "gemini" | "grok"
  system_prompt
  rating_model
  response_model
  copied_from_advisor_profile_id nullable
  created_at
  updated_at

Boardroom
  id
  workspace_id
  name
  description
  pause_threshold
  max_turns_per_round
  created_at
  updated_at

BoardroomAdvisor
  id
  boardroom_id
  advisor_profile_id
  enabled
  position
  color
  created_at
  updated_at

Conversation
  id
  workspace_id
  boardroom_id
  title             auto-generated from first user message
  initial_prompt
  status            "running" | "complete" | "interrupted" | "turn_cap_reached" | "error"
  pause_reason      nullable
  created_at
  updated_at

Message
  id
  conversation_id
  speaker_type      "user" | "advisor"
  speaker_id        nullable, advisor_profile_id or provider id when type="advisor"
  provider          nullable, "anthropic" | "openai" | "gemini" | "grok"
  turn_index
  content
  created_at

UrgencyRating
  id
  conversation_id
  advisor_profile_id nullable
  advisor_id        provider-backed fallback id for MVP
  turn_index
  urgency
  reason
  created_at

RoundEvent
  id
  conversation_id
  sequence
  type              "urgency_scores" | "speaker_start" | "token" | "speaker_end" | "round_end" | "turn_cap_reached" | "user_interrupt" | "error"
  advisor_profile_id nullable
  advisor_id        nullable, provider-backed fallback id for MVP
  payload           JSON
  created_at
```

For MVP, seed a default user, default workspace, default boardroom, and four provider-backed advisor profiles: Anthropic, OpenAI, Gemini, and Grok. The app can use those defaults without exposing auth, workspace, boardroom, or advisor-management UI yet.

Advisor profiles may be owned by a user or by a workspace. Personal advisors are private by default. Workspace advisors are visible to workspace members and editable according to workspace permissions. A workspace advisor can later be copied into a user's personal advisor library by creating a new user-owned `AdvisorProfile` that references `copied_from_advisor_profile_id`.

## API Surface

The exact SSE payloads are defined in `events.md`.

Backend exposes:

- `POST /api/conversations` — start a new conversation in the default or selected boardroom
- `GET /api/conversations/:id` — fetch full conversation history and trace data
- `POST /api/conversations/:id/messages` — user sends a message; opens an SSE stream emitting round events
- `POST /api/conversations/:id/interrupt` — user interrupts the current round

The SSE stream from `POST /api/conversations/:id/messages` emits typed events:

- `urgency_scores` — `{ scores: [{ advisorId, urgency, reason }] }`
- `speaker_start` — `{ advisorId }`
- `token` — `{ advisorId, text }`
- `speaker_end` — `{ advisorId }`
- `turn_cap_reached` — `{ maxTurnsPerRound }`
- `round_end` — `{ spokenAdvisorIds }`
- `error` — `{ message }`

## Frontend Structure

The UI is a single-page React app. The main view is a focused, chat-like **live room** where user and advisor turns stream in as readable message blocks. New activity should feel like it appears at the bottom of the conversation, with a bottom composer for the user's next message. Each advisor has a color and name so the back-and-forth is easy to follow. When the user is done, the conversation can be exported as a meeting-minutes PDF.

Key components:

- `ConversationThread` — the main bottom-pinned live conversation
- `MessageBlock` — one user message or one advisor response in the chat-like stream
- `UrgencyBadges` — the live "show of hands" before responses start streaming
- `RoundIndicator` — tells the user which round and whether the room paused
- `ComposerBar` — bottom input field with send and pause/interrupt controls
- `MinutesExport` — generate/download a meeting-minutes PDF from the finished discussion
- `ConversationHistory` — reload previous conversations once persistence is available

## Key Trade-offs and Decisions

| Decision | Choice | Reasoning |
|---|---|---|
| Turn order | Urgency-based, not round-robin | Differentiator and emergent behavior |
| Cross-agent awareness | Yes — each speaker sees prior speakers in this round and urgency recalibrates after each response | Enables real debate, not parallel monologues |
| Round termination | Self-paused via urgency threshold, with temporary turn cap during MVP | Preserves the natural "room goes quiet" mechanic while giving early builds a safety fuse |
| Advisor identity | Seeded provider-backed advisor profiles for MVP; custom advisors later | Keeps the MVP focused on the urgency mechanic while preserving the future persona/boardroom model |
| Persistence | PostgreSQL via Prisma | Real relational persistence is part of the learning goal; Supabase Postgres is the likely hosted database |
| Deploy | Stretch goal | Local + recorded video demo is acceptable fallback |
| UI aesthetic | Chat-like live room plus meeting-minutes export | Chat is the clearest interaction model for live discussion; minutes remain the durable artifact |

## Known Limitations & Future Work

- **Token context growth.** Long conversations include the full transcript in every model's context, which scales quadratically in cost. Future: after round N, summarize older rounds into a rolling context summary while preserving recent turns verbatim.
- **No agent memory across conversations.** Each conversation is independent. Future: per-advisor long-term memory of the user.
- **No multi-modal.** Text only. Future: voice input/output, image attachment.
- **Single-user.** No accounts or auth. Future: shared boardrooms, collaborative sessions.
- **No analytics.** No usage tracking, no quality scoring, no A/B framework.


## Terminology

AdvisorProfile = reusable advisor/persona configuration, owned by a user or workspace
Boardroom = saved room setup that chooses which advisor profiles participate
BoardroomAdvisor = join record that includes/excludes advisor profiles in a boardroom
Advisor = runtime participant selected from the active boardroom's advisor profiles
Agent = runtime execution of an advisor during a turn
Provider = LLM backend (Anthropic, OpenAI, Google, xAI)
Round = the room's full response to one user message, ending when the room goes quiet
Turn = one advisor speaking
Conversation = one persisted discussion session
Transcript = persistent meeting record
