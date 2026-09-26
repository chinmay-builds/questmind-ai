const fallbackModels = ["openrouter/free"];

export default function handler(request, response) {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "GET") {
    response.status(405).end(JSON.stringify({ error: { code: "METHOD_NOT_ALLOWED", message: "Use GET /api/config." } }));
    return;
  }
  const models = [
    process.env.QUESTMIND_MODEL,
    process.env.QUESTMIND_MODEL2,
    process.env.QUESTMIND_MODEL3,
    process.env.OPENROUTER_MODEL,
  ]
    .filter((model) => typeof model === "string" && model.trim())
    .map((model) => model.trim());
  response.status(200).end(JSON.stringify({
    models: [...new Set(models.length ? models : fallbackModels)],
    provider: process.env.QUESTMIND_PROVIDER ?? (process.env.OPENROUTER_API_KEY ? "openrouter" : "mock"),
    configured: Boolean(process.env.OPENROUTER_API_KEY),
    webSearch: true,
  }));
}
