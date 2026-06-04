/**
 * ai-agent-house — House (Agent Manager)
 *
 * The House is the central orchestrator that manages agents,
 * coordinates discussions, and maintains the bulletin board.
 * @module
 */

import { Agent } from "./agent.js";
import { BulletinBoard } from "../memory/bulletin-board.js";
import type {
  HouseConfig,
  DiscussionResult,
  ProviderConfig,
  BoardMessage,
} from "./types.js";
import { HouseConfigSchema } from "./types.js";

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

  /** Maximum discussion rounds */
  readonly maxRounds: number;

  /** Verbose logging enabled */
  readonly verbose: boolean;

  /** Registered agents */
  private agents: Map<string, Agent> = new Map();

  constructor(config: HouseConfig) {
    // Validate configuration at runtime
    const validated = HouseConfigSchema.parse(config);

    this.name = validated.name;
    this.provider = validated.provider;
    this.maxRounds = validated.maxRounds;
    this.verbose = validated.verbose;
    this.bulletinBoard = new BulletinBoard();
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
    options: { maxRounds?: number; targetAgents?: string[] } = {}
  ): Promise<DiscussionResult> {
    const startTime = Date.now();
    const maxRounds = options.maxRounds ?? this.maxRounds;

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
      console.log(`   Max rounds: ${maxRounds}\n`);
    }

    const allMessages: BoardMessage[] = [taskMessage];

    // Run discussion rounds
    for (let round = 0; round < maxRounds; round++) {
      if (this.verbose) {
        console.log(`--- Round ${round + 1}/${maxRounds} ---`);
      }

      for (const agent of participants) {
        // Get context from bulletin board
        const context = this.bulletinBoard.getMessagesForAgent(
          agent.id,
          20
        );

        try {
          agent._setStatus("thinking");

          // Each agent processes the task with context
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
              parentId: taskMessage.id,
              tags: ["discussion", `round-${round + 1}`],
            }
          );

          allMessages.push(responseMessage);
          agent._incrementProcessed();

          if (this.verbose) {
            console.log(
              `  💬 ${agent.name}: ${response.slice(0, 100)}${response.length > 100 ? "..." : ""}`
            );
          }
        } catch (error) {
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
        } finally {
          agent._setStatus("idle");
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

    const result: DiscussionResult = {
      summary,
      messages: allMessages,
      rounds: maxRounds,
      participants: participants.map((a) => a.id),
      durationMs: Date.now() - startTime,
    };

    if (this.verbose) {
      console.log(
        `\n🏠 Discussion complete (${result.durationMs}ms)\n`
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

      agent._incrementProcessed();
      return response;
    } finally {
      agent._setStatus("idle");
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
}
