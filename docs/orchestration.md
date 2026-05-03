# Orchestration

Source of truth: this file owns the urgency loop, speaking order, pause rules, and interrupt behavior. API routes are summarized in `architecture.md`; exact SSE payloads live in `events.md`.

## Purpose

This document defines the conversation engine that powers Table.

The orchestrator determines:

- which advisors speak
- when they speak
- what context they see
- when the room pauses
- when the user can intervene

Table conversations follow a structured round-based protocol rather than free-form agent chatter. Speaking order is computed from live urgency scores, every conversation has a temporary turn cap during MVP, and the loop works the same no matter which providers back the advisors.


## Definitions

**Cycle**

The full orchestration execution triggered by a single user message.

**Round**

The full room response to one user message. A round begins when the user speaks, advisors repeatedly recalibrate urgency against the updated conversation, and the round ends when the room goes quiet.

**Turn**

A single advisor response within a round.


## Conversation lifecycle

Each user message starts a new orchestration cycle.

The lifecycle for a single cycle:

User message  
↓  
Urgency rating (parallel)  
↓  
Highest urgent advisor speaks  
↓  
Conversation updates with that response  
↓  
Urgency recomputed against the updated conversation  
↓  
Continue, let another advisor speak, or pause  


## Urgency round

During the urgency round, all advisors evaluate how strongly they should respond.

This happens in parallel across providers.

Each advisor returns:

{
  "urgency": number,
  "reason": string
}

Urgency scale:

| Score | Meaning |
|------|---------|
| 10 | Critical insight missing from discussion |
| 7–9 | Strong contribution likely |
| 4–6 | Useful addition |
| 1–3 | Little to add |
| 0 | No response needed |

The pause threshold is a configurable system value that determines when the conversation naturally stops.
If no advisor reports urgency above this threshold, the room pauses.


## Turn selection

After each urgency scoring pass:

- Advisors are sorted by urgency (descending)
- The highest-urgency advisor speaks if their score meets the speaking threshold
- The advisor's response is added to the conversation
- All advisors recalibrate urgency against the updated conversation before the next speaker is chosen
- An advisor may speak more than once in a round if the conversation makes their input newly important
- Advisors whose urgency drops below threshold stay quiet

Tie-breaking rule:

Advisor order defined in board configuration.


## Response turns

During each response turn:

The selected advisor:

- receives the full transcript
- receives prior responses from this round
- produces a streamed response
- emits tokens via SSE

Events emitted:

speaker_start  
token  
speaker_end  


## Context visibility rules

Each advisor sees:

- system prompt (persona)
- full conversation transcript
- earlier responses from this round

Advisors do not see:

- other advisors’ urgency scores
- hidden system metadata
- future responses


## Round completion

After each advisor response:

Urgency is recomputed.

Possible outcomes:

| Condition | Result |
|----------|--------|
| max urgency ≥ threshold | next highest urgent advisor may speak |
| max urgency < threshold | end the round because the room is quiet |
| temporary turn cap reached | pause conversation as a safety fallback |
| user interrupt | pause conversation |


## Pause behavior

When urgency drops below the threshold:

The system emits:

room_quiet

The UI displays:

"The room has gone quiet."

The user may:

- continue discussion
- ask a follow-up question
- end the session


## Temporary turn cap safety limit

To prevent runaway conversations:

A temporary maximum turn cap exists during MVP.

Example:

MAX_TURNS_PER_ROUND = 10

If reached:

Conversation pauses automatically.

The intended round-ending condition is the room going quiet. The turn cap is an MVP safety fuse for provider loops, parsing bugs, or unexpected high-urgency behavior, and may be removed once the urgency mechanic is reliable.


## User interrupts

The user may interrupt at any time.

Interrupt behavior:

cancel active streams  
end current round  
start new cycle  

User input always takes priority over advisor responses.


## Streaming protocol (SSE)

Example event sequence:

round_start  
urgency_scores  
speaker_start  
token  
token  
speaker_end  
speaker_start  
token  
speaker_end  
round_end  


## Example orchestration loop (pseudo-code)

while true:

  turn_count = 0

  while turn_count < MAX_TURNS_PER_ROUND:
      scores = parallel(rateUrgency(advisors, conversation_so_far))
      emit("urgency_scores", scores)

      top = max(scores)

      if top.urgency < pause_threshold:
          emit("room_quiet")
          break

      streamResponse(top.advisor)
      append response to conversation_so_far
      turn_count += 1

  if turn_count >= MAX_TURNS_PER_ROUND:
      emit("turn_cap_reached")
      break


## Design goals

The orchestration protocol prioritizes:

- urgency-ranked speaking order with clear tie-breaking
- cross-agent awareness
- live urgency recalibration after each advisor response
- temporary turn cap so costs cannot run away during MVP
- natural stopping conditions
- the same orchestration behavior across providers
- streaming responsiveness


## Non-goals (for MVP)

The orchestrator does not yet support:

- mid-round interruptions between advisors
- directed advisor replies (@mentions)
- consensus detection
- adaptive urgency thresholds
- conversation summarization
- multi-user boardrooms


## Future extensions

Possible future improvements:

- advisor-to-advisor reply routing
- consensus detection layer
- dynamic threshold tuning
- long-transcript summarization
- cost-aware provider routing
