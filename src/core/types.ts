/**
 * ai-agent-house — Core Type Definitions
 *
 * Type system for the multi-agent cohabitation framework.
 * @module
 */

import { z } from "zod";

// ─── Agent Types ────────────────────────────────────────────

/** Supported LLM provider types */
export type ProviderType = "openai" | "anthropic" | "google" | "local";

/** Configuration for the LLM provider */
export interface ProviderConfig {
  /** Provider type */
  type: ProviderType;
  /** API key for the provider */
  apiKey: string;
  /** Model name (e.g., "gpt-4o", "claude-sonnet-4-20250514") */
  model: string;
  /** Optional base URL for custom endpoints */
  baseUrl?: string;
  /** Optional temperature setting (0-2) */
  temperature?: number;
  /** Optional max tokens */
  maxTokens?: number;
}

/** Configuration for creating an agent */
export interface AgentConfig {
  /** Agent's display name */
  name: string;
  /** Agent's role identifier */
  role: string;
  /** Personality description used in system prompts */
  personality: string;
  /** List of capability identifiers */
  capabilities: string[];
  /** System prompt for the agent */
  systemPrompt: string;
  /** Optional provider override (uses house provider by default) */
  provider?: ProviderConfig;
}

/** Current status of an agent */
export type AgentStatus = "idle" | "thinking" | "responding" | "error";

/** Information about an agent's current state */
export interface AgentState {
  /** Agent ID */
  id: string;
  /** Agent name */
  name: string;
  /** Agent role */
  role: string;
  /** Current status */
  status: AgentStatus;
  /** Number of messages processed */
  messagesProcessed: number;
  /** Timestamp of last activity */
  lastActivity: Date | null;
}

// ─── Message Types ──────────────────────────────────────────

/** Types of messages on the bulletin board */
export type MessageType =
  | "task"       // A task to be completed
  | "response"   // A response to a task or discussion
  | "note"       // A general note/observation
  | "question"   // A question for other agents
  | "summary"    // A summary of discussion/work
  | "system";    // System-level message

/** Priority levels for messages */
export type MessagePriority = "low" | "normal" | "high" | "urgent";

/** A message posted on the bulletin board */
export interface BoardMessage {
  /** Unique message ID */
  id: string;
  /** ID of the agent who posted */
  authorId: string;
  /** Name of the agent who posted */
  authorName: string;
  /** Message content */
  content: string;
  /** Message type */
  type: MessageType;
  /** Priority level */
  priority: MessagePriority;
  /** Optional target agent IDs */
  targetAgents?: string[];
  /** Optional tags for categorization */
  tags?: string[];
  /** Optional parent message ID (for threading) */
  parentId?: string;
  /** Timestamp of creation */
  createdAt: Date;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

// ─── House Types ────────────────────────────────────────────

/** Configuration for creating a house */
export interface HouseConfig {
  /** House name */
  name: string;
  /** Default LLM provider for all agents */
  provider: ProviderConfig;
  /** Maximum number of discussion rounds */
  maxRounds?: number;
  /** Enable verbose logging */
  verbose?: boolean;
}

/** Result of a discussion */
export interface DiscussionResult {
  /** Final summary of the discussion */
  summary: string;
  /** All messages exchanged during discussion */
  messages: BoardMessage[];
  /** Number of rounds */
  rounds: number;
  /** Participating agent IDs */
  participants: string[];
  /** Total tokens used (if available) */
  tokensUsed?: number;
  /** Duration in milliseconds */
  durationMs: number;
}

// ─── Zod Schemas (for runtime validation) ────────────────────

export const ProviderConfigSchema = z.object({
  type: z.enum(["openai", "anthropic", "google", "local"]),
  apiKey: z.string().min(1, "API key is required"),
  model: z.string().min(1, "Model name is required"),
  baseUrl: z.string().url().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
});

export const HouseConfigSchema = z.object({
  name: z.string().min(1, "House name is required"),
  provider: ProviderConfigSchema,
  maxRounds: z.number().positive().default(5),
  verbose: z.boolean().default(false),
});

export const AgentConfigSchema = z.object({
  name: z.string().min(1, "Agent name is required"),
  role: z.string().min(1, "Agent role is required"),
  personality: z.string(),
  capabilities: z.array(z.string()),
  systemPrompt: z.string(),
  provider: ProviderConfigSchema.optional(),
});
