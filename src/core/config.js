import { ProviderNotConfiguredError } from "./errors.js";

export function providerNameFromEnv(env = globalThis.process?.env) {
  const name = env?.QUESTMIND_PROVIDER?.trim();
  if (!name) {
    throw new ProviderNotConfiguredError();
  }
  return name;
}
