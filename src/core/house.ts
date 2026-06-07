/**
 * ai-agent-house — House (Agent Manager)
 *
 * The House is the central orchestrator that manages agents,
 * coordinates discussions, and maintains the bulletin board.
 * @module
 */

import { Agent } from "./agent.js";
import { BulletinBoard } from "../memory/bulletin-board.js";
import { SharedMemory } from "../memory/shared-memory.js";
import { UsageTracker } from "./usage-tracker.js";
import { ProviderFactory } from "../providers/provider-factory.js";
import type { LLMProvider } from "../providers/provider.js";
import type { MemoryProvider } from "../memory/memory-provider.js";
import type {
  HouseConfig,
  DiscussionResult,
  ProviderConfig,
  BoardMessage,
} from "./types.js";
import { HouseConfigSchema } from "./types.js";

/** Options for a discussion */
export interface DiscussionOptions {
  /** Maximum rounds of discussion */
  maxRounds?: number;
  /** Target specific agents by ID */
  targetAgents?: string[];
  /** Run agents in parallel within each round */
  parallel?: boolean;
  /** Use Housekeeper as coordinator (auto-delegates tasks) */
  coordinator?: boolean;
}

/**
 * House — The central orchestrator for multi-agent cohabitation.
 *
 * A House manages a group of AI agents, provides them with a shared
 * bulletin board for communication, and orchestrates multi-round
 * discussions.
 *
 * @example
 * ```typescript
 * const house = new House({
 *   name: "my-ai-home",
 *   provider: {
 *     type: "openai",
 *     apiKey: "sk-...",
 *     model: "gpt-4o",
 *   },
 * });
 *
 * house.addAgent(new SecretaryAgent({ name: "Aki" }));
 * house.addAgent(new WriterAgent({ name: "Sora" }));
 *
 * const result = await house.discuss("Plan a blog post");
 * ```
 */
export class House {
  /** House name */
  readonly name: string;

  /** Default provider configuration */
  readonly provider: ProviderConfig;

  /** Shared bulletin board */
  readonly bulletinBoard: BulletinBoard;

  /** Shared key-value memory */
  readonly memory: SharedMemory;

  /** Usage tracker for token/cost tracking */
  readonly usageTracker: UsageTracker;

  /** Maximum discussion rounds */
  readonly maxRounds: number;

  /** Verbose logging enabled */
  readonly verbose: boolean;

  /** Registered agents */
  private agents: Map<string, Agent> = new Map();

  /** LLM provider instance */
  private _llmProvider: LLMProvider;

  /** Optional persistent memory provider */
  private _memoryProvider?: MemoryProvider;

  constructor(config: HouseConfig) {
    // Validate configuration at runtime
    const validated = HouseConfigSchema.parse(config);

    this.name = validated.name;
    this.provider = validated.provider;
    this.maxRounds = validated.maxRounds;
    this.verbose = validated.verbose;
    this.bulletinBoard = new BulletinBoard();
    this.memory = new SharedMemory();
    this.usageTracker = new UsageTracker();
    this._memoryProvider = config.memoryProvider;

    // Create the LLM provider
    this._llmProvider = ProviderFactory.create(validated.provider);
  }

  /** The LLM provider instance */
  get llmProvider(): LLMProvider {
    return this._llmProvider;
  }

  /** The persistent memory provider (if configured) */
  get memoryProvider(): MemoryProvider | undefined {
    return this._memoryProvider;
  }

  /**
   * Add an agent to the house.
   *
   * @param agent - The agent to add
   * @throws Error if an agent with the same role already exists
   */
  addAgent(agent: Agent): void {
    if (this.agents.has(agent.id)) {
      throw new Error(
        `Agent with ID "${agent.id}" is already in the house`
      );
    }

    // Inject LLM provider into the agent
    if (agent.providerOverride) {
      // Agent has its own provider config — create a dedicated provider
      agent._setProvider(ProviderFactory.create(agent.providerOverride));
    } else {
      // Use the house's default provider
      agent._setProvider(this._llmProvider);
    }

    this.agents.set(agent.id, agent);

    // Post a system message announcing the new roommate
    this.bulletinBoard.post("system", "House", `🏠 ${agent.name} (${agent.role}) has moved in!`, {
      type: "system",
      priority: "low",
      tags: ["agent-joined"],
    });

    if (this.verbose) {
      console.log(
        `🏠 [${this.name}] Agent "${agent.name}" (${agent.role}) added`
      );
    }
  }

  /**
   * Remove an agent from the house.
   *
   * @param agentId - ID of the agent to remove
   */
  removeAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.delete(agentId);

