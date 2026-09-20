import { validateQuestRequest } from "./contracts.js";
import { createProvider } from "./providers/index.js";

/**
 * Create a small provider-agnostic QuestMind core.
 * The provider is intentionally explicit: callers must choose "mock" today
 * and can add a hosted provider without changing the request contract.
 */
export function createQuestMindCore({ provider } = {}) {
  const selectedProvider = createProvider(provider);
  return {
    provider: selectedProvider.name,
    answer(request) {
      return selectedProvider.answer(validateQuestRequest(request));
    },
  };
}

export { validateQuestRequest } from "./contracts.js";
export { createProvider, availableProviders } from "./providers/index.js";
export { providerNameFromEnv } from "./config.js";
export * from "./errors.js";
