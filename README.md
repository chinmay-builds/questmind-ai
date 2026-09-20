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
return a response with the selected context. The deterministic `mock` provider
is the default for local/no-key development and does not call an AI service.

### OpenRouter provider

The first real provider is server-side OpenRouter. It is not imported by the
browser UI and its key is never bundled into static assets. To use it from a
server-side caller:

```bash
QUESTMIND_PROVIDER=openrouter
OPENROUTER_API_KEY=your-key
OPENROUTER_MODEL=openrouter/free
```

Optional attribution headers are configured with `OPENROUTER_SITE_URL` and
`OPENROUTER_APP_NAME`. Requests time out after 20 seconds by default; tune that
with `OPENROUTER_TIMEOUT_MS`. `openrouter/free` is OpenRouter's free-model
router, so its availability and limits can change. Set `OPENROUTER_MODEL` to a
specific model available to your account when you need predictable behavior.

Provider selection is intentionally strict:

```bash
QUESTMIND_PROVIDER=mock
```

Provider selection is explicit when `QUESTMIND_PROVIDER` is set. With no
provider and no API key, the resolver intentionally selects `mock`; with an
OpenRouter key present it selects `openrouter`. Selecting `openrouter` without
`OPENROUTER_API_KEY` raises `PROVIDER_CONFIGURATION_ERROR`, and unknown names
raise `UNSUPPORTED_PROVIDER`. Provider HTTP, JSON, invalid-payload, and timeout
failures are normalized as typed `ProviderRequestError`s.
`src/core/api.js` is a framework-neutral boundary that can be called from a
future server-side Vercel function without turning the static deployment into a
legacy serverless app. The current Vercel deployment remains static, so the
browser uses the explicit `/api/ask` Vercel function in production and keeps
the local mock fallback only on localhost. Configure these Vercel Project
Settings environment variables, redeploy after saving them, and never prefix
the secret with `NEXT_PUBLIC_` or expose it to client code:

```text
QUESTMIND_PROVIDER=openrouter
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openrouter/free
OPENROUTER_SITE_URL=https://your-vercel-domain
OPENROUTER_APP_NAME=QuestMind
```

`api/ask.js` accepts POST JSON only, caps bodies at 256 KB, returns normalized
JSON errors, and does not cache responses. `vercel.json` explicitly builds
that function with `@vercel/node` alongside the static root; redeploy is
required for the route and env vars to take effect.
