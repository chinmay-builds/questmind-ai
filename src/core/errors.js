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
    super(`Unsupported QuestMind provider "${provider}". Available providers: mock.`, "UNSUPPORTED_PROVIDER");
    this.name = "UnsupportedProviderError";
  }
}
