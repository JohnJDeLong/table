# TODO

Active task list, block-by-block. Update statuses as work progresses.

## Pre-flight (before Block 1)

- [x] Get Anthropic API key
- [x] Get OpenAI API key
- [x] Get Google AI Studio key
- [ ] Apply for xAI / Grok API access. If blocked, pick fallback (Mistral or Llama-via-Groq) and note in `agents.local.md`
- [ ] Set billing alerts at $50 on each provider

## Block 1: Setup + first non-streamed call — Complete

> **Finish line:** one React page calls one Express route that calls Anthropic non-streaming, and the response renders in the UI. Ugly is fine. End-to-end is the only goal.

- [x] `npm create vite@latest` for the client
- [x] Set up `server/` with Express + TypeScript
- [x] Wire client to server (proxy in `vite.config.ts`)
- [x] Add Anthropic SDK
- [x] Create `.env` with `ANTHROPIC_API_KEY` and a committed `.env.example` documenting required keys
- [x] One route: `POST /api/test` calls Anthropic, returns the (non-streamed) response
- [x] Render the response in the React UI
- [x] Commit

## Block 2: Streaming end-to-end (one provider) — Complete

- [x] Convert `POST /api/test` to SSE
- [x] Stream tokens from Anthropic to client
- [x] React renders tokens as they arrive
- [x] Fight CORS / proxy buffering issues
- [x] Commit

## Block 3: Provider abstraction + 2nd provider — Complete

- [x] Define `LLMProvider` interface in `server/src/providers/types.ts`
- [x] Refactor Anthropic call into `AnthropicAdapter`
- [x] Add `OpenAIAdapter` behind the same interface
- [x] Verify both stream identically into the UI
- [x] Commit

## Block 4: Urgency rating round (Phase 1) — Complete

- [x] Add `rateUrgency` to the `LLMProvider` interface
- [x] Implement for both adapters
- [x] Orchestrator: fan out parallel rate calls, return sorted scores
- [x] UI: show "show of hands" badges with scores + reasons
- [x] Commit

## Block 5: Sequential responses with cross-context (Phase 2) — Complete

- [x] Orchestrator: after each advisor response, recalibrate urgency before selecting the next speaker
- [x] Each advisor sees the full transcript including prior speakers in this round
- [x] SSE events: `speaker_start`, `token`, `speaker_end`, `round_end`
- [x] UI: render each advisor's response in sequence
- [x] Commit

## Block 6: Persistence — Complete

- [x] Install and configure Prisma
- [x] Use PostgreSQL as the persistence layer
- [x] Use Supabase Postgres for hosted database
- [x] Write future-aware Prisma schema for users, workspaces, boardrooms, advisor profiles, conversations, messages, urgency ratings, and round events
- [x] Seed default user, workspace, boardroom, and four provider-backed advisor profiles
- [x] Run the first migration
- [x] Save conversations, messages, and Table round events
- [x] Capture urgency scores in persisted round event payloads
- [x] Commit

## Block 7.5: DB-backed boardroom runtime — Complete

- [x] Load enabled advisors from the seeded default boardroom
- [x] Convert `AdvisorProfile` rows into runtime `Advisor` objects
- [x] Keep unsupported providers disabled until their adapters exist
- [x] Remove the hardcoded advisor list from `server/src/index.ts`
- [x] Commit

## Block 7: Conversation UI + Minutes export

- [x] Chat-like live room for the advisor discussion
- [x] Bottom composer for sending the next user message
- [x] Speaker labels with role and color accent
- [x] Sidebar shape for workspaces, boardrooms, advisor standing, settings, and profile
- [x] Message stream that feels familiar like texting while staying focused on decision work
- [x] Auto-scroll to newest message
- [x] Continue the current backend conversation when the user sends follow-up prompts
- [ ] Pause / interrupt button always visible
- [ ] Export/download finished discussion as a meeting-minutes PDF
- [ ] Commit

## Block 8: Add Gemini provider

- [x] Get Google AI Studio key and add it to local `.env`
- [x] Add Gemini key placeholder to `.env.example`
- [x] Verify current Gemini model identifiers before hardcoding them
- [x] Install the Google/Gemini SDK
- [ ] Add `GeminiAdapter` behind the existing `LLMProvider` interface
- [ ] Wire Gemini into `loadBoardroomAdvisors`
- [ ] Enable Gemini in the default boardroom once the adapter works
- [ ] Test `/api/urgency-test` and `/api/round-test` with Gemini active
- [ ] Commit

## Block 9: Add Grok or fallback provider

- [ ] Apply for xAI / Grok API access
- [ ] If xAI access is blocked, choose fallback provider and note it in `agents.local.md`
- [ ] Add provider key placeholder to `.env.example`
- [ ] Verify current model identifiers before hardcoding them
- [ ] Install the provider SDK
- [ ] Add the provider adapter behind the existing `LLMProvider` interface
- [ ] Wire the provider into `loadBoardroomAdvisors`
- [ ] Enable the provider in the default boardroom once the adapter works
- [ ] Test `/api/urgency-test` and `/api/round-test` with all active providers
- [ ] Commit

## Block 10: All-provider end-to-end + conversation hygiene

- [ ] Confirm active providers participate through the database-backed boardroom runtime
- [ ] Run a full end-to-end conversation with follow-up prompts. Note bugs.
- [ ] Load a saved conversation on app reload
- [ ] Align UI, database, and provider conversation history so they share one source of truth
- [ ] Add message lifecycle status for streaming, completed, cancelled, and failed advisor messages
- [ ] Persist visible partial advisor output on Stop so future provider context matches what the user saw
- [ ] Add conversation deletion so removing a conversation also cleans up its messages, urgency ratings, and round events
- [ ] Decide whether separate `UrgencyRating` rows are needed beyond persisted round event payloads
- [ ] Commit

## Block 11: Auth, users, and profile foundation

- [ ] Choose managed auth path for the MVP
- [ ] Add login page
- [ ] Add logout behavior
- [ ] Map authenticated users to `User` records
- [ ] Enforce workspace membership with `WorkspaceMember`
- [ ] Add basic profile view/edit behavior
- [ ] Commit

## Block 12: Real workspace, boardroom, and advisor controls

- [ ] Load sidebar workspaces, boardrooms, and advisors from the API instead of hardcoding them
- [ ] API-back sidebar provider indicators so enabled/disabled advisor state reflects the database
- [ ] Add real behavior for workspace `+`
- [ ] Add real behavior for boardroom `+`
- [ ] Add real behavior for advisor `+`
- [ ] Add basic edit/delete behavior where needed
- [ ] Commit

## Block 13: Custom advisor/persona builder

- [ ] Design the custom advisor/persona prompt builder
- [ ] Let users create user-owned advisor profiles
- [ ] Let users edit their own advisor prompts/config
- [ ] Let users add or remove their advisors from boardrooms
- [ ] Keep workspace-owned advisors visible but permission-controlled
- [ ] Commit

## Block 14: Bug fixes, polish, README, and demo

- [ ] Fix bugs from Blocks 8-13
- [ ] UI polish pass
- [ ] Improve shared advisor prompts based on real outputs if needed
- [ ] Update README quick-start section with real instructions
- [ ] Record demo video (60-90 seconds, the magic moment)
- [ ] Tag a release commit

## Stretch / Parking Lot

- [ ] Deploy to a public URL
- [ ] Add @-mention to call on a specific advisor out of order
- [ ] Add custom boardroom templates
