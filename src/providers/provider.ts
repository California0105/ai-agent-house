/**
 * ai-agent-house — LLM Provider Interface
 *
 * Abstract interface for all LLM provider implementations.
 * @module
 */

// ─── Chat Message ───────────────────────────────────────────

/** Role of a chat message participant */
export type ChatRole = "system" | "user" | "assistant";

/** A single message in a chat conversation */
export interface ChatMessage {
  /** Role of the message sender */
  role: ChatRole;
  /** Text content of the message */
  content: string;
}

// ─── LLM Response ───────────────────────────────────────────

/** Token usage information from the LLM */
export interface TokenUsage {
  /** Number of tokens in the prompt */
  promptTokens: number;
  /** Number of tokens in the completion */
  completionTokens: number;
  /** Total tokens used */
  totalTokens: number;
}

/** Response from an LLM provider */
export interface LLMResponse {
  /** The generated text content */
  content: string;
  /** Token usage statistics (if available from provider) */
  usage?: TokenUsage;
  /** The model that was used */
  model: string;
}

// ─── LLM Provider Interface ────────────────────────────────

/**
 * Interface that all LLM providers must implement.
 *
 * @example
 * ```typescript
 * class MyProvider implements LLMProvider {
 *   readonly providerType = "custom";
 *   readonly modelName = "my-model";
 *
 *   async generate(messages: ChatMessage[]): Promise<LLMResponse> {
 *     // Call your LLM API
 *     return { content: "response", model: this.modelName };
 *   }
 * }
 * ```
 */
export interface LLMProvider {
  /** The provider type identifier (e.g., "openai", "anthropic") */
  readonly providerType: string;

  /** The model name being used */
  readonly modelName: string;

  /**
   * Generate a response from the LLM.
   *
   * @param messages - The conversation history
   * @returns The LLM's response with optional usage info
   */
  generate(messages: ChatMessage[]): Promise<LLMResponse>;
}
