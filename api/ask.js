import { askQuestMind } from "../src/core/api.js";
import { QuestMindError } from "../src/core/errors.js";
import { fallbackResponse } from "../src/core/fallback.js";

const MAX_BODY_BYTES = 256 * 1024;

function sendJson(response, status, body) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

export default async function handler(request, response) {
  if (process.env.QUESTMIND_ALLOWED_ORIGIN) {
    response.setHeader("Access-Control-Allow-Origin", process.env.QUESTMIND_ALLOWED_ORIGIN);
  }
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }
  if (request.method !== "POST") {
    sendJson(response, 405, { error: { code: "METHOD_NOT_ALLOWED", message: "Use POST /api/ask." } });
    return;
  }
  const contentLength = Number(request.headers["content-length"] ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    sendJson(response, 413, { error: { code: "REQUEST_TOO_LARGE", message: "Request must be 256 KB or smaller." } });
    return;
  }
  let body;
  try {
    body = request.body ?? await readBody(request);
    if (!body || typeof body !== "object") {
      sendJson(response, 400, { error: { code: "INVALID_REQUEST", message: "A JSON request body is required." } });
      return;
    }
    const result = await askQuestMind(body, { provider: process.env.QUESTMIND_PROVIDER ?? "openrouter", env: process.env });
    sendJson(response, 200, result);
  } catch (error) {
    if (error instanceof QuestMindError) {
      const status = error.code === "PROVIDER_CONFIGURATION_ERROR" ? 503 : error.code === "INVALID_REQUEST" ? 400 : 502;
      sendJson(response, status, {
        error: { code: error.code, message: error.message },
        fallback: body && typeof body === "object" ? fallbackResponse(body, "The server configuration needs attention.") : undefined,
      });
      return;
    }
    console.error("QuestMind API error", error);
    sendJson(response, 500, { error: { code: "INTERNAL_ERROR", message: "QuestMind could not answer right now." } });
  }
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new QuestMindError("Request must be 256 KB or smaller.", "REQUEST_TOO_LARGE");
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new QuestMindError("Request body must be valid JSON.", "INVALID_REQUEST");
  }
}
