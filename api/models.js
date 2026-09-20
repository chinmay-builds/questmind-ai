import { modelConfigFromEnv } from "../src/core/config.js";

export default function handler(request, response) {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "GET") {
    response.status(405).end(JSON.stringify({ error: { code: "METHOD_NOT_ALLOWED", message: "Use GET /api/models." } }));
    return;
  }
  response.status(200).end(JSON.stringify({
    models: modelConfigFromEnv(process.env).map(({ alias, label, description, provider, configured }) => ({
      alias, label, description, provider, configured,
    })),
  }));
}
