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


