import test from "node:test";
import assert from "node:assert/strict";
import { answerQuestion } from "../src/companion.js";
import { askQuestMind } from "../src/core/api.js";
import { createProvider } from "../src/core/providers/index.js";
import { providerNameFromEnv } from "../src/core/config.js";
import { modelConfigFromEnv, resolveModelAlias } from "../src/core/config.js";
import { getPlayerOptions } from "../src/games.js";
import { getRuleContext } from "../src/rules.js";
import { searchRuleSources } from "../src/core/search.js";
import { createOpenRouterProvider } from "../src/core/providers/openrouter.js";
import { InvalidQuestRequestError, ProviderConfigurationError, ProviderRequestError, UnsupportedProviderError } from "../src/core/errors.js";
import askHandler from "../api/ask.js";
import modelsHandler from "../api/models.js";
import { normalizeAssistantResponse } from "../src/core/contracts.js";

test("returns an explicitly marked placeholder answer", () => {
  const response = answerQuestion("Can I draw two cards?");

  assert.match(response, /^\[PLACEHOLDER\]/);
  assert.match(response, /Can I draw two cards\?/);
});

test("trims whitespace around a question", () => {
  assert.equal(
    answerQuestion("  How does scoring work?  "),
    '[PLACEHOLDER] QuestMind will answer this game question once a rules engine or AI provider is connected: "How does scoring work?"',
  );
});

test("rejects an empty question", () => {
  assert.throws(() => answerQuestion("   "), {
    name: "TypeError",
    message: "A non-empty game or rules question is required.",
  });
});

test("includes the selected context and attachment count in the UI response", () => {
  assert.match(
    askQuestMind({
      game: "Scythe",
      mode: "Automa",
      playerCount: 2,
      question: "What should I do next?",
      attachments: [{ name: "board.png", type: "image/png" }, { name: "card.jpg", type: "image/jpeg" }],
    }, { provider: "mock" }).text,
    /Scythe · Automa · 2 players[\s\S]*2 attached images/,
  );
});

test("rejects malformed core requests", () => {
  assert.throws(() => askQuestMind({ game: "Catan", mode: "Standard", playerCount: 0, question: "Help" }, { provider: "mock" }), InvalidQuestRequestError);
  assert.throws(() => askQuestMind({ game: "Catan", mode: "Standard", playerCount: 4, question: "" }, { provider: "mock" }), InvalidQuestRequestError);
});

test("requires an explicit supported provider", () => {
  assert.throws(() => createProvider("hosted-ai"), UnsupportedProviderError);
  assert.equal(createProvider("mock").name, "mock");
  assert.equal(createProvider("mock", { modelAlias: "rules-sage", env: {} }).name, "mock");
  assert.equal(providerNameFromEnv({ QUESTMIND_PROVIDER: "mock" }), "mock");
  assert.equal(providerNameFromEnv({}), "mock");
  assert.equal(providerNameFromEnv({ OPENROUTER_API_KEY: "key" }), "openrouter");
  assert.throws(() => createProvider("openrouter", { env: {} }), ProviderConfigurationError);
  assert.throws(() => providerNameFromEnv({ QUESTMIND_PROVIDER: "openrouter" }), ProviderConfigurationError);
});

test("resolves safe model aliases without exposing secrets", () => {
  const env = {
    QUESTMIND_PROVIDER: "openrouter",
    QUESTMIND_MODEL_RULES_SAGE: "provider/rules-model",
    QUESTMIND_PROVIDER_RULES_SAGE: "openrouter",
  };
  assert.equal(resolveModelAlias("rules-sage", env).model, "provider/rules-model");
  assert.equal(resolveModelAlias("rules-sage", env).provider, "openrouter");
  assert.equal(modelConfigFromEnv(env).find((model) => model.alias === "rules-sage").configured, true);
  assert.equal(modelConfigFromEnv(env).find((model) => model.alias === "lorekeeper").configured, false);
  assert.throws(() => resolveModelAlias("lorekeeper", env), ProviderConfigurationError);
});

test("shared model configuration enables every alias without exposing the model id", () => {
  const roster = modelConfigFromEnv({
    QUESTMIND_PROVIDER: "openrouter",
    OPENROUTER_API_KEY: "secret",
    OPENROUTER_MODEL: "openrouter/free",
  });
  assert.deepEqual(roster.map((model) => model.configured), [true, true, true, true]);
  assert.equal(roster[0].model, undefined);
  assert.equal(resolveModelAlias("lorekeeper", {
    OPENROUTER_API_KEY: "secret",
    OPENROUTER_MODEL: "openrouter/free",
  }).model, "openrouter/free");
});

test("enforces game and mode-specific player bounds", () => {
  assert.deepEqual(getPlayerOptions({ playerOptions: [1, 2, 3, 4] }, "Solo / Clockwork"), [1]);
  assert.deepEqual(getPlayerOptions({ playerOptions: [2, 3, 4] }, "Two-player"), [2]);
  assert.throws(() => askQuestMind({ game: "Catan", mode: "Standard", playerCount: 2, question: "Help" }, { provider: "mock" }), InvalidQuestRequestError);
});

