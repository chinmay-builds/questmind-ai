import test from "node:test";
import assert from "node:assert/strict";
import { answerQuestion } from "../src/companion.js";
import { askQuestMind } from "../src/core/api.js";
import { createProvider } from "../src/core/providers/index.js";
import { providerNameFromEnv } from "../src/core/config.js";
import { createOpenRouterProvider } from "../src/core/providers/openrouter.js";
import { InvalidQuestRequestError, ProviderConfigurationError, ProviderRequestError, UnsupportedProviderError } from "../src/core/errors.js";
import askHandler from "../api/ask.js";
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
  assert.equal(providerNameFromEnv({ QUESTMIND_PROVIDER: "mock" }), "mock");
  assert.equal(providerNameFromEnv({}), "mock");
  assert.equal(providerNameFromEnv({ OPENROUTER_API_KEY: "key" }), "openrouter");
  assert.throws(() => createProvider("openrouter", { env: {} }), ProviderConfigurationError);
  assert.throws(() => providerNameFromEnv({ QUESTMIND_PROVIDER: "openrouter" }), ProviderConfigurationError);
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
  await assert.rejects(() => invalidJson.answer({ game: "Catan", mode: "Standard", playerCount: 4, question: "Help" }), (error) => error.code === "PROVIDER_INVALID_JSON");
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
