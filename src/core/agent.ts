/**
 * ai-agent-house — Agent Base Class
 *
 * Abstract base class for all AI agents in the house.
 * Extend this class to create custom agents with specialized behaviors.
 * @module
 */

import { nanoid } from "nanoid";
import type {
  AgentConfig,
  AgentState,
  AgentStatus,
  BoardMessage,
  ProviderConfig,
} from "./types.js";

/**
 * Abstract base class for AI agents.
 *
 * Each agent has a unique identity, role, personality, and capabilities.
 * Agents communicate through the house's bulletin board system.
 *
 * @example
 * ```typescript
 * class MyAgent extends Agent {
 *   async processTask(task: string, context: BoardMessage[]): Promise<string> {
 *     // Custom task processing logic
 *     return `Processed: ${task}`;
 *   }
 * }
 * ```
 */
export abstract class Agent {
  /** Unique agent identifier */
  readonly id: string;

  /** Agent configuration */
  readonly config: AgentConfig;

  /** Current agent status */
  private _status: AgentStatus = "idle";

  /** Number of messages processed */
  private _messagesProcessed = 0;

  /** Timestamp of last activity */
  private _lastActivity: Date | null = null;

  /** Optional provider override */
  private _providerOverride?: ProviderConfig;

  constructor(config: AgentConfig) {
    this.id = nanoid(12);
    this.config = config;
    this._providerOverride = config.provider;
  }

  /** Agent's display name */
  get name(): string {
    return this.config.name;
  }

  /** Agent's role */
  get role(): string {
    return this.config.role;
  }

  /** Agent's personality description */
  get personality(): string {
    return this.config.personality;
  }

  /** Agent's capabilities */
  get capabilities(): string[] {
    return this.config.capabilities;
  }

  /** Agent's system prompt */
  get systemPrompt(): string {
    return this.config.systemPrompt;
  }

  /** Current status */
  get status(): AgentStatus {
    return this._status;
  }

  /** Provider config (override or house default) */
  get providerOverride(): ProviderConfig | undefined {
    return this._providerOverride;
  }

  /**
   * Get the current state of this agent.
   */
  getState(): AgentState {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      status: this._status,
      messagesProcessed: this._messagesProcessed,
      lastActivity: this._lastActivity,
    };
  }

  /**
   * Process an incoming task or message.
   *
   * This is the core method that each agent implementation must define.
   * It receives the task description and relevant context from the bulletin board,
   * and returns the agent's response.
   *
   * @param task - The task or message to process
   * @param context - Recent relevant messages from the bulletin board
   * @returns The agent's response string
   */
  abstract processTask(
    task: string,
    context: BoardMessage[]
  ): Promise<string>;

  /**
   * Determine if this agent can handle the given task.
   *
   * Override this method to implement custom task-matching logic.
   * By default, checks if any capability keyword appears in the task.
   *
   * @param task - The task description
   * @returns Whether this agent can handle the task
   */
  canHandle(task: string): boolean {
    const taskLower = task.toLowerCase();
    return this.capabilities.some((cap) =>
      taskLower.includes(cap.toLowerCase())
    );
  }

  /**
   * Build the full prompt to send to the LLM, including system prompt,
   * context from the bulletin board, and the current task.
   *
   * @param task - The current task
   * @param context - Context messages from the bulletin board
   * @returns Formatted prompt messages
   */
  buildPrompt(
    task: string,
    context: BoardMessage[]
  ): Array<{ role: "system" | "user" | "assistant"; content: string }> {
    const contextSummary =
      context.length > 0
        ? context
            .map(
              (msg) =>
                `[${msg.authorName} (${msg.type})]: ${msg.content}`
            )
            .join("\n")
        : "No previous context.";

    return [
      {
        role: "system" as const,
        content: this.systemPrompt,
      },
      {
        role: "user" as const,
        content: [
          "## Bulletin Board Context",
          contextSummary,
          "",
          "## Current Task",
          task,
        ].join("\n"),
      },
    ];
  }

  /**
   * Update the agent's status.
   * @internal
   */
  _setStatus(status: AgentStatus): void {
    this._status = status;
    if (status !== "idle") {
      this._lastActivity = new Date();
    }
  }

  /**
   * Increment the processed message counter.
   * @internal
   */
  _incrementProcessed(): void {
    this._messagesProcessed++;
  }
}
