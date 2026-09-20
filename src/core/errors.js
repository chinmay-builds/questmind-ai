export class QuestMindError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "QuestMindError";
    this.code = code;
  }
}

export class InvalidQuestRequestError extends QuestMindError {
  constructor(message) {
    super(message, "INVALID_REQUEST");
    this.name = "InvalidQuestRequestError";
  }
}

export class ProviderNotConfiguredError extends QuestMindError {
  constructor() {
    super("No QuestMind provider is configured. Set QUESTMIND_PROVIDER or pass a provider name.", "PROVIDER_NOT_CONFIGURED");
    this.name = "ProviderNotConfiguredError";
  }
}

export class UnsupportedProviderError extends QuestMindError {
  constructor(provider) {
    super(`Unsupported QuestMind provider "${provider}". Available providers: mock, openrouter.`, "UNSUPPORTED_PROVIDER");
    this.name = "UnsupportedProviderError";
  }
}

export class ModelConfigurationError extends QuestMindError {
  constructor(message) {
    super(message, "MODEL_CONFIGURATION_ERROR");
    this.name = "ModelConfigurationError";
  }
}

export class ProviderConfigurationError extends QuestMindError {
  constructor(message) {
    super(message, "PROVIDER_CONFIGURATION_ERROR");
    this.name = "ProviderConfigurationError";
  }
}

export class ProviderRequestError extends QuestMindError {
  constructor(message, code = "PROVIDER_REQUEST_FAILED") {
    super(message, code);
    this.name = "ProviderRequestError";
  }
}
