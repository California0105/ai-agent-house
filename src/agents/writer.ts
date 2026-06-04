/**
 * ai-agent-house — Writer Agent
 *
 * An agent specialized in content creation, copywriting, and documentation.
 * @module
 */

import { Agent } from "../core/agent.js";
import type { AgentConfig, BoardMessage } from "../core/types.js";

/** Configuration options for WriterAgent */
export interface WriterAgentOptions {
  /** Agent's display name */
  name?: string;
  /** Custom personality description */
  personality?: string;
  /** Writing style preference */
  style?: "formal" | "casual" | "creative" | "technical";
}

/**
 * Writer Agent — The creative communicator.
 *
 * Specializes in:
 * - Blog posts and articles
 * - Social media content (Twitter/X, note, Zenn)
 * - Documentation and README files
 * - Email drafts and announcements
 *
 * @example
 * ```typescript
 * const writer = new WriterAgent({ name: "Sora", style: "creative" });
 * house.addAgent(writer);
 * ```
 */
export class WriterAgent extends Agent {
  readonly style: string;

  constructor(options: WriterAgentOptions = {}) {
    const style = options.style ?? "casual";
    const styleGuide = {
      formal:
        "Professional, polished, and authoritative. Use proper grammar and structured paragraphs.",
      casual:
        "Friendly, approachable, and conversational. Use emoji occasionally and keep it fun.",
      creative:
        "Imaginative, vivid, and engaging. Use metaphors, storytelling, and emotional hooks.",
      technical:
        "Precise, clear, and well-structured. Include code examples and technical details.",
    };

    const config: AgentConfig = {
      name: options.name ?? "Writer",
      role: "writer",
      personality:
        options.personality ??
        `Creative, articulate, and versatile. Writing style: ${style}.`,
      capabilities: [
        "write",
        "blog",
        "post",
        "article",
        "content",
        "copy",
        "tweet",
        "documentation",
        "readme",
        "email",
        "draft",
        "edit",
        "proofread",
        "sns",
        "social",
      ],
      systemPrompt: `You are ${options.name ?? "Writer"}, a talented AI writer agent living in a shared AI agent house.

Your role is to:
- Create compelling content based on topics and briefs
- Adapt your writing style to different platforms and audiences
- Collaborate with other agents to refine content
- Proofread and improve text quality

Writing style: ${styleGuide[style]}

When creating content:
1. Understand the target audience and platform
2. Create an engaging hook/opening
3. Structure content for readability
4. Include a clear call-to-action when appropriate
5. Suggest relevant hashtags for social media posts`,
    };

    super(config);
    this.style = style;
  }

  async processTask(
    task: string,
    context: BoardMessage[]
  ): Promise<string> {
    // Prompt ready for LLM integration: this.buildPrompt(task, context)

    const contextNotes = context
      .filter((m) => m.type === "response")
      .slice(0, 3)
      .map((m) => `- ${m.authorName} suggested: ${m.content.slice(0, 60)}`)
      .join("\n");

    return [
      `✍️ **${this.name}'s Draft**`,
      "",
      `**Topic:** ${task}`,
      `**Style:** ${this.style}`,
      "",
      contextNotes
        ? `**Building on team input:**\n${contextNotes}\n`
        : "",
      "**Draft:**",
      `Here's my take on "${task.slice(0, 50)}..."`,
      "",
      "I would structure this as:",
      "- **Hook**: Attention-grabbing opening",
      "- **Body**: Key points with supporting details",
      "- **CTA**: Clear call-to-action",
      "",
      `_Ready for LLM integration — connect a provider to enable full AI-generated content._`,
    ]
      .filter(Boolean)
      .join("\n");
  }
}
