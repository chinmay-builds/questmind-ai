import { UnsupportedProviderError } from "../errors.js";
import { providerNameFromEnv, resolveModelAlias } from "../config.js";
import { mockProvider } from "./mock.js";
import { createOpenRouterProvider } from "./openrouter.js";

const providers = new Map([
  [mockProvider.name, () => mockProvider],
  ["openrouter", (options) => createOpenRouterProvider(options)],
]);

export function createProvider(name, options = {}) {
  const explicitName = typeof name === "string" && name.trim() ? name.trim().toLowerCase() : null;
  const configuredName = explicitName ?? providerNameFromEnv(options.env);
  const model = options.modelAlias && configuredName !== "mock"
    ? resolveModelAlias(options.modelAlias, options.env)
    : null;
  const selectedName = explicitName ?? model?.provider ?? configuredName;
  const factory = providers.get(selectedName.trim().toLowerCase());
  if (!factory) {
    throw new UnsupportedProviderError(name);
  }
  return factory({ ...options, model: model?.model });
}

export function availableProviders() {
  return [...providers.keys()];
}
