# Orchestration

## Purpose

This document defines the conversation engine that powers Table.

The orchestrator determines:

- which advisors speak
- when they speak
- what context they see
- when the room pauses
- when the user can intervene

Table conversations follow a structured round-based protocol rather than free-form agent chatter.
This protocol ensures deterministic turn ordering, bounded execution cost, and provider‑independent orchestration behavior.


## Definitions

**Cycle**

The full orchestration execution triggered by a single user message.

**Round**

One urgency evaluation phase followed by sequential advisor responses.

**Turn**

A single advisor response within a round.


## Conversation lifecycle

Each user message starts a new orchestration cycle.

The lifecycle for a single cycle:

User message  
↓  
Urgency round (parallel)  
↓  
Sort advisors by urgency  
↓  
Sequential advisor responses  
↓  
Urgency recomputed  
↓  
Continue or pause  


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


## Turn ordering

After urgency scoring:

- Advisors are sorted by urgency (descending)
- Highest urgency speaks first
- Remaining advisors speak sequentially
- Each advisor sees the full transcript including earlier speakers in the same round

Tie-breaking rule:

Advisor order defined in board configuration.


## Response round

During the response round:

Each advisor:

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

After all advisors speak:

Urgency is recomputed.

Possible outcomes:

| Condition | Result |
|----------|--------|
| max urgency ≥ threshold | start next round |
| max urgency < threshold | pause conversation |
| round cap reached | pause conversation |
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


## Round cap safety limit

To prevent runaway conversations:

A maximum round cap exists.

Example:

MAX_ROUNDS = 10

If reached:

Conversation pauses automatically.


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

  scores = parallel(rateUrgency(advisors))

  if max(scores) < pause_threshold:
      emit("room_quiet")
      break

  ordered = sort(scores descending)

  for advisor in ordered:
      streamResponse(advisor)

  if round_count >= MAX_ROUNDS:
      emit("round_cap_reached")
      break


## Design goals

The orchestration protocol prioritizes:

- predictable turn ordering
- cross-agent awareness
- controlled token usage
- natural stopping conditions
- provider independence
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

- reactive urgency updates mid-round
- advisor-to-advisor reply routing
- consensus detection layer
- dynamic threshold tuning
- long-transcript summarization
- cost-aware provider routing
