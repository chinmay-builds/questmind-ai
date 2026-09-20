import { ProviderConfigurationError } from "./errors.js";

export function providerNameFromEnv(env = globalThis.process?.env) {
  const name = env?.QUESTMIND_PROVIDER?.trim();
  if (name) {
    if (name.toLowerCase() === "openrouter" && !env?.OPENROUTER_API_KEY) {
      throw new ProviderConfigurationError("OPENROUTER_API_KEY is required when QUESTMIND_PROVIDER=openrouter.");
    }
    return name;
  }
  return env?.OPENROUTER_API_KEY ? "openrouter" : "mock";
}

export function providerConfigFromEnv(env = globalThis.process?.env) {
  return { provider: providerNameFromEnv(env) };
}
