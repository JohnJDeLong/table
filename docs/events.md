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

round_start
urgency_scores
speaker_start
token
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

SSE endpoint:

POST /api/conversations/:id/messages


## Event format

Each event follows the standard SSE structure:

event: <event_name>
data: <json_payload>


Example:

event: speaker_start
data: {
  "advisorId": "advisor_strategist",
  "provider": "anthropic",
  "roundIndex": 2
}


## Event types

### round_start

Signals the beginning of a new round.

Payload:

{
  roundIndex: number
}


### urgency_scores

Emitted after all advisors submit urgency ratings.

Payload:

{
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
  advisorId: string,
  provider: string,
  roundIndex: number
}


### token

Streams partial response content.

Payload:

{
  advisorId: string,
  text: string
}


### speaker_end

Signals completion of an advisor response.

Payload:

{
  advisorId: string,
  roundIndex: number
}


### round_end

Signals completion of a response round.

Payload:

{
  roundIndex: number,
  paused: boolean,
  pauseReason: string
}


### room_quiet

Signals that the urgency threshold has dropped below the continuation threshold.

Payload:

{
  reason: "urgency_below_threshold"
}


### turn_cap_reached

Signals that the temporary maximum turn limit for the current round has been reached.

Payload:

{
  maxTurnsPerRound: number
}


### user_interrupt

Signals that the user has interrupted the current round.

Payload:

{
  reason: "user_interrupt"
}


### error

Signals a streaming or provider error.

Payload:

{
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

round_start
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

- create a new round container on round_start
- display urgency indicators on urgency_scores
- open a transcript block on speaker_start
- append content on token
- finalize advisor block on speaker_end
- close round container on round_end
- display pause state on room_quiet


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

round_start
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
round_start
urgency_scores
room_quiet


## Future extensions

Planned event-layer improvements:

- partial urgency updates during rating phase
- progress indicators for active providers
- latency metrics per advisor
- streaming retry signals
- heartbeat keepalive events
