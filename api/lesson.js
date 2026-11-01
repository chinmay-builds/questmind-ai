import { buildLesson } from "../src/core/lessons.js";
import { QuestMindError } from "../src/core/errors.js";

const MAX_BODY_BYTES = 64 * 1024;

function sendJson(response, status, body) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

export default async function handler(request, response) {
  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }
  if (request.method !== "POST") {
    sendJson(response, 405, { error: { code: "METHOD_NOT_ALLOWED", message: "Use POST /api/lesson." } });
    return;
  }
  const contentLength = Number(request.headers["content-length"] ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    sendJson(response, 413, { error: { code: "REQUEST_TOO_LARGE", message: "Lesson requests must be 64 KB or smaller." } });
    return;
  }

  try {
    const body = request.body ?? await readBody(request);
    sendJson(response, 200, buildLesson(body));
  } catch (error) {
    if (error instanceof QuestMindError) {
      sendJson(response, 400, { error: { code: error.code, message: error.message } });
      return;
    }
    console.error("QuestMind lesson API error", error);
    sendJson(response, 500, { error: { code: "INTERNAL_ERROR", message: "QuestMind could not build this lesson." } });
  }
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new QuestMindError("Lesson requests must be 64 KB or smaller.", "REQUEST_TOO_LARGE");
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new QuestMindError("Request body must be valid JSON.", "INVALID_REQUEST");
  }
}
