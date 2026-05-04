# Transcript

Source of truth: this file owns transcript and persistence vocabulary. The current database sketch lives in `architecture.md`; event payloads live in `events.md`.

## Purpose

This document defines the transcript model used by Table.

Transcripts are the persistent record of a Table conversation. They capture advisor participation, speaking order, urgency signals, Table round events, and conversation progression.

Transcripts in Table are structured conversation records that reflect the orchestration protocol and can be rendered later as meeting minutes.


## Design goals

The transcript system should support:

- live conversation readability
- meeting-minutes export
- deterministic replay of conversations
- storage that does not depend on one provider
- updates while responses are streaming
- round-aware conversation structure
- future summarization support


## Transcript structure

A transcript represents a single conversation. In the future product, that conversation belongs to a boardroom inside a workspace. For the MVP, conversations use seeded default workspace and boardroom records.

Each transcript contains:

- conversation metadata
- workspace and boardroom references
- advisor profile references
- ordered messages
- urgency ratings
- Table round events
- termination state


Example:

Transcript
  metadata
  messages[]
  urgency_ratings[]
  round_events[]
  termination_reason


## Transcript metadata

Metadata describes the session context.

Example:

{
  conversationId: string,
  workspaceId: string,
  boardroomId: string,
  createdAt: timestamp,
  updatedAt: timestamp
}


Metadata allows transcripts to be:

- resumed
- indexed
- filtered
- grouped by workspace and boardroom


## Terminology Mapping

The product may describe a live discussion as a session, but the backend stores it as a `Conversation`. Advisor turns are stored as `Message` rows. Urgency decisions and clean Table event history are stored separately so the conversation can be debugged and replayed.

Storage terms:

- `Conversation` = one transcript/session
- `Message` = one user entry, advisor turn, or persisted transcript block
- `turn_index` = the speaking position within the conversation
- `UrgencyRating` = one advisor's "should I speak next?" score and reason
- `RoundEvent` = one normalized Table event emitted by the orchestrator
- `speaker_id` = the advisor profile id or provider-backed id when the speaker is an advisor


## Advisor profile references

Each transcript should preserve enough advisor identity to explain who spoke. The full reusable advisor configuration lives in `AdvisorProfile`; message and event rows reference advisor profile ids where available.

Example:

advisorProfileId: "..."
advisorId: "anthropic"
provider: "anthropic"

For MVP, the app seeds four provider-backed advisor profiles: Anthropic, OpenAI, Gemini, and Grok. Later, users and workspaces can create custom advisor profiles and boardrooms can include or exclude them.


## Urgency score storage

Urgency scores are stored for transparency and replay.

Example:

urgencyScores: [
  {
    advisorId: "openai",
    advisorProfileId: "...",
    score: 8,
    reason: "Needs to evaluate tradeoffs"
  }
]


This enables:

- debugging orchestration behavior
- visualizing advisor intent
- future analytics features


## Message model

A message represents one user entry or one advisor response.

Example:

message: {
  speakerType: "advisor",
  speakerId: string,
  provider: string,
  turnIndex: number,
  content: string,
  timestamp: number
}


Messages are stored in speaking order.


## System events

Round events capture normalized Table orchestration signals that affect conversation flow.

Examples:

urgency_scores
speaker_start
token
speaker_end
round_end
turn_cap_reached
error


These events are saved in Table's provider-independent event language, not raw Anthropic/OpenAI/Gemini/Grok SDK events. They allow transcripts to reflect why conversations stopped and let developers inspect the exact run timeline.


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

complete
turn_cap_reached
error
user_interrupt


Termination states allow deterministic replay and debugging.


## Persistence strategy (MVP)

MVP persistence uses Prisma with PostgreSQL.

For local development, `DATABASE_URL` points to a Postgres database. For hosted deployment, the likely database is Supabase Postgres. The app does not plan to use localStorage as its main persistence layer.

The schema is future-aware, but the MVP runtime uses seeded defaults:

- default user
- default workspace
- default boardroom
- four provider-backed advisor profiles
- four boardroom advisor rows

Relational structure:

users
workspaces
workspace_members
advisor_profiles
boardrooms
boardroom_advisors
conversations
messages
urgency_ratings
round_events

This structure supports future auth, workspaces, reusable personal advisors, workspace-owned advisors, boardroom composition, and current MVP trace persistence without requiring all those UI features now.


## Transcript rendering model

Transcripts render live as a clean group conversation. The durable artifact can be exported as meeting minutes.

Example:

[Round 2]

Anthropic advisor:
We should evaluate long-term tradeoffs before committing.

OpenAI advisor:
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
