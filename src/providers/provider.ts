/**
 * ai-agent-house — LLM Provider Interface
 *
 * Abstract interface for all LLM provider implementations.
 * @module
 */

import type { Tool } from "../tools/tool.js";

// ─── Chat Message ───────────────────────────────────────────

/** Role of a chat message participant */
export type ChatRole = "system" | "user" | "assistant" | "tool";

/** Text content part */
export interface ContentPartText {
  type: "text";
  text: string;
}

/** Image content part */
export interface ContentPartImage {
  type: "image_url";
  image_url: {
    url: string;
  };
}

/** A part of a multi-modal message content */
export type ContentPart = ContentPartText | ContentPartImage;

/** A tool call request from the LLM */
export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON string representation
  };
}

/** A single message in a chat conversation */
export interface ChatMessage {
  /** Role of the message sender */
  role: ChatRole;
  /** Content of the message */
  content?: string | ContentPart[];
  /** Name of the author (used for tool responses or distinguishing users) */
  name?: string;
  /** Tool calls requested by the assistant */
  tool_calls?: ToolCall[];
  /** ID of the tool call this message is responding to */
  tool_call_id?: string;
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
  content?: string;
  /** Tool calls requested by the model */
  tool_calls?: ToolCall[];
  /** Token usage statistics (if available from provider) */
  usage?: TokenUsage;
  /** The model that was used */
  model: string;
}

// ─── LLM Provider Interface ────────────────────────────────

/** Options passed to the generate call */
export interface GenerateOptions {
  /** Tools available for the model to call */
  tools?: Tool[];
}

/**
 * Interface that all LLM providers must implement.
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
   * @param options - Generation options including tools
   * @returns The LLM's response with optional usage and tool calls
   */
  generate(messages: ChatMessage[], options?: GenerateOptions): Promise<LLMResponse>;
}
