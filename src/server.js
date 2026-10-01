import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import askHandler from "../api/ask.js";
import modelsHandler from "../api/models.js";
import configHandler from "../api/config.js";
import sessionsHandler from "../api/sessions.js";
import authHandler from "../api/auth.js";

try {
  process.loadEnvFile?.();
} catch {}

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
};

function wrapResponse(response) {
  if (!response.status) {
    response.status = function status(code) {
      this.statusCode = code;
      return this;
    };
  }
  if (!response.json) {
    response.json = function json(payload) {
      this.setHeader("Content-Type", "application/json; charset=utf-8");
      this.end(JSON.stringify(payload));
    };
  }
  return response;
}

const server = createServer(async (request, response) => {
  wrapResponse(response);
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const pathname = url.pathname;

  if (pathname === "/api/ask") {
    await askHandler(request, response);
    return;
  }
  if (pathname === "/api/models") {
    await modelsHandler(request, response);
    return;
  }
  if (pathname === "/api/config") {
    await configHandler(request, response);
    return;
  }
  if (pathname === "/api/sessions") {
    await sessionsHandler(request, response);
    return;
  }
  if (pathname.startsWith("/api/auth")) {
    await authHandler(request, response);
    return;
  }

  const requested = pathname === "/" ? "/index.html" : pathname;
  const file = normalize(join(root, requested));
  if (!file.startsWith(root)) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const content = await readFile(file);
    response.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" }).end(content);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

const port = Number(process.env.PORT ?? 4173);
server.listen(port, () => console.log(`QuestMind UI running at http://localhost:${port}`));
