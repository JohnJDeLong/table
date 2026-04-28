# Table

A panel of AI advisors, each backed by a different foundation model, that talk to each other in real time.

## What it is

You ask a question. Multiple AI advisors — each running on a different model (Claude, GPT, Gemini, Grok) — first rate how strongly they want to weigh in. They then respond in order of urgency, with each later speaker reading what the earlier ones said. The conversation continues round by round until the room goes quiet on its own or you interrupt.

The output reads like meeting minutes — a timestamped, document-style transcript rather than a chat log.

## Why it exists

Different foundation models have genuinely different voices: Claude is reflective, GPT is decisive, Gemini is conversational, Grok is irreverent. Most AI tools hide this by giving you one model at a time. Table treats those differences as the product. You convene the panel; their disagreements are the value.

## Tech stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL via Prisma (with localStorage fallback)
- LLM Providers: Anthropic, OpenAI, Google, xAI (or Mistral fallback)
- Streaming: Server-sent events

## Status

Pre-development. Currently in the docs-and-architecture phase before code starts.

## Project structure

- `README.md` — this file, the orienting overview
- `architecture.md` — technical spec, the most-consulted doc
- `AGENTS.md` — guidance for AI assistants working in this repo
- `CONTRIBUTING.md` — commit format, PR template, code-comment conventions
- `roadmap.md` — phased plan (MVP → stretch → future)
- `todo.md` — active task list, block-by-block
- `agents.local.md` — personal context (gitignored)


## Author

Built by John Delong
