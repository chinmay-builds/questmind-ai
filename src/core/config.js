import { ProviderConfigurationError } from "./errors.js";

const DEFAULT_OPENROUTER_MODEL = "openrouter/free";

export const modelAliases = [
  { alias: "rules-sage", label: "Rules Sage", description: "Plain-language rules and edge cases" },
  { alias: "strategy-coach", label: "Strategy Coach", description: "Turn planning and trade-offs" },
  { alias: "tabletop-tactician", label: "Tabletop Tactician", description: "Board-state analysis" },
  { alias: "lorekeeper", label: "Lorekeeper", description: "Cards, factions, and scenario context" },
];

function envKey(alias, prefix) {
  return `${prefix}_${alias.replaceAll("-", "_").toUpperCase()}`;
}

function modelEnvValue(alias, env) {
  const suffix = alias.replaceAll("-", "_").toUpperCase();
  return [
    env?.[`QUESTMIND_MODEL_${suffix}`],
    env?.[`QUESTMIND_${suffix}_MODEL`],
    env?.[`OPENROUTER_MODEL_${suffix}`],
    env?.[`QUESTMIND_${suffix}`],
    env?.QUESTMIND_MODEL,
    env?.OPENROUTER_MODEL,
  ].find((value) => typeof value === "string" && value.trim())?.trim();
}

function providerEnvValue(alias, env) {
  const suffix = alias.replaceAll("-", "_").toUpperCase();
  return [
    env?.[`QUESTMIND_PROVIDER_${suffix}`],
    env?.[`QUESTMIND_${suffix}_PROVIDER`],
  ].find((value) => typeof value === "string" && value.trim())?.trim();
}

export function modelConfigFromEnv(env = globalThis.process?.env) {
  const provider = env?.QUESTMIND_PROVIDER?.trim() || (env?.OPENROUTER_API_KEY ? "openrouter" : "mock");
  const hasOpenRouter = provider.toLowerCase() === "openrouter" && Boolean(env?.OPENROUTER_API_KEY?.trim());
  return modelAliases.map(({ alias, label, description }) => ({
    alias,
    label,
    description,
    provider: providerEnvValue(alias, env) || provider,
    configured: provider.toLowerCase() === "mock" || Boolean(modelEnvValue(alias, env)) || hasOpenRouter,
  }));
}

export function resolveModelAlias(alias = "rules-sage", env = globalThis.process?.env) {
  const normalized = String(alias).trim().toLowerCase();
  const model = modelAliases.find((entry) => entry.alias === normalized);
  if (!model) throw new ProviderConfigurationError(`Unknown QuestMind model alias "${alias}".`);
  const modelName = modelEnvValue(normalized, env);
  const provider = providerEnvValue(normalized, env)?.toLowerCase()
    || env?.QUESTMIND_PROVIDER?.trim().toLowerCase()
    || (env?.OPENROUTER_API_KEY ? "openrouter" : "mock");
  if (!modelName && provider === "openrouter" && env?.OPENROUTER_API_KEY?.trim()) {
    return { ...model, model: DEFAULT_OPENROUTER_MODEL, provider };
  }
  if (!modelName) {
    throw new ProviderConfigurationError(`${model.label} is unavailable. Set ${envKey(normalized, "QUESTMIND_MODEL")} in the server environment.`);
  }
  return { ...model, model: modelName, provider };
}

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
