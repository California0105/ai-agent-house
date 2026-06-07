/**
 * ai-agent-house — Google Generative AI Provider
 *
 * LLM provider implementation using the Google Generative AI SDK.
 * Supports Gemini models (gemini-2.5-flash, etc.).
 * @module
 */

import type { ProviderConfig } from "../core/types.js";
import type { ChatMessage, LLMProvider, LLMResponse } from "./provider.js";
import {
  ProviderError,
  RateLimitError,
  TimeoutError,
  NetworkError,
} from "../core/errors.js";
import { withRetry, CircuitBreaker } from "../core/retry.js";

/**
 * Google Generative AI Provider.
 *
 * Uses the `@google/generative-ai` SDK to generate content.
 * The SDK is loaded lazily — only imported when the first call is made.
 *
 * @example
 * ```typescript
 * const provider = new GoogleProvider({
 *   type: "google",
 *   apiKey: "AI...",
 *   model: "gemini-2.5-flash",
 * });
 * ```
 */
export class GoogleProvider implements LLMProvider {
  readonly providerType = "google";
  readonly modelName: string;

  private readonly apiKey: string;
  private readonly temperature: number;
  private readonly maxTokens?: number;
  private readonly breaker: CircuitBreaker;

   
  private client: any = null;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey;
    this.modelName = config.model;
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens;
    this.breaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeoutMs: 60_000,
    });
  }

   
  private async getClient(): Promise<any> {
    if (!this.client) {
      try {
        const { importModule } = await import("../core/import-helper.js");
        const module = await importModule("@google/generative-ai");
        const { GoogleGenerativeAI } = module;
        this.client = new GoogleGenerativeAI(this.apiKey);
      } catch {
        throw new ProviderError(
          'Failed to load Google Generative AI SDK. Install it with: npm install @google/generative-ai',
          "google"
        );
      }
    }
    return this.client;
  }

  async generate(messages: ChatMessage[]): Promise<LLMResponse> {
    return this.breaker.execute(() =>
      withRetry(() => this._generate(messages), {
        maxRetries: 3,
        baseDelayMs: 1000,
      })
    );
  }

  private async _generate(messages: ChatMessage[]): Promise<LLMResponse> {
    const genAI = await this.getClient();

    // Extract system instruction
    const systemMessage = messages.find((m) => m.role === "system");
    const chatMessages = messages.filter((m) => m.role !== "system");

    try {
      const model = genAI.getGenerativeModel({
        model: this.modelName,
        ...(systemMessage
          ? { systemInstruction: systemMessage.content }
          : {}),
        generationConfig: {
          temperature: this.temperature,
          ...(this.maxTokens
            ? { maxOutputTokens: this.maxTokens }
            : {}),
        },
      });

      // Convert messages to Gemini format
      const history = chatMessages.slice(0, -1).map((m: ChatMessage) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const lastMessage = chatMessages[chatMessages.length - 1];

      // Start chat with history and send last message
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(
        lastMessage?.content ?? ""
      );
      const response = result.response;
      const content = response.text();

      return {
        content,
        model: this.modelName,
        usage: response.usageMetadata
          ? {
              promptTokens: response.usageMetadata.promptTokenCount ?? 0,
              completionTokens:
                response.usageMetadata.candidatesTokenCount ?? 0,
              totalTokens: response.usageMetadata.totalTokenCount ?? 0,
            }
          : undefined,
      };
    } catch (error: unknown) {
      throw this.mapError(error);
    }
  }

  private mapError(error: unknown): Error {
    if (error instanceof ProviderError) return error;

    const message =
      error instanceof Error ? error.message : String(error);

    if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
      return new RateLimitError("google");
    }
    if (message.includes("timeout") || message.includes("DEADLINE_EXCEEDED")) {
      return new TimeoutError("google", 30_000);
    }
    if (message.includes("fetch") || message.includes("UNAVAILABLE")) {
      return new NetworkError("google", message);
    }

    return error instanceof Error
      ? new ProviderError(error.message, "google", undefined, {
          cause: error,
        })
      : new ProviderError(String(error), "google");
  }
}
