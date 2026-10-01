export const NEON_AUTH_URL =
  (typeof process !== "undefined" && (process.env?.VITE_NEON_AUTH_URL || process.env?.NEON_AUTH_URL)) ||
  "https://ep-lucky-wave-zauejsfo.neonauth.c-2.eu-west-2.aws.neon.tech/neondb/auth";

const STORAGE_TOKEN_KEY = "questmind_neon_auth_token_v1";
const STORAGE_USER_KEY = "questmind_neon_auth_user_v1";

export function getStoredToken() {
  try {
    return localStorage.getItem(STORAGE_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(token, user) {
  try {
    if (token) localStorage.setItem(STORAGE_TOKEN_KEY, token);
    else localStorage.removeItem(STORAGE_TOKEN_KEY);

    if (user) localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_USER_KEY);
  } catch {}
}

export function handleOAuthCallback() {
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(window.location.href);
    const token =
      url.searchParams.get("token") ||
      url.searchParams.get("session_token") ||
      url.searchParams.get("neon_token") ||
      url.searchParams.get("access_token");

    if (token) {
      localStorage.setItem(STORAGE_TOKEN_KEY, token);
      url.searchParams.delete("token");
      url.searchParams.delete("session_token");
      url.searchParams.delete("neon_token");
      url.searchParams.delete("access_token");
      window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ""));
      return token;
    }
  } catch {}
  return null;
}

// Auto-check OAuth callback on load
handleOAuthCallback();

export async function signInWithGoogle() {
  try {
    const callbackURL = typeof window !== "undefined" ? window.location.origin : "https://questmind.vercel.app";
    const res = await fetch(`${NEON_AUTH_URL}/sign-in/social`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "google", callbackURL }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) {
      if (typeof window !== "undefined") {
        window.location.href = data.url;
      }
      return { success: true, url: data.url };
    }
    return { success: false, error: data.error || data.message || `Google sign-in failed (${res.status}).` };
  } catch (err) {
    return { success: false, error: err.message || "Network error during Google sign-in." };
  }
}

export async function signUpWithEmail(name, email, password) {
  const cleanName = (name || "").trim() || "Player";
  const cleanEmail = (email || "").trim().toLowerCase();
  const pass = (password || "").trim();

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (!pass || pass.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  try {
    const res = await fetch(`${NEON_AUTH_URL}/sign-up/email`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: cleanName,
        email: cleanEmail,
        password: pass,
      }),
    });
    const data = await res.json().catch(() => ({}));
    const token = data.token || data.session?.token;

    if (res.ok && data.user && token) {
      saveSession(token, data.user);
      return { success: true, user: data.user, token };
    }

    // Check for existing account conflict
    const errMsg = (data.error || data.message || "").toLowerCase();
    if (res.status === 409 || errMsg.includes("already exists") || errMsg.includes("duplicate") || errMsg.includes("user_exists")) {
      return {
        success: false,
        error: "An account with this email already exists. Please sign in instead.",
        code: "ACCOUNT_EXISTS",
      };
    }

    return { success: false, error: data.error || data.message || "Failed to create account." };
  } catch (err) {
    return { success: false, error: err.message || "Failed to connect to Neon Auth." };
  }
}

export async function signInWithEmail(email, password) {
  const cleanEmail = (email || "").trim().toLowerCase();
  const pass = (password || "").trim();

  if (!cleanEmail) {
    return { success: false, error: "Please enter your email address." };
  }
  if (!pass) {
    return { success: false, error: "Please enter your password." };
  }

  try {
    const res = await fetch(`${NEON_AUTH_URL}/sign-in/email`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: cleanEmail,
        password: pass,
      }),
    });
    const data = await res.json().catch(() => ({}));
    const token = data.token || data.session?.token;

    if (res.ok && data.user && token) {
      saveSession(token, data.user);
      return { success: true, user: data.user, token };
    }

    const errMsg = (data.error || data.message || "").toLowerCase();
    if (res.status === 404 || errMsg.includes("not found") || errMsg.includes("no user") || errMsg.includes("does not exist")) {
      return {
        success: false,
        error: "No account found with this email. Please create an account first.",
        code: "ACCOUNT_NOT_FOUND",
      };
    }

    return { success: false, error: data.error || data.message || "Invalid email or password." };
  } catch (err) {
    return { success: false, error: err.message || "Failed to connect to Neon Auth." };
  }
}

export async function signOut() {
  const token = getStoredToken();
  try {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    await fetch(`${NEON_AUTH_URL}/sign-out`, { method: "POST", credentials: "include", headers });
  } catch {}
  saveSession(null, null);
}

export async function fetchSession() {
  const token = getStoredToken();
  try {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${NEON_AUTH_URL}/get-session`, { credentials: "include", headers });
    if (res.ok) {
      const data = await res.json();
      if (data && data.user) {
        const sessionToken = data.session?.token || token;
        if (sessionToken) saveSession(sessionToken, data.user);
        return data.user;
      }
    }
  } catch {}
  return getStoredUser();
}
