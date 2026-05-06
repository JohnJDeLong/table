# Roadmap

## Phase 1: MVP (Blocks 1-12, target: ~2 weeks)

The shippable, demo-ready version.

- All 4 providers behind a uniform adapter interface (Anthropic, OpenAI, Google, xAI/fallback)
- Live urgency-rating mechanic
- Sequential responses with cross-agent context and recalibration after each advisor response
- Auto-pause when urgency drops below threshold
- Temporary max turns per round as MVP safety net
- User interrupt control
- Chat-like live conversation UI with meeting-minutes PDF export
- Provider-backed advisor seats for the active providers
- Future-aware PostgreSQL schema for users, workspaces, boardrooms, advisor profiles, conversations, urgency ratings, and event traces
- Seeded default user, workspace, boardroom, and four provider-backed advisors for MVP runtime
- Local demo with recorded video

## Phase 2: Stretch (during MVP window if ahead, or post-bootcamp)

- Custom user-defined personas (advisor editor)
- Named default advisor personas
- Multiple boardrooms (Career Council, Project Boardroom, etc.)
- Deploy to public URL (Vercel + Render + Supabase Postgres)
- @-mention to call on a specific advisor out of order
- "Save quote" feature for memorable advisor lines
- Voice UI for speaking to and hearing from the room
- CLI interface where advisors work toward consensus and return their strongest shared answer, with Codex and Claude tooling available
- Cross-interface awareness so different Table surfaces can share relevant user context and data
- User accounts and authentication
- Multi-user boardrooms where multiple users can sit in on the same meeting
- Free-for-all mode where urgency ordering is turned off and users and advisors can speak freely

## Phase 3: Future (post-bootcamp ambition)

- See `PROJECT_BRIEF.md` for the official stretch features list.

## Cut Order Under Pressure

If the MVP slips, drop in this order:

1. **Deploy** → record local demo video instead
2. **Hosted database** → run Postgres locally for demo if Supabase/deploy slips
3. **4th provider** → ship with 3
4. **Polish on chat-like conversation UI / PDF export** → ship with functional but unstyled UI

Do **not** cut: the urgency mechanic, cross-agent context awareness, or the ability to turn the discussion into meeting minutes.
