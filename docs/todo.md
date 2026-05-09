# TODO

Active task list, block-by-block. Update statuses as work progresses.

## Pre-flight (before Block 1)

- [x] Get Anthropic API key
- [x] Get OpenAI API key
- [x] Get Google AI Studio key
- [x] Get xAI / Grok API key
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
- [x] Write future-aware Prisma schema for users, workspaces, tables, advisor profiles, conversations, messages, urgency ratings, and round events
- [x] Seed default user, workspace, table, and four provider-backed advisor profiles
- [x] Run the first migration
- [x] Save conversations, messages, and Table round events
- [x] Capture urgency scores in persisted round event payloads
- [x] Commit

## Block 7.5: DB-backed table runtime — Complete

- [x] Load enabled advisors from the seeded default table
- [x] Convert `AdvisorProfile` rows into runtime `Advisor` objects
- [x] Keep unsupported providers disabled until their adapters exist
- [x] Remove the hardcoded advisor list from `server/src/index.ts`
- [x] Commit

## Block 7: Conversation UI + Minutes export

- [x] Chat-like live room for the advisor discussion
- [x] Bottom composer for sending the next user message
- [x] Speaker labels with role and color accent
- [x] Sidebar shape for workspaces, tables, advisor standing, settings, and profile
- [x] Message stream that feels familiar like texting while staying focused on decision work
- [x] Auto-scroll to newest message
- [x] Continue the current backend conversation when the user sends follow-up prompts
- [x] Stop button appears during active rounds and cancels the backend advisor run
- [x] Commit

## Block 8: Add Gemini provider

- [x] Get Google AI Studio key and add it to local `.env`
- [x] Add Gemini key placeholder to `.env.example`
- [x] Verify current Gemini model identifiers before hardcoding them
- [x] Install the Google/Gemini SDK
- [x] Add `GeminiAdapter` behind the existing `LLMProvider` interface
- [x] Wire Gemini into `loadTableAdvisors`
- [x] Enable Gemini in the default table once the adapter works
- [x] Test `/api/urgency-test` and `/api/round-test` with Gemini active
- [x] Commit

## Block 9: Add Grok provider

- [x] Get xAI / Grok API key and add it to local `.env`
- [x] Add `XAI_API_KEY` placeholder to `.env.example`
- [x] Verify current Grok model identifiers before hardcoding them
- [x] Reuse the existing OpenAI SDK with xAI `baseURL`
- [x] Add `GrokAdapter` behind the existing `LLMProvider` interface
- [x] Wire Grok into `loadTableAdvisors`
- [x] Enable Grok in the default table once the adapter works
- [x] Test `/api/urgency-test` with Grok active
- [x] Test all four providers from the UI
- [x] Run final server/client builds
- [x] Commit

## Block 10: All-provider end-to-end + conversation hygiene


- [X] Harden urgency rating so hidden routing calls reliably return JSON
- [x] Treat failed urgency parsing as silent without noisy user-visible behavior

- [x] Confirm active providers participate through the database-backed table runtime
- [x] Run a full end-to-end conversation with follow-up prompts. Note bugs.
- [x] Align UI, database, and provider conversation history so they share one source of truth
- [x] Add message lifecycle status for streaming, completed, cancelled, and failed advisor messages
- [x] Persist visible partial advisor output on Stop so future provider context matches what the user saw
- [x] Decide whether separate `UrgencyRating` rows are needed beyond persisted round event payloads
- [x] Commit

## Block 11: Auth, users, and profile foundation

- [ ] Choose managed auth path for the MVP
- [ ] Add login page
- [ ] Add logout behavior
- [ ] Map authenticated users to `User` records
- [ ] Load the authenticated user's recent conversations from the database
- [ ] Let users reopen an existing conversation after refresh or login
- [ ] Load a saved conversation on app reload once user identity is available
- [ ] Add conversation deletion so removing a conversation also cleans up its messages, urgency ratings, and round events
- [ ] Enforce workspace membership with `WorkspaceMember`
- [ ] Add basic profile view/edit behavior
- [ ] Commit

