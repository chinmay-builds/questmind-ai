import { createQuestMindCore } from "./index.js";

/**
 * Framework-neutral API boundary. A future Vercel function can call this
 * with parsed JSON without coupling the core to Node, Vercel, or a browser.
 */
export function askQuestMind(body, { provider } = {}) {
  return createQuestMindCore({ provider }).answer(body);
}
