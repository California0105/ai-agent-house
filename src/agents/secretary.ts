/**
 * ai-agent-house — Secretary Agent
 *
 * An agent specialized in organization, scheduling, and task management.
 * The Secretary keeps everything running smoothly in the house.
 * @module
 */

import { Agent } from "../core/agent.js";
import type { AgentConfig, BoardMessage } from "../core/types.js";

/** Configuration options for SecretaryAgent */
export interface SecretaryAgentOptions {
  /** Agent's display name */
  name?: string;
  /** Custom personality description */
  personality?: string;
}

/**
 * Secretary Agent — The organized coordinator.
 *
 * Specializes in:
 * - Schedule management and reminders
 * - Task tracking and prioritization
 * - Meeting notes and agendas
 * - Status reports and summaries
 *
 * @example
 * ```typescript
 * const secretary = new SecretaryAgent({ name: "Aki" });
 * house.addAgent(secretary);
 * ```
 */
export class SecretaryAgent extends Agent {
  constructor(options: SecretaryAgentOptions = {}) {
    const config: AgentConfig = {
      name: options.name ?? "Secretary",
      role: "secretary",
      personality:
        options.personality ??
        "Organized, efficient, detail-oriented, and proactive. Speaks clearly and concisely.",
      capabilities: [
        "schedule",
        "remind",
        "task",
        "plan",
        "organize",
        "meeting",
        "agenda",
        "priority",
        "deadline",
        "calendar",
        "todo",
        "status",
        "report",
        "summary",
      ],
      systemPrompt: `You are ${options.name ?? "Secretary"}, a highly organized AI secretary agent living in a shared AI agent house.

Your role is to:
- Organize and prioritize tasks for the household
- Track deadlines and schedules
- Create clear action items from discussions
- Summarize meetings and conversations
- Remind other agents of pending tasks

Communication style:
- Be concise and structured (use bullet points and numbered lists)
- Always include actionable next steps
- Flag urgent items clearly
- Use time-based language ("by tomorrow", "next week")

When responding to a discussion:
1. Identify the key tasks and decisions needed
2. Propose a structured plan with priorities
3. Assign responsibilities where appropriate
4. Set clear deadlines or milestones`,
    };

    super(config);
  }

  async processTask(
    task: string,
    context: BoardMessage[]
  ): Promise<string> {
    // Build a structured response based on the task
    // Prompt ready for LLM integration: this.buildPrompt(task, context)

    // In a real implementation, this would call the LLM
    // For now, return a structured placeholder that demonstrates the format
    const contextSummary = context
      .filter((m) => m.type !== "system")
      .slice(0, 5)
      .map((m) => `- ${m.authorName}: ${m.content.slice(0, 50)}`)
      .join("\n");

    return [
      `📋 **${this.name}'s Analysis**`,
      "",
      `**Task:** ${task}`,
      "",
      contextSummary
        ? `**Context reviewed:**\n${contextSummary}`
        : "",
      "",
      "**Action Items:**",
      "1. Analyze the requirements",
      "2. Break down into subtasks",
      "3. Assign priorities",
      "",
      `_Ready for LLM integration — connect a provider to enable full AI responses._`,
    ]
      .filter(Boolean)
      .join("\n");
  }
}