test("includes honest rule context in provider requests and evidence", async () => {
  assert.match(getRuleContext("Catan", "Standard").summary, /No verified rule excerpt/);
  const provider = createOpenRouterProvider({
    apiKey: "secret",
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      assert.match(body.messages[1].content, /No verified rule excerpt/);
      return new Response(JSON.stringify({ choices: [{ message: { content: "ANSWER: I cannot verify this.\nEVIDENCE: Rulebook context not provided." } }] }), { status: 200 });
    },
  });
  const result = await provider.answer({ game: "Catan", mode: "Standard", playerCount: 4, question: "Help" });
  assert.equal(result.evidence, "Rulebook context not provided.");
});

test("uses official provenance for the narrow Scythe Automa starter context", async () => {
  const context = getRuleContext("Scythe", "Automa");
  assert.match(context.summary, /official solo opponent/);
  assert.equal(context.source.url, "https://stonemaiergames.com/games/scythe/scythe-rules/");
  const provider = createOpenRouterProvider({
    apiKey: "secret",
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      assert.match(body.messages[1].content, /stonemaiergames\.com\/games\/scythe\/scythe-rules/);
      return new Response(JSON.stringify({ choices: [{ message: { content: "ANSWER: I need the Automa card or rulebook page to verify this.\nEVIDENCE: Stonemaier Games, Scythe Rules." } }] }), { status: 200 });
    },
  });
  const result = await provider.answer({ game: "Scythe", mode: "Automa", playerCount: 2, question: "What does this Automa card do?" });
  assert.match(result.evidence, /Stonemaier Games/);
});

test("normalizes an OpenRouter response and sends context without exposing browser code", async () => {
  let request;
  const provider = createOpenRouterProvider({
    apiKey: "secret",
    model: "openrouter/free",
    siteUrl: "https://questmind.example",
    appName: "QuestMind",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify({ choices: [{ message: { content: "ANSWER: Build the market before ending the round.\nEVIDENCE: Supplied board image." } }] }), { status: 200 });
    },
  });
  const result = await provider.answer({
    game: "Scythe",
    mode: "Automa",
    playerCount: 2,
    question: "What should I do?",
    attachments: [{ name: "board.png", type: "image/png" }],
  });
  assert.equal(result.text, "Build the market before ending the round.");
  assert.equal(result.evidence, "Supplied board image.");
  assert.equal(result.provider, "openrouter");
  assert.equal(request.options.headers.Authorization, "Bearer secret");
  assert.equal(request.options.headers["HTTP-Referer"], "https://questmind.example");
  assert.equal(JSON.parse(request.options.body).model, "openrouter/free");
});

test("accepts OpenRouter structured text content parts", async () => {
  const provider = createOpenRouterProvider({
    apiKey: "secret",
    fetchImpl: async () => new Response(JSON.stringify({
      choices: [{ message: { content: [
        { type: "text", text: "ANSWER: Resolve the conflict first." },
        { type: "output_text", text: "EVIDENCE: Supplied board image." },
      ] } }],
    }), { status: 200 }),
  });
  const result = await provider.answer({ game: "Root", mode: "Competitive", playerCount: 3, question: "What matters now?" });
  assert.equal(result.text, "Resolve the conflict first.");
  assert.equal(result.evidence, "Supplied board image.");
});

test("normalizes grounded answer format without allowing HTML or invented sources", () => {
  assert.deepEqual(normalizeAssistantResponse("ANSWER: Check the rule.\nEVIDENCE: Rulebook, page 4."), {
    answer: "Check the rule.",
    evidence: "Rulebook, page 4.",
  });
  assert.equal(normalizeAssistantResponse("<b>Check the rule.</b>").answer, "Check the rule.");
  assert.match(normalizeAssistantResponse("I cannot verify this from the supplied context.").evidence, /Not provided/);
});

