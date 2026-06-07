/**
 * ai-agent-house — Web Search Tool
 *
 * A pluggable web search tool. Users inject their own search provider.
 * @module
 */

import type { Tool } from "./tool.js";
import { ToolError } from "../core/errors.js";

/**
 * Interface for a web search provider.
 * Implement this to connect to your preferred search API.
 *
 * @example
 * ```typescript
 * const serperProvider: WebSearchProvider = {
 *   search: async (query) => {
 *     const res = await fetch("https://google.serper.dev/search", {
 *       method: "POST",
 *       headers: {
 *         "X-API-KEY": process.env.SERPER_API_KEY!,
 *         "Content-Type": "application/json",
 *       },
 *       body: JSON.stringify({ q: query }),
 *     });
 *     const data = await res.json();
 *     return data.organic.map(r => `${r.title}: ${r.snippet} (${r.link})`).join("\n");
 *   },
 * };
 * ```
 */
export interface WebSearchProvider {
  search(query: string, maxResults?: number): Promise<string>;
}

/**
 * Create a web search tool with the given search provider.
 *
 * @param provider - The search provider implementation
 * @returns A Tool that can be registered with agents
 */
export function createWebSearchTool(
  provider: WebSearchProvider
): Tool {
  return {
    name: "web_search",
    description:
      "Search the web for information. Returns relevant search results.",
    parameters: {
      query: {
        type: "string",
        description: "The search query",
        required: true,
      },
      maxResults: {
        type: "number",
        description: "Maximum number of results",
        default: 5,
      },
    },
    async execute(params) {
      const query = params.query as string | undefined;
      if (!query) {
        throw new ToolError("web_search", "Search query is required");
      }

      const maxResults = (params.maxResults as number) ?? 5;

      try {
        return await provider.search(query, maxResults);
      } catch (error) {
        throw new ToolError(
          "web_search",
          error instanceof Error ? error.message : String(error)
        );
      }
    },
  };
}
