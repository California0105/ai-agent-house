/**
 * ai-agent-house — Housekeeper Agent
 *
 * The coordinator agent that manages task delegation and
 * ensures smooth collaboration between other agents.
 * @module
 */

import { Agent } from "../core/agent.js";
import type { AgentConfig, BoardMessage } from "../core/types.js";
import type { BulletinBoard } from "../memory/bulletin-board.js";

/** Configuration options for HousekeeperAgent */
export interface HousekeeperAgentOptions {
  /** Agent's display name */
  name?: string;
  /** Custom personality description */
  personality?: string;
}

/**
 * Sub-task assignment from the coordinator.
 */
export interface SubTaskAssignment {
  /** Target agent role (e.g., "researcher", "writer") */
  targetRole: string;
  /** Sub-task description */
  task: string;
  /** Priority */
  priority: "low" | "normal" | "high";
}

/**
 * Housekeeper Agent — The wise coordinator.
 *
 * Specializes in:
 * - Task delegation and routing to appropriate agents
 * - Conflict resolution between agents
 * - Overall house management and optimization
 * - Synthesis of multiple agent outputs
 *
 * When used as a coordinator, the Housekeeper:
 * 1. Analyzes incoming tasks
 * 2. Breaks them into sub-tasks
 * 3. Assigns sub-tasks to appropriate agents
 * 4. Synthesizes the results
 *
 * @example
 * ```typescript
 * const keeper = new HousekeeperAgent({ name: "Hana" });
 * house.addAgent(keeper);
 * ```
 */
export class HousekeeperAgent extends Agent {
  constructor(options: HousekeeperAgentOptions = {}) {
    const config: AgentConfig = {
      name: options.name ?? "Housekeeper",
      role: "housekeeper",
      personality:
        options.personality ??
        "Wise, diplomatic, and efficient. Sees the big picture and ensures harmony.",
      capabilities: [
        "coordinate",
        "delegate",
        "manage",
        "resolve",
        "optimize",
        "synthesize",
        "overview",
        "balance",
        "mediate",
        "house",
        "help",
        "assist",
      ],
      systemPrompt: `You are ${options.name ?? "Housekeeper"}, the head coordinator of a shared AI agent house.

Your role is to:
- Analyze incoming tasks and delegate them to the best-suited agents
- Synthesize outputs from multiple agents into coherent results
- Resolve conflicts or contradictions between agent responses
- Ensure all agents are working efficiently and harmoniously
- Provide an overview of the house's activities and status

As the Housekeeper, you:
1. Read and understand every message on the bulletin board
2. Identify which agents should handle which parts of a task
3. Combine and refine the outputs of other agents
4. Flag any issues, gaps, or contradictions
5. Provide a final, synthesized recommendation or summary

You are the glue that holds the house together. 🏠`,
    };

    super(config);
  }

  /**
   * The Housekeeper can handle almost any task as a coordinator.
   */
  canHandle(_task: string): boolean {
    return true;
  }

