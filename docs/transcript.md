# Transcript

## Purpose

This document defines the transcript model used by Table.

Transcripts are the persistent record of a boardroom session. They capture
advisor participation, speaking order, urgency signals, and conversation
progression across rounds.

Unlike traditional chat logs, transcripts in Table are structured as
meeting-style records that reflect the orchestration protocol.


## Design goals

The transcript system is designed to support:

- meeting-minutes style readability
- deterministic replay of conversations
- provider-independent storage
- streaming-friendly updates
- round-aware conversation structure
- future summarization support


## Transcript structure

A transcript represents a single boardroom session.

Each transcript contains:

- boardroom metadata
- advisor configuration
- ordered rounds
- ordered turns within each round
- system events
- termination state


Example:

Transcript
  metadata
  advisors
  rounds[]
    urgency_scores
    turns[]
      speaker
      provider
      content
      timestamp
  termination_reason


## Transcript metadata

Metadata describes the session context.

Example:

{
  sessionId: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  boardroomId: string
}


Metadata allows transcripts to be:

- resumed
- indexed
- filtered
- grouped by boardroom


## Advisor registry snapshot

Each transcript stores the advisor configuration used at runtime.

Example:

advisors: [
  {
    name: "Strategist",
    provider: "anthropic",
    model: "claude-sonnet"
  }
]


This ensures transcripts remain reproducible even if provider defaults change later.


## Round model

Conversations are stored as ordered rounds.

Each round contains:

- urgency scores
- ordered turns
- round index


Example:

round: {
  index: number,
  urgencyScores: [],
  turns: []
}


Rounds reflect orchestration structure rather than message order alone.


## Urgency score storage

Urgency scores are stored for transparency and replay.

Example:

urgencyScores: [
  {
    advisor: "Strategist",
    score: 8,
    reason: "Needs to evaluate tradeoffs"
  }
]


This enables:

- debugging orchestration behavior
- visualizing advisor intent
- future analytics features


## Turn model

A turn represents a single advisor response.

Example:

turn: {
  advisor: string,
  provider: string,
  roundIndex: number,
  content: string,
  timestamp: number
}


Turns are always stored in speaking order.


## System events

System events capture orchestration signals that affect conversation flow.

Examples:

round_start
room_quiet
round_cap_reached
user_interrupt


These events allow transcripts to reflect why conversations stopped.


## Streaming integration

Transcripts update incrementally during streaming.

Flow:

token arrives
append token to active turn
emit UI update
persist partial content


This allows:

- real-time UI updates
- crash-safe persistence
- session recovery support


## Termination states

Each transcript records why the conversation ended.

Possible values:

room_quiet
round_cap_reached
user_interrupt
session_complete


Termination states allow deterministic replay and debugging.


## Persistence strategy (MVP)

Initial persistence options:

PostgreSQL (preferred)
localStorage fallback


Example relational structure:

boardrooms
sessions
rounds
turns
events


This structure mirrors orchestration hierarchy.


## Transcript rendering model

Transcripts render as meeting minutes rather than chat bubbles.

Example:

[Round 2]

Strategist (Anthropic):
We should evaluate long-term tradeoffs before committing.

Engineer (OpenAI):
Implementation complexity is moderate.


Rendering preserves:

- round grouping
- speaking order
- advisor identity
- provider identity


## Future extensions

Planned transcript-layer improvements:

- rolling transcript summarization
- searchable transcript index
- quote extraction
- advisor contribution analytics
- export to markdown / PDF
- multi-session boardroom history