test("normalizes OpenRouter HTTP and payload failures", async () => {
  const provider = createOpenRouterProvider({
    apiKey: "secret",
    fetchImpl: async () => new Response(JSON.stringify({ error: { message: "Rate limited" } }), { status: 429 }),
  });
  await assert.rejects(() => provider.answer({ game: "Catan", mode: "Standard", playerCount: 4, question: "Help" }), (error) => error instanceof ProviderRequestError && error.code === "PROVIDER_HTTP_ERROR" && /Rate limited/.test(error.message));
  const invalid = createOpenRouterProvider({
    apiKey: "secret",
    fetchImpl: async () => new Response(JSON.stringify({ choices: [] }), { status: 200 }),
  });
  await assert.rejects(() => invalid.answer({ game: "Catan", mode: "Standard", playerCount: 4, question: "Help" }), (error) => error.code === "PROVIDER_INVALID_RESPONSE");
  const invalidJson = createOpenRouterProvider({
    apiKey: "secret",
    fetchImpl: async () => new Response("not json", { status: 200 }),
  });
  await assert.rejects(() => invalidJson.answer({ game: "Catan", mode: "Standard", playerCount: 4, question: "Help" }), (error) => error.code === "PROVIDER_INVALID_JSON" && /non-JSON response/.test(error.message));
  const apiError = createOpenRouterProvider({
    apiKey: "secret",
    fetchImpl: async () => new Response(JSON.stringify({ error: { message: "Upstream unavailable" } }), { status: 200 }),
  });
  await assert.rejects(() => apiError.answer({ game: "Catan", mode: "Standard", playerCount: 4, question: "Help" }), (error) => error.code === "PROVIDER_API_ERROR" && /Upstream unavailable/.test(error.message));
});

test("aborts a slow OpenRouter request", async () => {
  const provider = createOpenRouterProvider({
    apiKey: "secret",
    timeoutMs: 100,
    fetchImpl: (_url, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      });
    }),
  });
  await assert.rejects(() => provider.answer({ game: "Root", mode: "Solo / Clockwork", playerCount: 1, question: "Help" }), (error) => error.code === "PROVIDER_TIMEOUT");
});

test("API handler returns explicit config errors without an OpenRouter key", async () => {
  const original = process.env.QUESTMIND_PROVIDER;
  delete process.env.QUESTMIND_PROVIDER;
  const response = createTestResponse();
  await askHandler({
    method: "POST",
    headers: { "content-length": "80" },
    body: { game: "Catan", mode: "Standard", playerCount: 4, question: "Help" },
  }, response);
  if (original) process.env.QUESTMIND_PROVIDER = original;
  assert.equal(response.statusCode, 503);
  assert.equal(JSON.parse(response.body).error.code, "PROVIDER_CONFIGURATION_ERROR");
});

test("API handler rejects non-POST requests", async () => {
  const response = createTestResponse();
  await askHandler({ method: "GET", headers: {} }, response);
  assert.equal(response.statusCode, 405);
});

test("model roster is safe and marks missing server aliases unavailable", async () => {
  const original = process.env.QUESTMIND_MODEL_RULES_SAGE;
  process.env.QUESTMIND_MODEL_RULES_SAGE = "provider/rules";
  const response = createTestResponse();
  await modelsHandler({ method: "GET" }, response);
  if (original === undefined) delete process.env.QUESTMIND_MODEL_RULES_SAGE;
  else process.env.QUESTMIND_MODEL_RULES_SAGE = original;
  const roster = JSON.parse(response.body).models;
  assert.equal(roster.find((model) => model.alias === "rules-sage").configured, true);
  assert.equal(roster.find((model) => model.alias === "rules-sage").model, undefined);
});

test("local mock mode answers without server model configuration", async () => {
  const originalProvider = process.env.QUESTMIND_PROVIDER;
  const originalKey = process.env.OPENROUTER_API_KEY;
  const originalModel = process.env.QUESTMIND_MODEL_RULES_SAGE;
  process.env.QUESTMIND_PROVIDER = "mock";
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.QUESTMIND_MODEL_RULES_SAGE;
  const response = createTestResponse();
  await askHandler({
    method: "POST",
    headers: { "content-length": "100" },
    body: { game: "Catan", mode: "Standard", playerCount: 4, model: "rules-sage", question: "Help" },
  }, response);
  for (const [key, value] of [["QUESTMIND_PROVIDER", originalProvider], ["OPENROUTER_API_KEY", originalKey], ["QUESTMIND_MODEL_RULES_SAGE", originalModel]]) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  const payload = JSON.parse(response.body);
  assert.equal(response.statusCode, 200);
  assert.equal(payload.provider, "mock");
  assert.match(payload.text, /cannot verify/i);
});

test("searches only through the server-side source adapter and normalizes results", async () => {
  let requestedUrl;
  const result = await searchRuleSources("Scythe Automa official rules", {
    apiKey: "search-secret",
    fetchImpl: async (url, options) => {
      requestedUrl = String(url);
      assert.equal(options.headers["X-Subscription-Token"], "search-secret");
      return new Response(JSON.stringify({
        web: { results: [
          { title: "Official rules", url: "https://example.com/rules", description: "Verified excerpt." },
          { title: "Ignored", url: "javascript:alert(1)", description: "Unsafe." },
        ] },
      }), { status: 200 });
    },
  });
  assert.match(requestedUrl, /q=Scythe\+Automa\+official\+rules/);
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].url, "https://example.com/rules");
});

test("does not claim a web search when search is unconfigured", async () => {
  assert.deepEqual(await searchRuleSources("Catan rules", { env: {} }), { attempted: false, results: [] });
});

function createTestResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; return this; },
    end(body = "") { this.body = body; },
  };
}
