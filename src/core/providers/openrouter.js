import { validateQuestRequest } from "../contracts.js";
import { ProviderConfigurationError, ProviderRequestError } from "../errors.js";

const DEFAULT_MODEL = "openrouter/free";
const DEFAULT_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_TIMEOUT_MS = 20_000;

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

function messageContent(request) {
  const text = `Game: ${request.game}\nMode: ${request.mode}\nPlayers: ${request.playerCount}\nQuestion: ${request.question}`;
  const images = request.attachments
    .filter(({ dataUrl }) => typeof dataUrl === "string" && dataUrl.startsWith("data:image/"))
    .map(({ dataUrl }) => ({ type: "image_url", image_url: { url: dataUrl } }));
  return images.length ? [{ type: "text", text }, ...images] : text;
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
        const response = await config.fetchImpl(config.endpoint, {
          method: "POST",
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            model: config.model,
            messages: [
              { role: "system", content: "You are QuestMind, a concise and honest board-game companion. Explain rules clearly and label uncertainty." },
              { role: "user", content: messageContent(request) },
            ],
          }),
        });
        let payload;
        try {
          payload = await response.json();
        } catch {
          throw new ProviderRequestError("OpenRouter returned invalid JSON.", "PROVIDER_INVALID_JSON");
        }
        if (!response.ok) {
          const detail = typeof payload?.error?.message === "string" ? `: ${payload.error.message}` : "";
          throw new ProviderRequestError(`OpenRouter request failed with HTTP ${response.status}${detail}`, "PROVIDER_HTTP_ERROR");
        }
        const text = payload?.choices?.[0]?.message?.content;
        if (typeof text !== "string" || !text.trim()) {
          throw new ProviderRequestError("OpenRouter returned no assistant message.", "PROVIDER_INVALID_RESPONSE");
        }
        return {
          text: text.trim(),
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
