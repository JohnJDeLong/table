# Roadmap

## Phase 1: MVP (Blocks 1-12, target: ~2 weeks)

The shippable, demo-ready version.

- All 4 providers behind a uniform adapter interface (Anthropic, OpenAI, Google, xAI/fallback)
- Urgency-rating mechanic (Phase 1)
- Sequential responses with cross-agent context (Phase 2)
- Auto-pause when urgency drops below threshold
- Hard round cap as safety net
- User interrupt control
- Minutes-style transcript UI
- 4 default advisors with hardcoded personas (one per provider, tuned to lean into each model's strengths)
- Conversation persistence (Postgres preferred, localStorage as fallback)
- Local demo with recorded video

## Phase 2: Stretch (during MVP window if ahead, or post-bootcamp)

- Custom user-defined personas (advisor editor)
- Multiple boardrooms (Career Council, Project Boardroom, etc.)
- Deploy to public URL (Vercel + Render + Supabase)
- @-mention to call on a specific advisor out of order
- "Save quote" feature for memorable advisor lines

## Phase 3: Future (post-bootcamp ambition)

- CLI version (`table ask "should I take this offer"`) sharing the same backend
- Voice input/output (talk to the room)
- Cross-system shared work awareness — agents aware of context from other tools (notes, files, browser)
- Per-advisor long-term memory of the user
- Multi-user shared boardrooms

## Cut Order Under Pressure

If the MVP slips, drop in this order:

1. **Deploy** → record local demo video instead
2. **Postgres** → fall back to localStorage
3. **4th provider** → ship with 3
4. **Polish on Minutes UI** → ship with functional but unstyled UI

Do **not** cut: the urgency mechanic, cross-agent context awareness, or the Minutes aesthetic direction.
