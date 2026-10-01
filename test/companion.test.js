import test from "node:test";
import assert from "node:assert/strict";
import { answerQuestion } from "../src/companion.js";
import { askQuestMind } from "../src/core/api.js";
import { createProvider } from "../src/core/providers/index.js";
import { providerNameFromEnv } from "../src/core/config.js";
import { modelConfigFromEnv, resolveModelAlias } from "../src/core/config.js";
import { getGame, getPlayerOptions } from "../src/games.js";
import { getRuleContext } from "../src/rules.js";
import { createOpenRouterProvider } from "../src/core/providers/openrouter.js";
import { InvalidQuestRequestError, ProviderConfigurationError, ProviderRequestError, UnsupportedProviderError } from "../src/core/errors.js";
import askHandler from "../api/ask.js";
import modelsHandler from "../api/models.js";
import configHandler from "../api/config.js";
import { normalizeAssistantResponse } from "../src/core/contracts.js";
import { fallbackResponse } from "../src/core/fallback.js";

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
      mode: "Normal",
      playerCount: 2,
      question: "What should I do next?",
      attachments: [{ name: "board.png", type: "image/png" }, { name: "card.jpg", type: "image/jpeg" }],
    }, { provider: "mock" }).text,
    /Scythe[\s\S]*2 players[\s\S]*2 attached images/,
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

test("enforces game and mode-specific player bounds", () => {
  const scythe = getGame("Scythe");
  assert.deepEqual(getPlayerOptions(scythe, "Normal"), [2, 3, 4, 5]);
  assert.deepEqual(getPlayerOptions(scythe, "Automa"), [1]);

  const wingspan = getGame("Wingspan");
  assert.deepEqual(getPlayerOptions(wingspan, "Base Game"), [2, 3, 4, 5]);
  assert.deepEqual(getPlayerOptions(wingspan, "Solo / Automa"), [1]);

  const root = getGame("Root");
  assert.deepEqual(getPlayerOptions(root, "Competitive"), [2, 3, 4]);
  assert.deepEqual(getPlayerOptions(root, "Solo / Clockwork"), [1]);
  assert.deepEqual(getPlayerOptions(root, "Two-player"), [2]);

  const gloomhaven = getGame("Gloomhaven");
  assert.deepEqual(getPlayerOptions(gloomhaven, "Campaign"), [2, 3, 4]);
  assert.deepEqual(getPlayerOptions(gloomhaven, "Solo scenario"), [1]);

  const tfm = getGame("Terraforming Mars");
  assert.deepEqual(getPlayerOptions(tfm, "Standard"), [2, 3, 4, 5]);
  assert.deepEqual(getPlayerOptions(tfm, "Solo challenge"), [1]);

  assert.throws(() => askQuestMind({ game: "Catan", mode: "Standard", playerCount: 2, question: "Help" }, { provider: "mock" }), InvalidQuestRequestError);
});

test("includes honest rule context in provider requests and evidence", async () => {
  assert.match(getRuleContext("Catan", "Standard").summary, /trading and building/i);
  const provider = createOpenRouterProvider({
    apiKey: "secret",
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      assert.match(body.messages[1].content, /trading and building/i);
      return new Response(JSON.stringify({ choices: [{ message: { content: "ANSWER: Build a settlement on an intersection.\nEVIDENCE: Catan Official Rulebook." } }] }), { status: 200 });
    },
  });
  const result = await provider.answer({ game: "Catan", mode: "Standard", playerCount: 4, question: "How do I build a settlement?" });
  assert.equal(result.evidence, "Catan Official Rulebook.");
  assert.equal(result.text, "Build a settlement on an intersection.");
});

