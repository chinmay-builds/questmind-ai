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
attachments (`name`, `type`, `size`), plus a safe model alias such as
`rules-sage`. Providers implement `answer(request)` and
return a response with the selected context. The deterministic `mock` provider
is the default for local/no-key development and does not call an AI service.

The model picker uses four server-resolved aliases:

| Alias | Label | Environment variable |
| --- | --- | --- |
| `rules-sage` | Rules Sage | `QUESTMIND_MODEL_RULES_SAGE` |
| `strategy-coach` | Strategy Coach | `QUESTMIND_MODEL_STRATEGY_COACH` |
| `tabletop-tactician` | Tabletop Tactician | `QUESTMIND_MODEL_TABLETOP_TACTICIAN` |
| `lorekeeper` | Lorekeeper | `QUESTMIND_MODEL_LOREKEEPER` |

Optional per-alias provider overrides are `QUESTMIND_PROVIDER_RULES_SAGE`,
`QUESTMIND_PROVIDER_STRATEGY_COACH`, `QUESTMIND_PROVIDER_TABLETOP_TACTICIAN`,
and `QUESTMIND_PROVIDER_LOREKEEPER`. The browser only sends the alias; the
server resolves the real model name and never returns it or an API key.
`GET /api/models` exposes only labels, provider names, and availability so the
UI can mark missing aliases as unavailable.

When `BRAVE_SEARCH_API_KEY` is configured on Vercel, `/api/ask` performs a
server-side Brave Web Search for the selected game, mode, and question. Only
the returned title, URL, and snippet are sent to the model; the key never
reaches the browser. Without that key, QuestMind explicitly tells the model
that real-time search was not run and will not invent a source.

The companion selector is available in both the table context panel and the
chat top rail, including narrow mobile layouts. A selected alias is only a
safe identifier; its configured provider/model remains server-side.

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
JSON errors, includes a clearly marked non-factual retry fallback, and does
not cache responses. A single retry is attempted only for transient HTTP
statuses (429/5xx). `vercel.json` explicitly builds that function and
`api/models.js` with `@vercel/node` alongside the static root; redeploy is
required for the routes and env vars to take effect.

## Answer quality

The OpenRouter system policy requires a concise answer to only the asked
question, using the selected game context and supplied images/rule text first.
Responses are normalized into an answer plus an `EVIDENCE` line. QuestMind
never claims to browse or invents citations: when no reliable source is
supplied, it says the answer cannot be verified and asks for the relevant
rulebook page, rule text, or image. The UI renders both fields as text, never
as HTML.

## Rulebook coverage

`src/rules.js` is the shared game/mode catalog. Every one of the 20 games and
every listed mode has a context record, an evidence label, and an optional
source URL. The catalog intentionally contains no invented rule text. The
Scythe / Automa entry includes a narrow, verified starter note and links to
Stonemaier Games' official rules page:

<https://stonemaiergames.com/games/scythe/scythe-rules/>

That source link does not mean the complete Automa deck logic is embedded:
turn-by-turn actions, cards, and edge cases remain unavailable until the
relevant official rulebook pages are supplied and transcribed into the
catalog. For every other unpopulated context, QuestMind says the answer
cannot be verified and asks for a rulebook page, rule text, or clearer image.
Player bounds are validated from the same catalog, including solo and
two-player mode adjustments.
