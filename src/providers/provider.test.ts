import { describe, it, expect, vi } from "vitest";
import { ProviderFactory } from "./provider-factory.js";
import { OpenAIProvider } from "./openai-provider.js";
import { AnthropicProvider } from "./anthropic-provider.js";
import { GoogleProvider } from "./google-provider.js";
import type { LLMProvider, ChatMessage } from "./provider.js";

const testConfig = (type: "openai" | "anthropic" | "google" | "local") => ({
  type,
  apiKey: "test-key",
  model: "test-model",
});

describe("ProviderFactory", () => {
  it("should create an OpenAI provider", () => {
    const provider = ProviderFactory.create(testConfig("openai"));
    expect(provider).toBeInstanceOf(OpenAIProvider);
    expect(provider.providerType).toBe("openai");
    expect(provider.modelName).toBe("test-model");
  });

  it("should create an Anthropic provider", () => {
    const provider = ProviderFactory.create(testConfig("anthropic"));
    expect(provider).toBeInstanceOf(AnthropicProvider);
    expect(provider.providerType).toBe("anthropic");
  });

  it("should create a Google provider", () => {
    const provider = ProviderFactory.create(testConfig("google"));
    expect(provider).toBeInstanceOf(GoogleProvider);
    expect(provider.providerType).toBe("google");
  });

  it("should create a local provider (OpenAI-compatible)", () => {
    const provider = ProviderFactory.create({
      ...testConfig("local"),
      baseUrl: "http://localhost:11434/v1",
    });
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it("should throw for local provider without baseUrl", () => {
    expect(() =>
      ProviderFactory.create(testConfig("local"))
    ).toThrow("baseUrl");
  });

  it("should throw for unknown provider type", () => {
    expect(() =>
      ProviderFactory.create({
        type: "unknown" as "openai",
        apiKey: "key",
        model: "model",
      })
    ).toThrow("Unknown provider type");
  });
});

describe("LLMProvider interface", () => {
  it("should accept a mock provider", async () => {
    const mockProvider: LLMProvider = {
      providerType: "mock",
      modelName: "mock-model",
      generate: vi.fn().mockResolvedValue({
        content: "Hello from mock",
        model: "mock-model",
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
      }),
    };

    const messages: ChatMessage[] = [
      { role: "system", content: "You are helpful" },
      { role: "user", content: "Hi" },
    ];

    const response = await mockProvider.generate(messages);
    expect(response.content).toBe("Hello from mock");
    expect(response.usage?.totalTokens).toBe(15);
    expect(mockProvider.generate).toHaveBeenCalledWith(messages);
  });
});
