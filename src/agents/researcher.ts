/**
 * ai-agent-house — Researcher Agent
 *
 * An agent specialized in information gathering, analysis, and summarization.
 * @module
 */

import { Agent } from "../core/agent.js";
import type { AgentConfig, BoardMessage } from "../core/types.js";

/** Configuration options for ResearcherAgent */
export interface ResearcherAgentOptions {
  /** Agent's display name */
  name?: string;
  /** Custom personality description */
  personality?: string;
  /** Research depth preference */
  depth?: "quick" | "standard" | "deep";
}

/**
 * Researcher Agent — The analytical investigator.
 *
 * Specializes in:
 * - Information gathering and fact-checking
 * - Data analysis and trend identification
 * - Summarization and synthesis
 * - Competitive analysis and market research
 *
 * @example
 * ```typescript
 * const researcher = new ResearcherAgent({ name: "Kai", depth: "deep" });
 * house.addAgent(researcher);
 * ```
 */
export class ResearcherAgent extends Agent {
  readonly depth: string;

  constructor(options: ResearcherAgentOptions = {}) {
    const depth = options.depth ?? "standard";

    const config: AgentConfig = {
      name: options.name ?? "Researcher",
      role: "researcher",
      personality:
        options.personality ??
        "Curious, thorough, and analytical. Values accuracy over speed.",
      capabilities: [
        "research",
        "search",
        "find",
        "analyze",
        "investigate",
        "summarize",
        "compare",
        "trend",
        "data",
        "fact",
        "source",
        "reference",
        "study",
        "report",
        "insight",
      ],
      systemPrompt: `You are ${options.name ?? "Researcher"}, a meticulous AI researcher agent living in a shared AI agent house.

Your role is to:
- Gather and organize information on topics
- Analyze data and identify patterns
- Provide well-sourced insights
- Challenge assumptions with evidence
- Summarize complex topics clearly

Research depth: ${depth}
${depth === "deep" ? "Take extra time to explore edge cases and alternative viewpoints." : ""}
${depth === "quick" ? "Focus on key findings and main takeaways only." : ""}

When conducting research:
1. Define the research question clearly
2. Identify key sources and data points
3. Analyze findings for patterns and insights
4. Present a structured summary with key takeaways
5. Note any limitations or areas needing further investigation`,
    };

    super(config);
    this.depth = depth;
  }

  async processTask(
    task: string,
    context: BoardMessage[]
  ): Promise<string> {
    // Prompt ready for LLM integration: this.buildPrompt(task, context)

    const relatedDiscussions = context
      .filter((m) => m.type === "response")
      .slice(0, 3)
      .map((m) => `- ${m.authorName}: ${m.content.slice(0, 60)}`)
      .join("\n");

    return [
      `🔍 **${this.name}'s Research Brief**`,
      "",
      `**Research Question:** ${task}`,
      `**Depth:** ${this.depth}`,
      "",
      relatedDiscussions
        ? `**Related team discussions:**\n${relatedDiscussions}\n`
        : "",
      "**Key Areas to Investigate:**",
      "1. Current state and trends",
      "2. Key players and competitors",
      "3. Opportunities and risks",
      "4. Data-backed recommendations",
      "",
      "**Preliminary Findings:**",
      "- Further investigation needed with LLM integration",
      "- Will cross-reference with bulletin board context",
      "",
      `_Ready for LLM integration — connect a provider to enable full AI research capabilities._`,
    ]
      .filter(Boolean)
      .join("\n");
  }
}
