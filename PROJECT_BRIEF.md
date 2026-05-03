# Project Brief

## One-Sentence Pitch

Table is an AI advisory room where multiple model-backed advisors discuss a question together, speak in urgency-ranked turns, and produce a downloadable meeting-minutes document.

## Who It Is For

Table is for people who want more than one AI perspective before making a decision. The first target user is a developer, student, or early-career professional who wants to compare tradeoffs, hear pushback, and turn a messy question into clearer next steps.

## Problem

Most AI tools make you choose one model at a time. That hides the fact that different models have different strengths, tones, and blind spots. If a user wants disagreement, synthesis, or a second opinion, they have to manually copy context between tools.

## Product Bet

The disagreement between models is useful. Table treats that disagreement as the product by convening a small panel of advisors and letting the conversation unfold in structured rounds.

## Core Mechanic

Each round has two phases:

1. Advisors rate how important it is for them to respond.
2. Advisors speak in urgency order, with later speakers seeing what earlier speakers said.

The room pauses when the advisors no longer think the conversation needs more input, when the round cap is reached, or when the user interrupts.

## MVP Success Criteria

- A user can ask one question and receive responses from multiple advisors.
- Speaking order changes based on urgency scores, not a fixed round-robin order.
- Each advisor can see earlier responses from the same round.
- The live UI makes the advisor discussion easy to follow as a group conversation.
- The user can export the finished discussion as a meeting-minutes PDF.
- The conversation can pause naturally when urgency drops below a threshold.
- The demo can run locally and be recorded clearly.

## Stretch Features

These are not required for the MVP demo, but are strong follow-up candidates if the core build is ahead of schedule.

- Custom user-defined personas through an advisor editor
- Multiple boardrooms, such as Career Council or Project Boardroom
- Public deployment with hosted frontend, backend, and database
- `@`-mentions to call on a specific advisor out of urgency order
- Save quote feature for memorable advisor lines
- Voice UI for speaking to and hearing from the room
- CLI interface where advisors work toward consensus and return their strongest shared answer, with Codex and Claude tooling available
- Cross-interface awareness so different Table surfaces can share relevant user context and data
- User accounts and authentication
- Multi-user boardrooms where multiple users can sit in on the same meeting
- Free-for-all mode where urgency ordering is turned off and users and advisors can speak freely
- Per-advisor long-term memory of the user

## Out Of Scope For MVP

- User accounts and auth
- Custom advisor creation
- Multi-user boardrooms
- Voice input or output
- Long-term memory across conversations
- Production deployment
- Polished analytics or scoring
