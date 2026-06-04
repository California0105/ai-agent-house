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

// Agents
export { SecretaryAgent } from "./agents/secretary.js";
export { WriterAgent } from "./agents/writer.js";
export { ResearcherAgent } from "./agents/researcher.js";
export { HousekeeperAgent } from "./agents/housekeeper.js";
export type { SecretaryAgentOptions } from "./agents/secretary.js";
export type { WriterAgentOptions } from "./agents/writer.js";
export type { ResearcherAgentOptions } from "./agents/researcher.js";
export type { HousekeeperAgentOptions } from "./agents/housekeeper.js";

// Memory
export { BulletinBoard } from "./memory/bulletin-board.js";
export type {
  PostOptions,
  QueryOptions,
} from "./memory/bulletin-board.js";
