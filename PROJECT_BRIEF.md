# Project Brief

## One-Sentence Pitch

Table is an AI advisory room where multiple model-backed advisors discuss a question together, speak in urgency-ranked turns, and produce a meeting-minutes-style transcript.

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
- The transcript reads like meeting minutes rather than chat bubbles.
- The conversation can pause naturally when urgency drops below a threshold.
- The demo can run locally and be recorded clearly.

## Out Of Scope For MVP

- User accounts and auth
- Custom advisor creation
- Multi-user boardrooms
- Voice input or output
- Long-term memory across conversations
- Production deployment
- Polished analytics or scoring
