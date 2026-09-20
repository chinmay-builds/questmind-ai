import { validateQuestRequest } from "./contracts.js";
import { createProvider } from "./providers/index.js";

/**
 * Create a small provider-agnostic QuestMind core.
 * The provider is explicit when supplied; without one, local/no-key usage
 * resolves to mock and a configured OpenRouter key resolves to openrouter.
 */
export function createQuestMindCore({ provider, ...options } = {}) {
  const selectedProvider = createProvider(provider, options);
  return {
    provider: selectedProvider.name,
    answer(request) {
      return selectedProvider.answer(validateQuestRequest(request));
    },
  };
}

export { validateQuestRequest } from "./contracts.js";
export { createProvider, availableProviders } from "./providers/index.js";
export { providerNameFromEnv, providerConfigFromEnv } from "./config.js";
export * from "./errors.js";