test("responds warmly to greetings and small talk in mock and fallback", () => {
  const greetingMock = askQuestMind({ game: "Catan", mode: "Standard", playerCount: 4, question: "Hello!" }, { provider: "mock" });
  assert.match(greetingMock.text, /Hello! I'm QuestMind/i);
  assert.match(greetingMock.evidence, /QuestMind Table-Side Companion/i);

  const wassupMock = askQuestMind({ game: "Catan", mode: "Standard", playerCount: 4, question: "Wassup" }, { provider: "mock" });
  assert.match(wassupMock.text, /Hello! I'm QuestMind/i);
  assert.match(wassupMock.evidence, /QuestMind Table-Side Companion/i);

  const greetingFallback = fallbackResponse({ game: "Scythe", mode: "Normal", playerCount: 3, question: "hi" });
  assert.match(greetingFallback.text, /Hello! I'm QuestMind/i);
  assert.match(greetingFallback.evidence, /QuestMind Table-Side Companion/i);

  const wassupFallback = fallbackResponse({ game: "Catan", mode: "Standard", playerCount: 4, question: "Wassup" });
  assert.match(wassupFallback.text, /Hello! I'm QuestMind/i);
  assert.match(wassupFallback.evidence, /QuestMind Table-Side Companion/i);
});

test("politely declines off-topic non-board game questions", () => {
  const offTopicMock = askQuestMind({ game: "Catan", mode: "Standard", playerCount: 4, question: "Write python code to predict weather" }, { provider: "mock" });
  assert.match(offTopicMock.text, /dedicated board-game companion/i);
  assert.match(offTopicMock.evidence, /Tabletop scope policy/i);

  const offTopicFallback = fallbackResponse({ game: "Catan", mode: "Standard", playerCount: 4, question: "What is the stock market doing?" });
  assert.match(offTopicFallback.text, /dedicated board-game companion/i);
  assert.match(offTopicFallback.evidence, /Tabletop scope policy/i);
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
    playerCount: 1,
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

test("API handler returns explicit config errors when openrouter provider is requested without a key", async () => {
  const original = process.env.QUESTMIND_PROVIDER;
  const originalKey = process.env.OPENROUTER_API_KEY;
  process.env.QUESTMIND_PROVIDER = "openrouter";
  delete process.env.OPENROUTER_API_KEY;
  const response = createTestResponse();
  await askHandler({
    method: "POST",
    headers: { "content-length": "80" },
    body: { game: "Catan", mode: "Standard", playerCount: 4, question: "Help" },
  }, response);
  if (original === undefined) delete process.env.QUESTMIND_PROVIDER;
  else process.env.QUESTMIND_PROVIDER = original;
  if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY = originalKey;
  assert.equal(response.statusCode, 503);
  assert.equal(JSON.parse(response.body).error.code, "PROVIDER_CONFIGURATION_ERROR");
});

test("API handler seamlessly answers using local rules when no external provider is configured", async () => {
  const original = process.env.QUESTMIND_PROVIDER;
  const originalKey = process.env.OPENROUTER_API_KEY;
  delete process.env.QUESTMIND_PROVIDER;
  delete process.env.OPENROUTER_API_KEY;
  const response = createTestResponse();
  await askHandler({
    method: "POST",
    headers: { "content-length": "80" },
    body: { game: "Catan", mode: "Standard", playerCount: 4, question: "How do I build a road?" },
  }, response);
  if (original) process.env.QUESTMIND_PROVIDER = original;
  if (originalKey) process.env.OPENROUTER_API_KEY = originalKey;
  assert.equal(response.statusCode, 200);
  const data = JSON.parse(response.body);
  assert.match(data.text, /Catan|Road/i);
  assert.equal(data.provider, "mock");
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

test("provider failures produce a safe retry fallback", async () => {
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
  assert.equal(response.statusCode, 503);
  assert.equal(payload.fallback.provider, "fallback");
  assert.match(payload.fallback.text, /Catan|turn structure|victory points/i);
});

test("resolves default openrouter model when OPENROUTER_API_KEY is provided", () => {
  const env = { OPENROUTER_API_KEY: "test-key" };
  assert.equal(resolveModelAlias("rules-sage", env).model, "openrouter/free");
  assert.equal(resolveModelAlias("rules-sage", env).provider, "openrouter");
  assert.equal(resolveModelAlias("strategy-coach", env).model, "openrouter/free");
  assert.equal(resolveModelAlias("tabletop-tactician", env).model, "openrouter/free");
  assert.equal(resolveModelAlias("lorekeeper", env).model, "openrouter/free");
  const roster = modelConfigFromEnv(env);
  assert.equal(roster.every((m) => m.configured), true);
});

test("respects global OPENROUTER_MODEL and QUESTMIND_MODEL overrides", () => {
  const env = { OPENROUTER_API_KEY: "test-key", OPENROUTER_MODEL: "google/gemini-2.0-flash-exp:free" };
  assert.equal(resolveModelAlias("rules-sage", env).model, "google/gemini-2.0-flash-exp:free");
  assert.equal(resolveModelAlias("lorekeeper", env).model, "google/gemini-2.0-flash-exp:free");

  const specificEnv = {
    OPENROUTER_API_KEY: "test-key",
    OPENROUTER_MODEL: "google/gemini-2.0-flash-exp:free",
    QUESTMIND_MODEL_LOREKEEPER: "custom/lore-model",
  };
  assert.equal(resolveModelAlias("rules-sage", specificEnv).model, "google/gemini-2.0-flash-exp:free");
  assert.equal(resolveModelAlias("lorekeeper", specificEnv).model, "custom/lore-model");
});

test("config handler returns configured models and provider status", async () => {
  const response = createTestResponse();
  const originalKey = process.env.OPENROUTER_API_KEY;
  const originalModel = process.env.OPENROUTER_MODEL;
  process.env.OPENROUTER_API_KEY = "test-key";
  process.env.OPENROUTER_MODEL = "custom/test-model";

  await configHandler({ method: "GET" }, response);

  if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY = originalKey;
  if (originalModel === undefined) delete process.env.OPENROUTER_MODEL;
  else process.env.OPENROUTER_MODEL = originalModel;

  assert.equal(response.statusCode, 200);
  const data = JSON.parse(response.body);
  assert.equal(data.configured, true);
  assert.ok(data.models.includes("custom/test-model"));
});

test("OpenRouter provider resolves model aliases to valid provider model IDs", async () => {
  let capturedBody;
  const provider = createOpenRouterProvider({
    apiKey: "secret-key",
    env: { OPENROUTER_API_KEY: "secret-key", OPENROUTER_MODEL_RULES_SAGE: "google/gemini-2.0-flash-exp:free" },
    fetchImpl: async (_url, options) => {
      capturedBody = JSON.parse(options.body);
      return new Response(JSON.stringify({
        choices: [{ message: { content: "ANSWER: In Automa mode, draw cards.\nEVIDENCE: Scythe Official Rulebook." } }],
      }), { status: 200 });
    },
  });
  const result = await provider.answer({
    game: "Scythe",
    mode: "Automa",
    playerCount: 1,
    model: "rules-sage",
    question: "I basically just need help overall with automa mode",
  });
  assert.equal(capturedBody.model, "google/gemini-2.0-flash-exp:free");
  assert.notEqual(capturedBody.model, "rules-sage");
  assert.match(result.text, /Automa mode/);
});

test("fallbackResponse provides grounded rules answers for catalog games", () => {
  const buildFallback = fallbackResponse({ game: "Catan", mode: "Standard", playerCount: 4, question: "How do I build a road?" });
  assert.match(buildFallback.text, /Roads cost 1 Brick/i);
  assert.match(buildFallback.evidence, /Catan Official Rules · Building & Placement/i);

  const winFallback = fallbackResponse({ game: "Scythe", mode: "Normal", playerCount: 3, question: "How do I win?" });
  assert.match(winFallback.text, /6th star/i);
  assert.match(winFallback.evidence, /Scythe Official Rules · Victory & Scoring/i);
});

test("signUpWithEmail validates inputs and blocks duplicate account registration", async () => {
  const { signUpWithEmail } = await import("../src/auth.js");
  const invalidEmail = await signUpWithEmail("Alex", "invalid-email", "pass123");
  assert.equal(invalidEmail.success, false);
  assert.match(invalidEmail.error, /valid email/i);

  const shortPass = await signUpWithEmail("Alex", "player@tabletop.dev", "123");
  assert.equal(shortPass.success, false);
  assert.match(shortPass.error, /6 characters/i);
});

test("signInWithEmail validates required credentials", async () => {
  const { signInWithEmail } = await import("../src/auth.js");
  const noPass = await signInWithEmail("player@tabletop.dev", "");
  assert.equal(noPass.success, false);
  assert.match(noPass.error, /password/i);

  const noEmail = await signInWithEmail("", "pass123");
  assert.equal(noEmail.success, false);
  assert.match(noEmail.error, /email/i);
});

test("sessionsHandler handles offline mode gracefully without crashing", async () => {
  const sessionsHandler = (await import("../api/sessions.js")).default;
  const res = createTestResponse();
  await sessionsHandler({ method: "GET", url: "/api/sessions?userId=test" }, res);
  assert.equal(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.equal(data.success, true);
});

test("getPersonalizedNews returns tabletop news articles prioritized by chat history", async () => {
  const { getPersonalizedNews, boardGameNews } = await import("../src/news.js");
  assert.ok(boardGameNews.length >= 10);
  assert.ok(boardGameNews.every((item) => item.title && item.publisher && item.sourceDomain && item.sourceUrl));

  // Personalized test: discuss Wingspan in chat
  const history = [
    { kind: "user", text: "How do brown powers work in Wingspan?" },
    { kind: "assistant", text: "In Wingspan, brown powers activate from right to left." },
  ];
  const personalized = getPersonalizedNews(history, "Wingspan");
  assert.equal(personalized[0].game, "Wingspan");
  assert.match(personalized[0].publisher, /Stonemaier/i);
  assert.equal(personalized[0].sourceDomain, "stonemaiergames.com");
});

test("getNewsPage supports deep paging across 10,000,000+ cards with search and filters", async () => {
  const { getNewsPage, TOTAL_AVAILABLE_NEWS } = await import("../src/news.js");
  assert.equal(TOTAL_AVAILABLE_NEWS, 10_000_000);

  // Test page 1
  const page1 = getNewsPage({ page: 1, pageSize: 18 });
  assert.equal(page1.items.length, 18);
  assert.equal(page1.totalCount, 10_000_000);
  assert.ok(page1.items.every((c) => c.publisherLogo && c.sourceDomain && c.imageUrl && c.title));

  // Test deep page 42,000 (millions of cards)
  const deepPage = getNewsPage({ page: 42000, pageSize: 18 });
  assert.equal(deepPage.items.length, 18);
  assert.equal(deepPage.page, 42000);
  assert.ok(deepPage.items[0].title.length > 5);

  // Test search filtering across procedural feed
  const searchResult = getNewsPage({ page: 1, pageSize: 10, searchQuery: "tournament" });
  assert.ok(searchResult.items.length > 0);
  assert.ok(searchResult.items.every((c) => /tournament|championship|invitational/i.test(`${c.title} ${c.summary} ${c.tag}`)));

  // Test category filtering
  const expansionResult = getNewsPage({ page: 1, pageSize: 10, filter: "expansion" });
  assert.ok(expansionResult.items.length > 0);
  assert.ok(expansionResult.items.every((c) => c.category === "expansion"));
});

test("news cards resolve to specific game URL on publisher site (e.g. Euphoria on Stonemaier Games)", async () => {
  const { generateNewsCard, gamesCatalog } = await import("../src/news.js");
  const euphoriaGame = gamesCatalog.find((g) => g.name === "Euphoria");
  assert.ok(euphoriaGame);

  const card = generateNewsCard(0, "", [], euphoriaGame);
  assert.equal(card.game, "Euphoria");
  assert.equal(card.publisher, "Stonemaier Games");
  assert.equal(card.sourceDomain, "stonemaiergames.com");
  assert.equal(card.sourceUrl, "https://stonemaiergames.com/games/euphoria/");
  assert.ok(card.articleBody.includes("stonemaiergames.com"));

  const scytheGame = gamesCatalog.find((g) => g.name === "Scythe");
  const scytheCard = generateNewsCard(1, "", [], scytheGame);
  assert.equal(scytheCard.sourceUrl, "https://stonemaiergames.com/games/scythe/");

  const ttrGame = gamesCatalog.find((g) => g.name === "Ticket to Ride");
  const ttrCard = generateNewsCard(2, "", [], ttrGame);
  assert.equal(ttrCard.sourceUrl, "https://www.daysofwonder.com/tickettoride/");
});

function createTestResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; return this; },
    end(body = "") { this.body = body; },
    json(payload) {
      this.setHeader("Content-Type", "application/json");
      this.body = JSON.stringify(payload);
    },
  };
}
