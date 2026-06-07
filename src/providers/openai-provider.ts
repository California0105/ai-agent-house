/**
 * ai-agent-house — OpenAI Provider
 *
 * LLM provider implementation using the OpenAI SDK.
 * Supports gpt-4o, gpt-4.1, gpt-5, and compatible models.
 * @module
 */

import type { ProviderConfig } from "../core/types.js";
import type { GenerateOptions, ChatMessage, LLMProvider, LLMResponse, ToolCall } from "./provider.js";
import {
  ProviderError,
  RateLimitError,
  TimeoutError,
  NetworkError,
} from "../core/errors.js";
import { withRetry, CircuitBreaker } from "../core/retry.js";

/**
 * OpenAI LLM Provider.
 *
 * Uses the official `openai` SDK to generate completions.
 * The SDK is loaded lazily — only imported when the first call is made.
 *
 * @example
 * ```typescript
 * const provider = new OpenAIProvider({
 *   type: "openai",
 *   apiKey: "sk-...",
 *   model: "gpt-4o",
 * });
 * const response = await provider.generate(messages);
 * ```
 */
export class OpenAIProvider implements LLMProvider {
  readonly providerType = "openai";
  readonly modelName: string;

  private readonly apiKey: string;
  private readonly baseUrl?: string;
  private readonly temperature: number;
  private readonly maxTokens?: number;
  private readonly breaker: CircuitBreaker;

  // Lazy-loaded OpenAI client (typed as `any` to avoid requiring SDK types at compile time)
   
  private client: any = null;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey;
    this.modelName = config.model;
    this.baseUrl = config.baseUrl;
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens;
    this.breaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeoutMs: 60_000,
    });
  }

  /**
   * Lazily initialize the OpenAI client.
   * Defers the import so the SDK is only loaded if actually used.
   */
   
  private async getClient(): Promise<any> {
    if (!this.client) {
      try {
        // Dynamic import — the `openai` package must be installed by the user
        const { importModule } = await import("../core/import-helper.js");
        const module = await importModule("openai");
        const OpenAI = module.default ?? module;
        this.client = new OpenAI({
          apiKey: this.apiKey,
          ...(this.baseUrl ? { baseURL: this.baseUrl } : {}),
        });
      } catch {
        throw new ProviderError(
          'Failed to load OpenAI SDK. Install it with: npm install openai',
          "openai"
        );
      }
    }
    return this.client;
  }

  async generate(messages: ChatMessage[], options?: GenerateOptions): Promise<LLMResponse> {
    return this.breaker.execute(() =>
      withRetry(() => this._generate(messages, options), {
        maxRetries: 3,
        baseDelayMs: 1000,
      })
    );
  }

  private async _generate(messages: ChatMessage[], options?: GenerateOptions): Promise<LLMResponse> {
    const client = await this.getClient();

    try {
      const openaiMessages = messages.map((m: ChatMessage) => {
        const msg: any = {
          role: m.role,
          content: m.content,
        };
        if (m.name) msg.name = m.name;
        if (m.tool_calls) {
          msg.tool_calls = m.tool_calls.map(tc => ({
            id: tc.id,
            type: tc.type,
            function: tc.function,
          }));
        }
        if (m.tool_call_id) {
          msg.tool_call_id = m.tool_call_id;
        }
        return msg;
      });

      const request: any = {
        model: this.modelName,
        messages: openaiMessages,
        temperature: this.temperature,
      };

      if (this.maxTokens) {
        request.max_tokens = this.maxTokens;
      }

      if (options?.tools && options.tools.length > 0) {
        request.tools = options.tools.map((tool) => {
          const properties: Record<string, any> = {};
          const required: string[] = [];

          for (const [key, param] of Object.entries(tool.parameters)) {
            properties[key] = {
              type: param.type,
              description: param.description,
            };
            if (param.required) {
              required.push(key);
            }
          }

          return {
            type: "function",
            function: {
              name: tool.name,
              description: tool.description,
              parameters: {
                type: "object",
                properties,
                required,
                additionalProperties: false,
              },
            },
          };
        });
      }

      const completion = await client.chat.completions.create(request);

      const choice = completion.choices?.[0];
      const content = choice?.message?.content ?? undefined;
      const tool_calls = choice?.message?.tool_calls as ToolCall[] | undefined;

      return {
        content,
        tool_calls,
        model: completion.model ?? this.modelName,
        usage: completion.usage
          ? {
              promptTokens: completion.usage.prompt_tokens ?? 0,
              completionTokens: completion.usage.completion_tokens ?? 0,
              totalTokens: completion.usage.total_tokens ?? 0,
            }
          : undefined,
      };
    } catch (error: unknown) {
      throw this.mapError(error);
    }
  }

  private mapError(error: unknown): Error {
    // Handle OpenAI-specific errors
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      const message =
        error instanceof Error ? error.message : String(error);

      if (status === 429) {
        return new RateLimitError("openai");
      }
      if (status === 408 || message.includes("timeout")) {
        return new TimeoutError("openai", 30_000);
      }
      if (status >= 500) {
        return new ProviderError(message, "openai", status);
      }
      return new ProviderError(message, "openai", status);
    }

    if (error instanceof TypeError || (error instanceof Error && error.message.includes("fetch"))) {
      return new NetworkError("openai", undefined, { cause: error });
    }

    return error instanceof Error
      ? new ProviderError(error.message, "openai", undefined, { cause: error })
      : new ProviderError(String(error), "openai");
  }
}
