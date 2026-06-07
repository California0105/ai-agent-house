/**
 * ai-agent-house — Provider Factory
 *
 * Creates the appropriate LLM provider based on configuration.
 * @module
 */

import type { ProviderConfig } from "../core/types.js";
import type { LLMProvider } from "./provider.js";
import { ProviderError } from "../core/errors.js";
import { OpenAIProvider } from "./openai-provider.js";
import { AnthropicProvider } from "./anthropic-provider.js";
import { GoogleProvider } from "./google-provider.js";

/**
 * Factory for creating LLM provider instances.
 *
 * @example
 * ```typescript
 * const provider = ProviderFactory.create({
 *   type: "openai",
 *   apiKey: "sk-...",
 *   model: "gpt-4o",
 * });
 * ```
 */
export class ProviderFactory {
  /**
   * Create an LLM provider from a configuration object.
   *
   * @param config - The provider configuration
   * @returns An LLMProvider instance
   * @throws ProviderError if the provider type is unknown
   */
  static create(config: ProviderConfig): LLMProvider {
    switch (config.type) {
      case "openai":
        return new OpenAIProvider(config);

      case "anthropic":
        return new AnthropicProvider(config);

      case "google":
        return new GoogleProvider(config);

      case "local":
        // Local providers use OpenAI-compatible API
        // baseUrl is required for local providers
        if (!config.baseUrl) {
          throw new ProviderError(
            'Local provider requires a "baseUrl" (e.g., "http://localhost:11434/v1")',
            "local"
          );
        }
        return new OpenAIProvider(config);

      default:
        throw new ProviderError(
          `Unknown provider type: "${(config as ProviderConfig).type}". Supported: openai, anthropic, google, local`,
          "unknown"
        );
    }
  }
}
