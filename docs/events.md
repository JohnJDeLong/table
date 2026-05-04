# Events

Source of truth: this file owns the SSE event names, payloads, and ordering guarantees. The API route list lives in `architecture.md`; the orchestration loop that emits these events lives in `orchestration.md`.

## Purpose

This document defines the Server-Sent Events (SSE) protocol used by Table to stream
live orchestration updates from the backend to the frontend.

The events layer lets the UI render advisor activity in real time without knowing how each provider streams tokens.


## Design goals

The events protocol supports:

- real-time advisor response streaming
- round-aware conversation updates
- provider-independent token delivery
- deterministic UI rendering behavior
- clean user interrupts
- extensibility for future orchestration signals


## Event stream overview

During a conversation cycle, the backend emits a structured sequence of events.

Typical flow:

urgency_scores
speaker_start
token
token
speaker_end
urgency_scores
speaker_start
token
speaker_end
round_end


## Event transport

Events are delivered using Server-Sent Events (SSE).

Why SSE:

- simple browser-native streaming support
- works over standard HTTP
- automatic reconnection behavior
- ordered message delivery
- low infrastructure complexity

Target SSE endpoint:

POST /api/conversations/:id/messages

Current MVP test endpoint:

POST /api/round-test


## Event format

Each event follows the standard SSE structure:

event: <event_name>
data: <json_payload>


Example:

event: speaker_start
data: {
  "type": "speaker_start",
  "advisorId": "anthropic",
  "urgency": 7,
  "reason": "I can add a useful implementation tradeoff."
}


## Event types

### urgency_scores

Emitted after all advisors submit urgency ratings.

Payload:

{
  type: "urgency_scores",
  scores: [
    {
      advisorId: string,
      urgency: number,
      reason: string
    }
  ]
}


### speaker_start

Signals that an advisor has begun responding.

Payload:

{
  type: "speaker_start",
  advisorId: string,
  urgency: number,
  reason: string
}


### token

Streams partial response content.

Payload:

{
  type: "token",
  advisorId: string,
  text: string
}


### speaker_end

Signals completion of an advisor response.

Payload:

{
  type: "speaker_end",
  advisorId: string
}


### round_end

Signals completion of a response round.

Payload:

{
  type: "round_end",
  spokenAdvisorIds: string[]
}


### turn_cap_reached

Signals that the temporary maximum turn limit for the current round has been reached.

Payload:

{
  type: "turn_cap_reached",
  maxTurnsPerRound: number
}


### user_interrupt

Signals that the user has interrupted the current round.

Payload:

{
  type: "user_interrupt",
  reason: "user_interrupt"
}


### error

Signals a streaming or provider error.

Payload:

{
  type: "error",
  message: string
}


## Event ordering guarantees

The backend guarantees:

- events are emitted in deterministic order
- tokens are streamed sequentially
- urgency_scores may be emitted multiple times in a round as advisors recalibrate after each response
- speaker_start always precedes token events
- speaker_end always follows token events
- round_end always terminates a round


Example valid sequence:

urgency_scores
speaker_start
token
token
speaker_end
urgency_scores
speaker_start
token
speaker_end
urgency_scores
round_end


## UI responsibilities

The frontend event listener must:

- display urgency indicators on urgency_scores
- open a transcript block on speaker_start
- append content on token
- finalize advisor block on speaker_end
- close round container on round_end
- infer the quiet state from round_end when no advisor remains above threshold


## Interruption handling

When a user interrupts:

The backend emits:

user_interrupt

Frontend must:

- stop rendering active streams
- close active advisor blocks
- prepare for next cycle


## Streaming lifecycle example

Example full session event flow:

urgency_scores
speaker_start
token
token
speaker_end
urgency_scores
speaker_start
token
speaker_end
urgency_scores
round_end


## Future extensions

Planned event-layer improvements:

- partial urgency updates during rating phase
- progress indicators for active providers
- latency metrics per advisor
- streaming retry signals
- heartbeat keepalive events
