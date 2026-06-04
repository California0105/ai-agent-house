/**
 * ai-agent-house — Housekeeper Agent
 *
 * The coordinator agent that manages task delegation and
 * ensures smooth collaboration between other agents.
 * @module
 */

import { Agent } from "../core/agent.js";
import type { AgentConfig, BoardMessage } from "../core/types.js";

/** Configuration options for HousekeeperAgent */
export interface HousekeeperAgentOptions {
  /** Agent's display name */
  name?: string;
  /** Custom personality description */
  personality?: string;
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
    // Prompt ready for LLM integration: this.buildPrompt(task, context)

    // Analyze context from other agents
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
}
