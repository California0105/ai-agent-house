/**
 * ai-agent-house — Tool Registry
 *
 * Central registry for managing available tools.
 * @module
 */

import type { Tool } from "./tool.js";

/**
 * Registry for managing tools available to agents.
 *
 * @example
 * ```typescript
 * const registry = new ToolRegistry();
 * registry.register(httpTool);
 * registry.register(fileReaderTool);
 *
 * const tool = registry.get("http_request");
 * const result = await tool.execute({ url: "https://example.com" });
 * ```
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * Register a tool.
   *
   * @throws Error if a tool with the same name already exists
   */
  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(
        `Tool "${tool.name}" is already registered`
      );
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name.
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Check if a tool is registered.
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get all registered tools.
   */
  list(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Remove a tool by name.
   */
  remove(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Number of registered tools.
   */
  get size(): number {
    return this.tools.size;
  }
}