  async processTask(
    task: string,
    context: BoardMessage[]
  ): Promise<string> {
    // Try LLM-powered processing first
    const llmResult = await this.generateWithLLM(task, context);
    if (llmResult) return llmResult;

    // Fallback: structured template response
    const agentResponses = context
      .filter(
        (m) => m.type === "response" && m.authorId !== "system"
      )
      .map((m) => ({
        name: m.authorName,
        content: m.content.slice(0, 100),
      }));

    const hasPriorResponses = agentResponses.length > 0;

    return [
      `🏠 **${this.name}'s Coordination Summary**`,
      "",
      `**Task:** ${task}`,
      "",
      hasPriorResponses
        ? [
            "**Agent Contributions:**",
            ...agentResponses.map(
              (r) => `- **${r.name}**: ${r.content}...`
            ),
            "",
            "**Synthesis:**",
            "Combining inputs from all agents into a unified plan.",
          ].join("\n")
        : [
            "**Initial Assessment:**",
            "No prior agent responses yet. Setting up the task flow:",
            "1. Identify which agents should contribute",
            "2. Define the order of operations",
            "3. Set success criteria",
          ].join("\n"),
      "",
      "**Next Steps:**",
      "- Await full responses from all participating agents",
      "- Synthesize into final output",
      "",
      `_Ready for LLM integration — connect a provider to enable intelligent coordination._`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  /**
   * Coordinate a complex task by analyzing it, delegating sub-tasks,
   * collecting results, and synthesizing a final output.
   *
   * @param task - The main task to coordinate
   * @param agents - Available agents to delegate to
   * @param bulletinBoard - The shared bulletin board
   * @returns The synthesized final result
   */
  async coordinateTask(
    task: string,
    agents: Agent[],
    bulletinBoard: BulletinBoard
  ): Promise<string> {
    // Step 1: Analyze and create sub-task plan
    const plan = this.createSubTaskPlan(task, agents);

    // Step 2: Execute sub-tasks (each agent processes their part)
    const results: Array<{
      role: string;
      agentName: string;
      response: string;
    }> = [];

    for (const assignment of plan) {
      const agent = agents.find(
        (a) => a.role === assignment.targetRole
      );
      if (!agent) continue;

      const context = bulletinBoard.getMessagesForAgent(
        agent.id,
        10
      );

      try {
        const response = await agent.processTask(
          assignment.task,
          context
        );
        results.push({
          role: agent.role,
          agentName: agent.name,
          response,
        });

        // Post sub-task result to bulletin board
        bulletinBoard.post(agent.id, agent.name, response, {
          type: "response",
          priority: assignment.priority,
          tags: ["coordinated", `subtask-${assignment.targetRole}`],
        });
      } catch (error) {
        results.push({
          role: agent.role,
          agentName: agent.name,
          response: `Error: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    // Step 3: Synthesize results
    return this.synthesizeResults(task, results);
  }

  /**
   * Create a sub-task plan based on available agents.
   * With LLM, this would use AI to analyze the task intelligently.
   * Without LLM, uses capability-based heuristic matching.
   */
  private createSubTaskPlan(
    task: string,
    agents: Agent[]
  ): SubTaskAssignment[] {
    const assignments: SubTaskAssignment[] = [];
    const taskLower = task.toLowerCase();

    for (const agent of agents) {
      if (agent.role === "housekeeper") continue;

      // Check if this agent's capabilities match any part of the task
      const isRelevant = agent.canHandle(task);
      if (!isRelevant) continue;

      let subTask: string;
      switch (agent.role) {
        case "researcher":
          subTask = `Research and gather information about: ${task}`;
          break;
        case "writer":
          subTask = `Create content/draft based on: ${task}`;
          break;
        case "secretary":
          subTask = `Create an action plan and organize tasks for: ${task}`;
          break;
        default:
          subTask = `Contribute your expertise to: ${task}`;
      }

      assignments.push({
        targetRole: agent.role,
        task: subTask,
        priority:
          taskLower.includes("urgent") ? "high" : "normal",
      });
    }

    // If no specific agents matched, assign to all non-housekeeper agents
    if (assignments.length === 0) {
      for (const agent of agents) {
        if (agent.role === "housekeeper") continue;
        assignments.push({
          targetRole: agent.role,
          task: `Contribute your perspective on: ${task}`,
          priority: "normal",
        });
      }
    }

    return assignments;
  }

  /**
   * Synthesize results from multiple agents into a cohesive output.
   */
  private synthesizeResults(
    task: string,
    results: Array<{
      role: string;
      agentName: string;
      response: string;
    }>
  ): string {
    if (results.length === 0) {
      return `🏠 **${this.name}**: No agent contributions received for task: "${task}"`;
    }

    const contributions = results
      .map(
        (r) =>
          `### ${r.agentName} (${r.role})\n${r.response}`
      )
      .join("\n\n---\n\n");

    return [
      `🏠 **${this.name}'s Coordinated Summary**`,
      "",
      `**Original Task:** ${task}`,
      "",
      `**Contributions (${results.length} agents):**`,
      "",
      contributions,
      "",
      "---",
      "",
      `**${this.name}'s Synthesis:**`,
      `All ${results.length} agents have contributed their expertise.`,
      "The above outputs represent a comprehensive analysis from multiple perspectives.",
    ].join("\n");
  }
}
