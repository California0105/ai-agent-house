/**
 * ai-agent-house — Tool System
 *
 * Interface and types for tools that agents can use.
 * @module
 */

/**
 * Parameter definition for a tool.
 */
export interface ToolParameter {
  /** Parameter type */
  type: "string" | "number" | "boolean" | "object" | "array";
  /** Human-readable description */
  description: string;
  /** Whether this parameter is required */
  required?: boolean;
  /** Default value */
  default?: unknown;
}

/**
 * Interface for a tool that an agent can invoke.
 *
 * @example
 * ```typescript
 * const httpTool: Tool = {
 *   name: "http_request",
 *   description: "Make an HTTP request",
 *   parameters: {
 *     url: { type: "string", description: "URL to fetch", required: true },
 *     method: { type: "string", description: "HTTP method", default: "GET" },
 *   },
 *   execute: async (params) => {
 *     const res = await fetch(params.url as string);
 *     return await res.text();
 *   },
 * };
 * ```
 */
export interface Tool {
  /** Unique tool name (snake_case) */
  name: string;
  /** Human-readable description of what the tool does */
  description: string;
  /** Parameter definitions */
  parameters: Record<string, ToolParameter>;
  /**
   * Execute the tool with the given parameters.
   *
   * @param params - Key-value parameters
   * @returns The tool's output as a string
   */
  execute(params: Record<string, unknown>): Promise<string>;
}

/**
 * Serialize tool definitions for LLM function-calling prompts.
 */
export function toolsToPrompt(tools: Tool[]): string {
  if (tools.length === 0) return "";

  const descriptions = tools.map((tool) => {
    const params = Object.entries(tool.parameters)
      .map(([name, param]) => {
        const req = param.required ? " (required)" : "";
        const def =
          param.default !== undefined
            ? ` [default: ${JSON.stringify(param.default)}]`
            : "";
        return `    - ${name}: ${param.type} — ${param.description}${req}${def}`;
      })
      .join("\n");

    return `  ${tool.name}: ${tool.description}\n    Parameters:\n${params}`;
  });

  return [
    "## Available Tools",
    "You can use the following tools by responding with a JSON block:",
    '```json\n{"tool": "tool_name", "params": {"key": "value"}}\n```',
    "",
    ...descriptions,
  ].join("\n");
}

/**
 * Parse a tool call from LLM output.
 * Returns null if no tool call is found.
 */
export function parseToolCall(
  text: string
): { tool: string; params: Record<string, unknown> } | null {
  // Try to find a JSON block with tool call
  const jsonMatch = text.match(
    /```(?:json)?\s*\n?\s*(\{[\s\S]*?"tool"\s*:[\s\S]*?\})\s*\n?\s*```/
  );

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]) as {
        tool: string;
        params?: Record<string, unknown>;
      };
      if (parsed.tool && typeof parsed.tool === "string") {
        return {
          tool: parsed.tool,
          params: parsed.params ?? {},
        };
      }
    } catch {
      // Invalid JSON, fall through
    }
  }

  // Try inline JSON (handles one level of nesting for params)
  const inlineMatch = text.match(
    /\{"tool"\s*:\s*"[^"]+"\s*(?:,\s*"params"\s*:\s*\{[^}]*\})?\s*\}/
  );
  if (inlineMatch) {
    try {
      const parsed = JSON.parse(inlineMatch[0]) as {
        tool: string;
        params?: Record<string, unknown>;
      };
      if (parsed.tool && typeof parsed.tool === "string") {
        return {
          tool: parsed.tool,
          params: parsed.params ?? {},
        };
      }
    } catch {
      // Invalid JSON
    }
  }

  return null;
}
