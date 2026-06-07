/**
 * ai-agent-house
 *
 * A lightweight framework for multi-AI-agent cohabitation.
 * Where AI agents live together, share memory, and collaborate like roommates. 🏠🤖
 *
 * @packageDocumentation
 */

// Core
export { Agent } from "./core/agent.js";
export { House } from "./core/house.js";
export type { DiscussionOptions } from "./core/house.js";
export type {
  ProviderType,
  ProviderConfig,
  AgentConfig,
  AgentStatus,
  AgentState,
  MessageType,
  MessagePriority,
  BoardMessage,
  HouseConfig,
  DiscussionResult,
} from "./core/types.js";
export {
  ProviderConfigSchema,
  HouseConfigSchema,
  AgentConfigSchema,
} from "./core/types.js";

// Errors
export {
  AgentHouseError,
  ProviderError,
  RateLimitError,
  TimeoutError,
  NetworkError,
  ToolError,
  AgentError,
  MemoryError,
} from "./core/errors.js";

// Retry & Circuit Breaker
export { withRetry, CircuitBreaker } from "./core/retry.js";
export type {
  RetryOptions,
  CircuitBreakerOptions,
  CircuitState,
} from "./core/retry.js";

// Usage Tracking
export { UsageTracker } from "./core/usage-tracker.js";
export type {
  UsageRecord,
  UsageSummary,
  ModelCost,
} from "./core/usage-tracker.js";

// Providers
export type {
  ChatMessage,
  ChatRole,
  TokenUsage,
  LLMResponse,
  LLMProvider,
} from "./providers/provider.js";
export { ProviderFactory } from "./providers/provider-factory.js";
export { OpenAIProvider } from "./providers/openai-provider.js";
export { AnthropicProvider } from "./providers/anthropic-provider.js";
export { GoogleProvider } from "./providers/google-provider.js";

// Agents
export { SecretaryAgent } from "./agents/secretary.js";
export { WriterAgent } from "./agents/writer.js";
export { ResearcherAgent } from "./agents/researcher.js";
export { HousekeeperAgent } from "./agents/housekeeper.js";
export type { SecretaryAgentOptions } from "./agents/secretary.js";
export type { WriterAgentOptions } from "./agents/writer.js";
export type { ResearcherAgentOptions } from "./agents/researcher.js";
export type {
  HousekeeperAgentOptions,
  SubTaskAssignment,
} from "./agents/housekeeper.js";

// Memory
export { BulletinBoard } from "./memory/bulletin-board.js";
export type {
  PostOptions,
  QueryOptions,
} from "./memory/bulletin-board.js";
export { SharedMemory } from "./memory/shared-memory.js";
export type { MemoryProvider } from "./memory/memory-provider.js";
export { JsonFileMemoryProvider } from "./memory/json-file-memory-provider.js";
export { SqliteMemoryProvider } from "./memory/sqlite-memory-provider.js";

// Tools
export type { Tool, ToolParameter } from "./tools/tool.js";
export { toolsToPrompt, parseToolCall } from "./tools/tool.js";
export { ToolRegistry } from "./tools/tool-registry.js";
export { httpTool } from "./tools/http-tool.js";
export { fileReaderTool } from "./tools/file-reader-tool.js";
export type { WebSearchProvider } from "./tools/web-search-tool.js";
export { createWebSearchTool } from "./tools/web-search-tool.js";
