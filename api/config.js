const fallbackModels = ["openrouter/free"];

export default function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Use GET /api/config." });
    return;
  }
  const models = [
    process.env.QUESTMIND_MODEL,
    process.env.QUESTMIND_MODEL2,
    process.env.QUESTMIND_MODEL3,
  ]
    .filter((model) => typeof model === "string" && model.trim())
    .map((model) => model.trim());
  response.setHeader("Cache-Control", "no-store");
  response.status(200).json({
    models: [...new Set(models.length ? models : fallbackModels)],
    provider: process.env.QUESTMIND_PROVIDER ?? (process.env.OPENROUTER_API_KEY ? "openrouter" : "mock"),
    configured: Boolean(process.env.OPENROUTER_API_KEY),
    webSearch: true,
  });
}
