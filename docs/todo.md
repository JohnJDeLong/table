# TODO

Active task list, block-by-block. Update statuses as work progresses.

## Pre-flight (before Block 1)

- [x] Get Anthropic API key
- [ ] Get OpenAI API key
- [ ] Get Google AI Studio key
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

## Block 2: Streaming end-to-end (one provider) 

- [ ] Convert `POST /api/test` to SSE
- [ ] Stream tokens from Anthropic to client
- [ ] React renders tokens as they arrive
- [ ] Fight CORS / proxy buffering issues
- [ ] Commit

## Block 3: Provider abstraction + 2nd provider

- [ ] Define `LLMProvider` interface in `server/src/providers/types.ts`
- [ ] Refactor Anthropic call into `AnthropicAdapter`
- [ ] Add `OpenAIAdapter` behind the same interface
- [ ] Verify both stream identically into the UI
- [ ] Commit

## Block 4: Urgency rating round (Phase 1)

- [ ] Add `rateUrgency` to the `LLMProvider` interface
- [ ] Implement for both adapters
- [ ] Orchestrator: fan out parallel rate calls, return sorted scores
- [ ] UI: show "show of hands" badges with scores + reasons
- [ ] Commit

## Block 5: Sequential responses with cross-context (Phase 2)

- [ ] Orchestrator: after Phase 1, iterate through advisors in urgency order
- [ ] Each advisor sees the full transcript including prior speakers in this round
- [ ] SSE events: `speaker_start`, `token`, `speaker_end`, `round_end`
- [ ] UI: render each advisor's response in sequence
- [ ] Commit

## Block 6: Persistence

- [ ] Decide: Postgres or localStorage. Postgres unless behind schedule.
- [ ] If Postgres: Prisma schema for boardrooms, advisors, conversations, messages
- [ ] If localStorage: simple JSON serialization
- [ ] Save messages as they generate, load on app reload
- [ ] Commit

## Block 7: Minutes UI polish

- [ ] Document-style layout (no chat bubbles)
- [ ] Speaker labels with role and color accent
- [ ] Round indicator
- [ ] Pause / interrupt button always visible
- [ ] Typography that reads like meeting minutes
- [ ] Commit

## Block 8: 3rd provider + auto-pause logic

- [ ] Add Gemini adapter
- [ ] Implement multi-round loop with urgency-threshold pause
- [ ] Add hard round cap
- [ ] UI: "the room has gone quiet" state
- [ ] Commit

## Block 9: Buffer / catch-up + start 4th provider

- [ ] Catch up on anything slipped from previous blocks
- [ ] Add Grok adapter (or fallback)
- [ ] Commit

## Block 10: Default personas + first end-to-end test

- [ ] Write 4 hardcoded persona prompts (one per advisor, leaning into each model's strengths)
- [ ] Seed a default boardroom with these advisors
- [ ] Run a full end-to-end conversation. Note bugs.
- [ ] Commit

## Block 11: Bug fixes + polish

- [ ] Fix bugs from Block 10
- [ ] UI polish pass
- [ ] Improve persona prompts based on real outputs
- [ ] Commit

## Block 12: README polish + demo recording

- [ ] Update README quick-start section with real instructions
- [ ] Record demo video (60-90 seconds, the magic moment)
- [ ] Tag a release commit

## Buffer (Blocks 13-14 if needed)

- [ ] Reserved for slippage
- [ ] If on schedule: tackle one stretch goal (deploy, custom personas, or @-mentions)

