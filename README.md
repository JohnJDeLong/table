# Table

Table is a multi-provider, multi-agent decision workspace where advisors determine speaking order via urgency scoring and continue discussion until collective urgency drops below a threshold, signaling that the room has reached a natural stopping point, or the user intervenes.

Convene a room.  
Ask a question.  
Watch the advisors collaborate.

## What it is

A panel of AI advisors — each backed by a different foundation model — reason together in real time. Instead of choosing one model, you convene a room and let the advisors decide who speaks next.



## How it works

Each user message triggers a two-phase orchestration:

1. **Urgency round (parallel)** — every advisor rates how strongly they need to respond.
2. **Response round (sequential)** — advisors speak in urgency order. Each later speaker reads what the earlier speakers said in this round.

After each round, urgency is recomputed. The conversation continues until the room goes quiet on its own (urgency drops below a threshold) or you interrupt.

```
User message
   ↓
Urgency round (parallel)
   ↓
Responses in urgency order (sequential)
   ↓
Urgency recomputed → continue or pause
```

The output reads like **meeting minutes** — a timestamped, document-style transcript, not a chat log.

## Architecture highlights

Table implements:

- multi-provider adapter interface
- urgency-based turn-taking protocol
- cross-agent context awareness
- termination-aware discussion loop
- streaming responses over Server-Sent Events (SSE)
- persistent meeting transcript model

## Why this exists

Different foundation models reason differently:

Claude — reflective  
GPT — decisive  
Gemini — conversational  
Grok — irreverent  

Most AI tools hide that by giving you one model at a time.

Table treats those differences as the product.

You convene the panel.  
Their disagreements are the value.


## Tech stack

**Frontend**
- React + TypeScript + Vite

**Backend**
- Node.js + Express + TypeScript

**Data**
- PostgreSQL via Prisma (with localStorage fallback)

**Providers**
- Anthropic, OpenAI, Google, xAI (or Mistral fallback)

**Streaming**
- Server-Sent Events


## Status

Pre-development. Currently in the docs-and-architecture phase before code starts.


## Project structure

`README.md` — overview and orientation  
`AGENTS.md` — guidance for AI assistants working in this repo  
`CONTRIBUTING.md` — commit format, PR template, code-comment conventions  
`PROJECT_BRIEF.md` — product brief, MVP success criteria, and scope boundaries  
`docs/` — system design, protocol, roadmap, and execution docs  
`agents.local.md` — personal context (gitignored)


## Author

Built by John Delong
