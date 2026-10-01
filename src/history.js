import { getStoredToken, getStoredUser } from "./auth.js";

const DEFAULT_API_URL = "/api/sessions";

export async function saveGameSession(sessionData) {
  const user = getStoredUser();
  const token = getStoredToken();
  const userId = user?.id || user?.email || "anonymous";

  try {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(DEFAULT_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        userId,
        game: sessionData.game || "Catan",
        mode: sessionData.mode || "Standard",
        playerCount: sessionData.playerCount || 4,
        companionAlias: sessionData.companionAlias || "rules-sage",
        history: sessionData.history || [],
        notes: sessionData.notes || "",
        pinnedRules: sessionData.pinnedRules || [],
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Failed to sync session to Neon:", err);
  }
  return null;
}

export async function loadUserSessions(userId) {
  const user = getStoredUser();
  const token = getStoredToken();
  const targetId = userId || user?.id || user?.email;
  if (!targetId || targetId === "anonymous") return [];

  try {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const url = `${DEFAULT_API_URL}?userId=${encodeURIComponent(targetId)}`;
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      return data.sessions || [];
    }
  } catch (err) {
    console.warn("Failed to load sessions from Neon:", err);
  }
  return [];
}
