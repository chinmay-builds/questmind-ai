import { ProviderNotConfiguredError, UnsupportedProviderError } from "../errors.js";
import { mockProvider } from "./mock.js";

const providers = new Map([[mockProvider.name, mockProvider]]);

export function createProvider(name) {
  if (typeof name !== "string" || !name.trim()) {
    throw new ProviderNotConfiguredError();
  }
  const provider = providers.get(name.trim().toLowerCase());
  if (!provider) {
    throw new UnsupportedProviderError(name);
  }
  return provider;
}

export function availableProviders() {
  return [...providers.keys()];
}