      this.bulletinBoard.post("system", "House", `👋 ${agent.name} (${agent.role}) has moved out.`, {
        type: "system",
        priority: "low",
        tags: ["agent-left"],
      });
    }
  }

  /**
   * Get an agent by ID.
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents in the house.
   */
  getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents that can handle a specific task.
   */
  getCapableAgents(task: string): Agent[] {
    return this.getAgents().filter((agent) => agent.canHandle(task));
  }

  /**
   * Start a multi-agent discussion.
   *
   * The house coordinates a discussion where agents take turns
   * responding to the task and each other's messages. The discussion
   * continues for the specified number of rounds or until agents
   * reach consensus.
   *
   * @param task - The task or topic to discuss
   * @param options - Optional discussion parameters
   * @returns The discussion result with all messages and summary
   */
  async discuss(
    task: string,
    options: DiscussionOptions | { maxRounds?: number; targetAgents?: string[] } = {}
  ): Promise<DiscussionResult> {
    const startTime = Date.now();
    const maxRounds = options.maxRounds ?? this.maxRounds;
    const parallel = "parallel" in options ? options.parallel : false;

    // Determine participating agents
    let participants = this.getAgents();
    if (options.targetAgents) {
      participants = participants.filter((a) =>
        options.targetAgents!.includes(a.id)
      );
    }

    if (participants.length === 0) {
      throw new Error("No agents available for discussion");
    }

    // Post the initial task
    const taskMessage = this.bulletinBoard.post(
      "system",
      "House",
      task,
      {
        type: "task",
        priority: "high",
        tags: ["discussion"],
      }
    );

    if (this.verbose) {
      console.log(
        `\n🏠 [${this.name}] Starting discussion: "${task}"`
      );
      console.log(
        `   Participants: ${participants.map((a) => a.name).join(", ")}`
      );
      console.log(`   Max rounds: ${maxRounds}`);
      if (parallel) console.log(`   Mode: parallel`);
      console.log();
    }

    const allMessages: BoardMessage[] = [taskMessage];
    let totalTokens = 0;

    // Run discussion rounds
    for (let round = 0; round < maxRounds; round++) {
      if (this.verbose) {
        console.log(`--- Round ${round + 1}/${maxRounds} ---`);
      }

      if (parallel) {
        // ─── Parallel Execution ────────────────────
        const results = await Promise.allSettled(
          participants.map((agent) =>
            this.executeAgentTurn(agent, task, taskMessage.id, round)
          )
        );

        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const agent = participants[i];

          if (result.status === "fulfilled" && result.value) {
            allMessages.push(result.value.message);
            totalTokens += result.value.tokens;
          } else if (result.status === "rejected") {
            this.handleAgentError(agent, result.reason);
          }
        }
      } else {
        // ─── Sequential Execution ──────────────────
        for (const agent of participants) {
          try {
            const turnResult = await this.executeAgentTurn(
              agent,
              task,
              taskMessage.id,
              round
            );
            if (turnResult) {
              allMessages.push(turnResult.message);
              totalTokens += turnResult.tokens;
            }
          } catch (error) {
            this.handleAgentError(agent, error);
          }
        }
      }
    }

    // Generate summary from the last round of responses
    const lastRoundMessages = allMessages
      .filter(
        (m) =>
          m.type === "response" &&
          m.tags?.includes(`round-${maxRounds}`)
      )
      .map((m) => `${m.authorName}: ${m.content}`)
      .join("\n\n");

    const summary =
      lastRoundMessages || "No responses were generated.";

    // Aggregate usage
    const usageSummary = this.usageTracker.getTotal();

    const result: DiscussionResult = {
      summary,
      messages: allMessages,
      rounds: maxRounds,
      participants: participants.map((a) => a.id),
      tokensUsed: totalTokens || undefined,
      durationMs: Date.now() - startTime,
      usage:
        usageSummary.callCount > 0
          ? {
              promptTokens: usageSummary.promptTokens,
              completionTokens: usageSummary.completionTokens,
              totalTokens: usageSummary.totalTokens,
              cost: usageSummary.totalCost || undefined,
            }
          : undefined,
    };

    if (this.verbose) {
      console.log(
        `\n🏠 Discussion complete (${result.durationMs}ms)${totalTokens ? ` — ${totalTokens} tokens` : ""}\n`
      );
    }

    return result;
  }

  /**
   * Send a task to a specific agent.
   *
   * @param agentId - The target agent ID
   * @param task - The task to process
   * @returns The agent's response
   */
  async askAgent(agentId: string, task: string): Promise<string> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent "${agentId}" not found in the house`);
    }

    const context = this.bulletinBoard.getMessagesForAgent(
      agentId,
      10
    );

    agent._setStatus("thinking");
    try {
      const response = await agent.processTask(task, context);

      this.bulletinBoard.post(agent.id, agent.name, response, {
        type: "response",
        priority: "normal",
      });

      // Track usage from last LLM response
      if (agent.lastResponse?.usage) {
        this.usageTracker.record({
          agentId: agent.id,
          agentName: agent.name,
          model: agent.lastResponse.model,
          usage: agent.lastResponse.usage,
          timestamp: new Date(),
        });
      }

      agent._incrementProcessed();
      return response;
    } finally {
      agent._setStatus("idle");
    }
  }

  /**
   * Save house state to persistent memory.
   * Requires a memoryProvider to be configured.
   */
  async saveState(): Promise<void> {
    if (!this._memoryProvider) return;

    // Save shared memory
    await this._memoryProvider.save(
      "house",
      `${this.name}:shared-memory`,
      this.memory.snapshot()
    );

    // Save bulletin board
    await this._memoryProvider.save(
      "house",
      `${this.name}:bulletin-board`,
      this.bulletinBoard.export()
    );
  }

  /**
   * Restore house state from persistent memory.
   * Requires a memoryProvider to be configured.
   */
  async restoreState(): Promise<void> {
    if (!this._memoryProvider) return;

    // Restore shared memory
    const memoryData = await this._memoryProvider.load(
      "house",
      `${this.name}:shared-memory`
    );
    if (memoryData && typeof memoryData === "object") {
      this.memory.load(memoryData as Record<string, unknown>);
    }

    // Restore bulletin board
    const boardData = await this._memoryProvider.load(
      "house",
      `${this.name}:bulletin-board`
    );
    if (Array.isArray(boardData)) {
      this.bulletinBoard.import(boardData as BoardMessage[]);
    }
  }

  /**
   * Get the status of all agents.
   */
  getStatus() {
    return {
      name: this.name,
      agentCount: this.agents.size,
      messageCount: this.bulletinBoard.count,
      agents: this.getAgents().map((a) => a.getState()),
    };
  }

  // ─── Private ────────────────────────────────────────────

  /**
   * Execute a single agent's turn in a discussion round.
   * @internal
   */
  private async executeAgentTurn(
    agent: Agent,
    task: string,
    taskMessageId: string,
    round: number
  ): Promise<{ message: BoardMessage; tokens: number } | null> {
    // Get context — prefer unread messages for efficiency
    const context = agent.lastReadMessageId
      ? this.bulletinBoard.getUnreadMessages(
          agent.id,
          agent.lastReadMessageId,
          20
        )
      : this.bulletinBoard.getMessagesForAgent(agent.id, 20);

    agent._setStatus("thinking");

    try {
      const response = await agent.processTask(task, context);

      agent._setStatus("responding");

      // Post response to bulletin board
      const responseMessage = this.bulletinBoard.post(
        agent.id,
        agent.name,
        response,
        {
          type: "response",
          priority: "normal",
          parentId: taskMessageId,
          tags: ["discussion", `round-${round + 1}`],
        }
      );

      // Mark messages as read
      agent._markRead(responseMessage.id);

      // Track usage
      let tokens = 0;
      if (agent.lastResponse?.usage) {
        this.usageTracker.record({
          agentId: agent.id,
          agentName: agent.name,
          model: agent.lastResponse.model,
          usage: agent.lastResponse.usage,
          timestamp: new Date(),
        });
        tokens = agent.lastResponse.usage.totalTokens;
      }

      agent._incrementProcessed();

      if (this.verbose) {
        console.log(
          `  💬 ${agent.name}: ${response.slice(0, 100)}${response.length > 100 ? "..." : ""}`
        );
      }

      return { message: responseMessage, tokens };
    } finally {
      agent._setStatus("idle");
    }
  }

  /**
   * Handle an error from an agent during discussion.
   * @internal
   */
  private handleAgentError(agent: Agent, error: unknown): void {
    agent._setStatus("error");
    const errorMsg =
      error instanceof Error
        ? error.message
        : "Unknown error";

    this.bulletinBoard.post(
      agent.id,
      agent.name,
      `⚠️ Error: ${errorMsg}`,
      {
        type: "system",
        priority: "high",
        tags: ["error"],
      }
    );

    if (this.verbose) {
      console.error(
        `  ❌ ${agent.name} error: ${errorMsg}`
      );
    }

    agent._setStatus("idle");
  }
}
