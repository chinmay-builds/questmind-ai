const NEON_AUTH_BACKEND =
  process.env.VITE_NEON_AUTH_URL ||
  process.env.NEON_AUTH_URL ||
  "https://ep-lucky-wave-zauejsfo.neonauth.c-2.eu-west-2.aws.neon.tech/neondb/auth";

export default async function handler(req, res) {
  try {
    const rawUrl = new URL(req.url || "/", `http://${req.headers?.host || "localhost"}`);
    const subpath = rawUrl.pathname.replace(/^\/api\/auth/, "");
    const targetUrl = `${NEON_AUTH_BACKEND}${subpath}${rawUrl.search}`;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers || {})) {
      if (!["host", "connection", "content-length"].includes(key.toLowerCase())) {
        headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      }
    }
    const targetHost = new URL(NEON_AUTH_BACKEND).host;
    headers.set("Host", targetHost);
    headers.set("Origin", req.headers?.origin || `https://${req.headers?.host}`);

    const reqInit = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      reqInit.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const upstream = await fetch(targetUrl, reqInit);
    if (res.status) res.status(upstream.status);

    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        const cleaned = value.replace(/Domain=[^;]+;\s*/gi, "").replace(/SameSite=None;\s*Secure/gi, "SameSite=Lax");
        if (res.setHeader) res.setHeader("Set-Cookie", cleaned);
      } else {
        if (res.setHeader) res.setHeader(key, value);
      }
    });

    const data = await upstream.arrayBuffer();
    if (res.end) res.end(Buffer.from(data));
  } catch (err) {
    console.error("Neon Auth proxy error:", err);
    if (res.status) {
      res.status(200).json({ success: false, fallback: true, error: err.message || "Auth proxy unavailable" });
    }
  }
}
