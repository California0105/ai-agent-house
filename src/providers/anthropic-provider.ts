/**
 * ai-agent-house — Anthropic Provider
 *
 * LLM provider implementation using the Anthropic SDK.
 * Supports Claude models (claude-sonnet-4-20250514, etc.).
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
 * Anthropic LLM Provider.
 *
 * Uses the official `@anthropic-ai/sdk` to generate completions.
 * The SDK is loaded lazily — only imported when the first call is made.
 *
 * @example
 * ```typescript
 * const provider = new AnthropicProvider({
 *   type: "anthropic",
 *   apiKey: "sk-ant-...",
 *   model: "claude-sonnet-4-20250514",
 * });
 * ```
 */
export class AnthropicProvider implements LLMProvider {
  readonly providerType = "anthropic";
  readonly modelName: string;

  private readonly apiKey: string;
  private readonly baseUrl?: string;
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly breaker: CircuitBreaker;

   
  private client: any = null;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey;
    this.modelName = config.model;
    this.baseUrl = config.baseUrl;
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 4096;
    this.breaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeoutMs: 60_000,
    });
  }

   
  private async getClient(): Promise<any> {
    if (!this.client) {
      try {
        const { importModule } = await import("../core/import-helper.js");
        const module = await importModule("@anthropic-ai/sdk");
        const Anthropic = module.default ?? module;
        this.client = new Anthropic({
          apiKey: this.apiKey,
          ...(this.baseUrl ? { baseURL: this.baseUrl } : {}),
        });
      } catch {
        throw new ProviderError(
          'Failed to load Anthropic SDK. Install it with: npm install @anthropic-ai/sdk',
          "anthropic"
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
    const client = await this.getClient();

    // Anthropic API separates system prompt from messages
    const systemMessage = messages.find((m) => m.role === "system");
    const userMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    try {
      const response = await client.messages.create({
        model: this.modelName,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        ...(systemMessage ? { system: systemMessage.content } : {}),
        messages: userMessages,
      });

      // Extract text content from content blocks
      const content = response.content
        .filter((block: { type: string }) => block.type === "text")
        .map((block: { type: string; text: string }) => block.text)
        .join("");

      return {
        content,
        model: response.model ?? this.modelName,
        usage: response.usage
          ? {
              promptTokens: response.usage.input_tokens ?? 0,
              completionTokens: response.usage.output_tokens ?? 0,
              totalTokens:
                (response.usage.input_tokens ?? 0) +
                (response.usage.output_tokens ?? 0),
            }
          : undefined,
      };
    } catch (error: unknown) {
      throw this.mapError(error);
    }
  }

  private mapError(error: unknown): Error {
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      const message =
        error instanceof Error ? error.message : String(error);

      if (status === 429) {
        return new RateLimitError("anthropic");
      }
      if (status === 408 || message.includes("timeout")) {
        return new TimeoutError("anthropic", 30_000);
      }
      return new ProviderError(message, "anthropic", status);
    }

    if (error instanceof TypeError || (error instanceof Error && error.message.includes("fetch"))) {
      return new NetworkError("anthropic", undefined, { cause: error });
    }

    return error instanceof Error
      ? new ProviderError(error.message, "anthropic", undefined, { cause: error })
      : new ProviderError(String(error), "anthropic");
  }
}
