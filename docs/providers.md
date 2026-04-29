# Providers

## Purpose

This document defines the provider abstraction layer used by Table.

Providers allow Table to communicate with multiple large language model (LLM)
vendors through a single unified interface.

This ensures:

- provider independence
- consistent orchestration behavior
- interchangeable model backends
- predictable streaming semantics
- future extensibility


## Design philosophy

Table treats model providers as interchangeable execution engines.

The orchestration layer never calls provider SDKs directly.

Instead:

Orchestrator → Provider Interface → Provider Adapter → External API

This architecture ensures new providers can be added without modifying the
conversation engine.


## Provider interface

Each provider implements a shared interface:

rateUrgency()
streamResponse()


### rateUrgency()

Requests a structured urgency score from the provider.

Purpose:

Determines speaking order for the current round.

Input:

- advisor persona prompt
- conversation transcript
- prior round context

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

- advisor persona prompt
- conversation transcript
- earlier responses from this round

Output:

Server-Sent Events token stream:

speaker_start
token
token
speaker_end


## Adapter architecture

Each provider is implemented as an adapter module.

Example:

providers/
  anthropic/
    AnthropicAdapter.ts
  openai/
    OpenAIAdapter.ts
  google/
    GeminiAdapter.ts
  xai/
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

Adapters normalize all responses into:

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

Each provider may use different models for different phases:

Phase 1 (urgency scoring)

Lower-cost fast models:

Claude Haiku
GPT-4o-mini
Gemini Flash
Grok-mini


Phase 2 (response generation)

Higher-quality reasoning models:

Claude Sonnet
GPT-4o
Gemini Pro
Grok flagship


This keeps orchestration responsive while controlling cost.


## Error handling strategy

Adapters handle provider-specific failures internally.

Examples:

- rate limits
- network failures
- malformed responses
- streaming interruptions

Adapters return normalized failure signals to the orchestrator.


Example:

{
  urgency: 0
  reason: "provider_error"
}


This allows orchestration to continue safely.


## Provider configuration

Providers are registered at runtime.

Example:

providers = [
  AnthropicAdapter,
  OpenAIAdapter,
  GeminiAdapter,
  GrokAdapter
]


Boardrooms select advisors from available providers.

This enables:

- configurable advisor sets
- provider experimentation
- fallback routing


## Future extensions

Possible provider-layer improvements:

- automatic fallback routing
- latency-aware provider selection
- cost-aware provider routing
- model capability detection
- streaming retry recovery
- provider health monitoring
