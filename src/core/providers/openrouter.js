import { normalizeAssistantResponse, validateQuestRequest } from "../contracts.js";
import { ProviderConfigurationError, ProviderRequestError } from "../errors.js";

const DEFAULT_MODEL = "openrouter/free";
const DEFAULT_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 1;

function readConfig(env = globalThis.process?.env, overrides = {}) {
  const apiKey = overrides.apiKey ?? env?.OPENROUTER_API_KEY;
  if (typeof apiKey !== "string" || !apiKey.trim()) {
    throw new ProviderConfigurationError("OPENROUTER_API_KEY is required when QUESTMIND_PROVIDER=openrouter.");
  }
  const timeoutMs = Number(overrides.timeoutMs ?? env?.OPENROUTER_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  if (!Number.isFinite(timeoutMs) || timeoutMs < 100) {
    throw new ProviderConfigurationError("OPENROUTER_TIMEOUT_MS must be at least 100 milliseconds.");
  }
  return {
    apiKey: apiKey.trim(),
    model: overrides.model ?? env?.OPENROUTER_MODEL ?? DEFAULT_MODEL,
    siteUrl: overrides.siteUrl ?? env?.OPENROUTER_SITE_URL,
    appName: overrides.appName ?? env?.OPENROUTER_APP_NAME,
    timeoutMs,
    endpoint: overrides.endpoint ?? DEFAULT_ENDPOINT,
    fetchImpl: overrides.fetchImpl ?? globalThis.fetch,
  };
}

function formatUserMessage(request) {
  const lines = [
    `Game: ${request.game}`,
    `Mode: ${request.mode}`,
    `Players: ${request.playerCount}`,
    `Question: ${request.question}`,
  ];
  if (request.ruleContext?.summary) {
    lines.push(`Game Rule Overview: ${request.ruleContext.summary}`);
  }
  if (request.ruleContext?.evidence) {
    lines.push(`Rule Reference: ${request.ruleContext.evidence}`);
  }
  return lines.join("\n");
}

function messageContent(request) {
  const text = formatUserMessage(request);
  const images = request.attachments
    .filter(({ dataUrl }) => typeof dataUrl === "string" && dataUrl.startsWith("data:image/"))
    .map(({ dataUrl }) => ({ type: "image_url", image_url: { url: dataUrl } }));
  return images.length ? [{ type: "text", text }, ...images] : text;
}

const SYSTEM_PROMPT = `You are QuestMind, an expert, friendly, and concise table-side board-game companion.
Your mission is to keep game night moving smoothly by answering rules questions, evaluating turns, clarifying card interactions, and providing tactical guidance.

Strict behavior rules:
1. GREETINGS & SMALL TALK: If the user says hello, hi, hey, thanks, or engages in casual small talk, reply warmly and politely in 1-2 short sentences. Introduce yourself as QuestMind, their table-side companion for the selected game. Set EVIDENCE to: QuestMind Table-Side Companion.
2. BOARD GAME QUESTIONS: Answer questions about board game rules, card powers, turn choices, strategy, setup, and edge cases directly, clearly, and concisely in 1-3 short sentences. Draw upon official rules, standard tabletop mechanics, attached images, and search results. Never refuse standard rules questions when the rule is known. Set EVIDENCE to the official rulebook section, card name, or rule reference.
3. NON-BOARD GAME QUESTIONS: If the user asks about topics completely unrelated to board games or tabletop gaming (such as general programming, weather, politics, recipes, general trivia, personal advice), politely decline and state that QuestMind is exclusively a board-game companion. Set EVIDENCE to: Tabletop scope policy.
4. FORMAT: You must ALWAYS format your response with exactly two labeled lines:
ANSWER: <your direct answer, greeting, or friendly decline>
EVIDENCE: <rule source, rulebook section, card, or scope policy>`;

function extractAssistantText(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((part) => part && (part.type === "text" || part.type === "output_text") && typeof part.text === "string")
      .map((part) => part.text.trim())
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

export function createOpenRouterProvider(options = {}) {
  const config = readConfig(options.env, options);
  if (typeof config.fetchImpl !== "function") {
    throw new ProviderConfigurationError("A fetch implementation is required for the OpenRouter provider.");
  }
  return {
    name: "openrouter",
    async answer(input) {
      const request = validateQuestRequest(input);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
      const headers = {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      };
      if (config.siteUrl) headers["HTTP-Referer"] = config.siteUrl;
      if (config.appName) headers["X-Title"] = config.appName;
      try {
        let response;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
          try {
            response = await config.fetchImpl(config.endpoint, {
              method: "POST",
              headers,
              signal: controller.signal,
              body: JSON.stringify({
                model: request.model || config.model,
                plugins: request.webSearch === false ? undefined : [{ id: "web", max_results: 5 }],
                messages: [
                  { role: "system", content: SYSTEM_PROMPT },
                  { role: "user", content: messageContent(request) },
                ],
              }),
            });
          } catch (error) {
            if (attempt < MAX_RETRIES && error?.name !== "AbortError") continue;
            throw error;
          }
          if (attempt < MAX_RETRIES && [429, 500, 502, 503, 504].includes(response.status)) continue;
          break;
        }
        let payload;
        try {
          payload = await response.json();
        } catch {
          throw new ProviderRequestError(`OpenRouter returned a non-JSON response (HTTP ${response.status}).`, "PROVIDER_INVALID_JSON");
        }
        if (!response.ok) {
          const detail = typeof payload?.error?.message === "string" ? `: ${payload.error.message}` : "";
          throw new ProviderRequestError(`OpenRouter request failed with HTTP ${response.status}${detail}`, "PROVIDER_HTTP_ERROR");
        }
        if (payload?.error && typeof payload.error === "object") {
          const detail = typeof payload.error.message === "string" ? `: ${payload.error.message}` : "";
          throw new ProviderRequestError(`OpenRouter returned an API error${detail}`, "PROVIDER_API_ERROR");
        }
        const text = extractAssistantText(payload);
        if (!text.trim()) {
          throw new ProviderRequestError("OpenRouter returned no readable assistant content in choices[0].message.content.", "PROVIDER_INVALID_RESPONSE");
        }
        const normalized = normalizeAssistantResponse(text);
        return {
          text: normalized.answer,
          evidence: normalized.evidence,
          provider: "openrouter",
          context: {
            game: request.game,
            mode: request.mode,
            playerCount: request.playerCount,
            attachmentCount: request.attachments.length,
          },
        };
      } catch (error) {
        if (error?.name === "AbortError") {
          throw new ProviderRequestError(`OpenRouter request timed out after ${config.timeoutMs}ms.`, "PROVIDER_TIMEOUT");
        }
        if (error instanceof ProviderRequestError) throw error;
        throw new ProviderRequestError(`OpenRouter request failed: ${error?.message ?? "unknown error"}`);
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

export { DEFAULT_MODEL };
