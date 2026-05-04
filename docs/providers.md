# Providers

Source of truth: this file owns the provider adapter contract and provider-specific normalization rules. The high-level system map lives in `architecture.md`; SSE event payloads live in `events.md`.

## Purpose

This document defines the provider abstraction layer used by Table.

Providers allow Table to communicate with multiple large language model (LLM)
vendors through a single unified interface.

This gives the app:

- one interface for many model vendors
- the same orchestration loop no matter which model is used
- a clear place to handle each provider's SDK quirks
- room to add more providers later


## Design philosophy

Table treats model providers as swappable execution engines.

The orchestration layer never calls provider SDKs directly.

Instead:

Orchestrator → Provider Interface → Provider Adapter → External API

This lets us add a provider without rewriting the conversation engine.


## Provider interface

Each provider implements a shared interface:

rateUrgency()
streamResponse()


### rateUrgency()

Requests a structured urgency score from the provider.

Purpose:

Determines whether the advisor should speak next given the current conversation.

Input:

- advisor seat/system prompt
- conversation transcript
- prior responses from the current round, if any

Output:

{
  urgency: number
  reason: string
}


### streamResponse()

Streams the advisor's response tokens to the orchestrator.

Purpose:

Generates the advisor's contribution to the meeting transcript.

Input:

- advisor seat/system prompt
- conversation transcript
- earlier responses from this round

Output:

Async text chunks consumed by the orchestrator.

The orchestrator turns those chunks into Table SSE events such as `speaker_start`, `token`, and `speaker_end`.


## Adapter architecture

Each provider is implemented as an adapter module.

Example:

providers/
  AnthropicAdapter.ts
  OpenAIAdapter.ts
  GeminiAdapter.ts
  GrokAdapter.ts


Each adapter:

- implements the shared interface
- handles authentication
- formats prompts correctly
- normalizes streaming output
- returns structured urgency results


## Why adapters exist

Provider SDKs differ in:

- streaming formats
- request structure
- authentication
- response shape
- rate limits

Adapters isolate those differences.

The orchestrator never depends on vendor-specific APIs.


## Streaming normalization

Different providers stream responses differently.

Examples:

Anthropic → event-based stream
OpenAI → delta token stream
Gemini → chunked stream
xAI → message-based stream

Adapters normalize provider streams into async text chunks.

The orchestrator wraps those chunks in Table events:

speaker_start
token
speaker_end

This allows the UI to remain provider-agnostic.


## Urgency scoring normalization

Some providers do not naturally produce structured outputs.

Adapters ensure all urgency responses follow:

{
  urgency: number
  reason: string
}

If needed:

- structured prompting is applied
- parsing is enforced
- fallback validation is performed


## Model selection strategy

Each provider may use different configured models for different jobs:

Urgency scoring

Lower-cost fast models where available.


Response generation

Higher-quality response models where useful.


This keeps urgency checks fast and cheap while saving stronger models for full responses.


## Error handling strategy

Adapters handle provider-specific failures internally.

Examples:

- rate limits
- network failures
- malformed responses
- streaming interruptions

Adapters return provider failures in a shape the orchestrator can understand.


Example:

{
  urgency: 0
  reason: "provider_error"
}


This lets the room keep going when one provider fails.


## Provider configuration

Provider-backed advisor seats are registered at runtime.

Example:

advisors = [
  { id: "anthropic", provider: anthropicProvider, systemPrompt: "" },
  { id: "openai", provider: openaiProvider, systemPrompt: "" }
]


MVP uses this runtime list directly. Saved boardrooms, custom advisor sets, and named personas are future features.

This enables:

- simple provider experimentation during MVP
- fallback routing


## Future extensions

Possible provider-layer improvements:

- automatic fallback routing
- latency-aware provider selection
- cost-aware provider routing
- model capability detection
- streaming retry recovery
- provider health monitoring
