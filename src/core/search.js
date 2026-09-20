import { ProviderConfigurationError, ProviderRequestError } from "./errors.js";

const DEFAULT_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";

export function searchConfig(env = globalThis.process?.env, overrides = {}) {
  return {
    apiKey: overrides.apiKey ?? env?.BRAVE_SEARCH_API_KEY,
    endpoint: overrides.endpoint ?? env?.QUESTMIND_SEARCH_ENDPOINT ?? DEFAULT_ENDPOINT,
    fetchImpl: overrides.fetchImpl ?? globalThis.fetch,
  };
}

export async function searchRuleSources(query, options = {}) {
  const config = searchConfig(options.env, options);
  if (!config.apiKey) return { attempted: false, results: [] };
  if (typeof config.fetchImpl !== "function") {
    throw new ProviderConfigurationError("A fetch implementation is required for web search.");
  }
  const url = new URL(config.endpoint);
  url.searchParams.set("q", query);
  url.searchParams.set("count", "5");
  let response;
  try {
    response = await config.fetchImpl(url, {
      headers: { Accept: "application/json", "X-Subscription-Token": config.apiKey },
    });
  } catch (error) {
    throw new ProviderRequestError(`Web search failed: ${error?.message ?? "unknown error"}`, "SEARCH_REQUEST_FAILED");
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ProviderRequestError(`Web search returned invalid JSON (HTTP ${response.status}).`, "SEARCH_INVALID_JSON");
  }
  if (!response.ok) {
    throw new ProviderRequestError(`Web search failed with HTTP ${response.status}.`, "SEARCH_HTTP_ERROR");
  }
  const results = (payload?.web?.results ?? [])
    .filter((result) => typeof result?.title === "string" && typeof result?.url === "string")
    .slice(0, 5)
    .map(({ title, url: resultUrl, description }) => ({
      title: title.trim(),
      url: resultUrl.trim(),
      snippet: typeof description === "string" ? description.trim() : "",
    }))
    .filter(({ url: resultUrl }) => /^https?:\/\//i.test(resultUrl));
  return { attempted: true, results };
}
