let neon;
try {
  const neonModule = await import("@neondatabase/serverless");
  neon = neonModule.neon;
} catch {}

const DEFAULT_DATABASE_URL =
  "postgresql://neondb_owner:npg_vSWGTn1D4LjO@ep-lucky-wave-zauejsfo-pooler.c-2.eu-west-2.aws.neon.tech/neondb?sslmode=require";

function getSql() {
  if (!neon) return null;
  const connectionString = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
  return neon(connectionString);
}

export default async function handler(req, res) {
  if (res.setHeader) {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", req.headers?.origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST,PUT,DELETE");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization, X-User-Id"
    );
  }

  if (req.method === "OPTIONS") {
    if (res.status) res.status(200).end();
    return;
  }

  try {
    const sql = getSql();
    if (!sql) {
      if (res.status) {
        res.status(200).json({ success: true, sessions: [], notice: "Neon offline mode" });
      }
      return;
    }

    if (req.method === "GET") {
      const url = new URL(req.url || "/", `http://${req.headers?.host || "localhost"}`);
      const userId = url.searchParams.get("userId") || req.headers?.["x-user-id"] || "anonymous";

      const rows = await sql`
        SELECT * FROM public.questmind_sessions
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
        LIMIT 20;
      `;

      if (res.status) {
        res.status(200).json({ success: true, sessions: rows || [] });
      }
      return;
    }

    if (req.method === "POST" || req.method === "PUT") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      const userId = body.userId || req.headers?.["x-user-id"] || "anonymous";
      const game = body.game || "Catan";
      const mode = body.mode || "Standard";
      const playerCount = Number(body.playerCount) || 4;
      const companionAlias = body.companionAlias || "rules-sage";
      const history = body.history || [];
      const notes = body.notes || "";
      const pinnedRules = body.pinnedRules || [];

      const rows = await sql`
        INSERT INTO public.questmind_sessions (
          user_id, game, mode, player_count, companion_alias, history, notes, pinned_rules, created_at, updated_at
        ) VALUES (
          ${userId}, ${game}, ${mode}, ${playerCount}, ${companionAlias}, ${JSON.stringify(history)}, ${notes}, ${JSON.stringify(pinnedRules)}, NOW(), NOW()
        )
        RETURNING *;
      `;

      if (res.status) {
        res.status(200).json({ success: true, session: rows[0] });
      }
      return;
    }

    if (res.status) res.status(405).json({ error: { message: "Method not allowed" } });
  } catch (err) {
    console.error("Sessions API error:", err);
    if (res.status) {
      res.status(200).json({ success: false, error: err.message || "Database unavailable" });
    }
  }
}