## Block 11.5: Architecture & Refactoring

- [ ] Split `server/src/index.ts` so it only owns Express app setup, middleware registration, route mounting, and `app.listen`
- [ ] Move API route handlers into `server/src/routes/` in small slices, starting with `sidebar`, `auth`, `conversations`, and round/message streaming routes
- [ ] Rename stale `*-test` endpoints before more frontend code couples to them
- [ ] Replace `/api/round-test` with a production conversation message/turn endpoint
- [ ] Move diagnostic-only routes under `/api/diagnostics/*` or delete them
- [ ] Update frontend fetch calls and docs after route rename
- [ ] Move reusable route/business logic into `server/src/services/` where a handler currently mixes request parsing, database work, orchestration, and persistence
- [ ] Keep provider-specific code behind `LLMProvider` adapters while moving routes, with no direct SDK calls from routes/services
- [ ] Replace cwd-dependent `dotenv.config({ path: "../.env" })` calls with one shared ESM-safe env loader that resolves the repo `.env` from module location
- [ ] Fix the `server/src/config/supabase.ts` dotenv path typo if still present during env-loader cleanup
- [ ] Extract frontend auth/session loading from `client/src/App.tsx` into a focused hook or helper
- [ ] Extract sidebar loading/state from `client/src/App.tsx` into a focused hook or component boundary
- [ ] Extract SSE parsing/round streaming from `client/src/App.tsx` into a focused hook so UI rendering is not responsible for stream protocol details
- [ ] Split visible UI from `client/src/App.tsx` into components such as sidebar, message thread, composer, urgency/advisor indicators, and conversation actions
- [ ] Re-run server/client builds after each small extraction to catch import and behavior regressions early
- [ ] Update docs if the final folder structure differs from `AGENTS.md`
- [ ] Commit

## Block 12: Real workspace, table, and advisor controls

- [ ] Load sidebar workspaces, tables, and advisors from the API instead of hardcoding them
- [ ] API-back sidebar provider indicators so enabled/disabled advisor state reflects the database
- [ ] Treat sidebar data as server state: initial `loadSidebar()` on app mount, then refresh after workspace/table/advisor create, edit, or delete
- [ ] Ask whether to keep manual `loadSidebar()` refreshes for MVP or introduce TanStack Query with mutation invalidation
- [ ] Later: consider optimistic sidebar updates after mutations if the CRUD flow feels too slow
- [ ] Add real behavior for workspace `+`
- [ ] Add real behavior for table `+`
- [ ] Add real behavior for advisor `+`
- [ ] Add basic edit/delete behavior where needed
- [ ] Export/download finished discussion as a meeting-minutes PDF
- [ ] Commit

## Block 13: Custom advisor/persona builder

- [ ] Design the custom advisor/persona prompt builder
- [ ] Let users create user-owned advisor profiles
- [ ] Let users edit their own advisor prompts/config
- [ ] Let users add or remove their advisors from tables
- [ ] Keep workspace-owned advisors visible but permission-controlled
- [ ] Commit

## Block 14: Bug fixes, polish, README, and demo

- [ ] Fix bugs from Blocks 8-13
- [ ] UI polish pass
- [ ] Strengthen advisor room prompts so advisors do not explain routing mechanics or claim they are alone
- [ ] Add directed-advisor routing using table advisor display names/handles so prompts like "Sue..." or "Claude..." prioritize the named advisor
- [ ] Hide empty advisor bubbles and handle per-advisor stream failures gracefully
- [ ] Improve shared advisor prompts based on real outputs if needed
- [ ] Update README quick-start section with real instructions
- [ ] Record demo video (60-90 seconds, the magic moment)
- [ ] Tag a release commit

## Stretch / Parking Lot

- [ ] Deploy to a public URL
- [ ] Add @-mention to call on a specific advisor out of order
- [ ] Add custom table templates
- [ ] add separate queryable `UrgencyRating` rows for analytics/debugging beyond `RoundEvent` payloads
- [ ] Replace the advisor-as-user provider history trick with an explicit transcript/context renderer before serious persona tuning
