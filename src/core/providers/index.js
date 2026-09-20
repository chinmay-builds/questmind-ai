import { UnsupportedProviderError } from "../errors.js";
import { providerNameFromEnv } from "../config.js";
import { mockProvider } from "./mock.js";
import { createOpenRouterProvider } from "./openrouter.js";

const providers = new Map([
  [mockProvider.name, () => mockProvider],
  ["openrouter", (options) => createOpenRouterProvider(options)],
]);

export function createProvider(name, options = {}) {
  const selectedName = typeof name === "string" && name.trim() ? name : providerNameFromEnv(options.env);
  const factory = providers.get(selectedName.trim().toLowerCase());
  if (!factory) {
    throw new UnsupportedProviderError(name);
  }
  return factory(options);
}

export function availableProviders() {
  return [...providers.keys()];
}
