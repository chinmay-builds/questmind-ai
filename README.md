# QuestMind AI

QuestMind AI is a small, local-first foundation for an AI game companion. It
will eventually help players understand rules and plan turns, but this MVP
only defines the interface and returns an explicit placeholder response.

## Scope

- Accept a game/rules question from a command-line interface.
- Expose the same behavior as a small JavaScript library.
- Keep the response boundary ready for a future model or rules engine.

## Non-goals

This MVP does not call an AI provider, browse the web, store game state, or
claim to know the rules of any particular game. No API keys or external
services are required.

## Local development

Requires Node.js 20 or newer.

```bash
npm test
npm start -- "Can I play two action cards this turn?"
```

The CLI also accepts a question from standard input:

```bash
printf "How does scoring work?" | npm start
```

Every current answer is marked `[PLACEHOLDER]` so it cannot be mistaken for
real game advice.

## QuestMind Core

The chat uses a provider-agnostic core in `src/core/`. Its request contract
contains `game`, `mode`, `playerCount`, `question`, and optional image
attachments (`name`, `type`, `size`). Providers implement `answer(request)` and
return a response with the selected context. The only provider today is the
explicit deterministic `mock` provider; it is useful for local development and
does not call an AI service.

Provider selection is intentionally strict:

```bash
QUESTMIND_PROVIDER=mock
```

There is no silent fallback. Missing configuration raises
`PROVIDER_NOT_CONFIGURED`, and unknown names raise `UNSUPPORTED_PROVIDER`.
`src/core/api.js` is a framework-neutral boundary that can be called from a
future Vercel function without turning the static deployment into a legacy
serverless app. Adding a hosted provider should implement the same provider
contract, read its own documented secret, and leave the request/response
contract unchanged.
