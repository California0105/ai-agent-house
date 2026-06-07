/**
 * ai-agent-house — HTTP Tool
 *
 * A tool for making HTTP requests using the built-in fetch API.
 * @module
 */

import type { Tool } from "./tool.js";
import { ToolError } from "../core/errors.js";

/**
 * HTTP request tool.
 *
 * Allows agents to make HTTP GET/POST requests.
 */
export const httpTool: Tool = {
  name: "http_request",
  description:
    "Make an HTTP request to a URL and return the response body as text.",
  parameters: {
    url: {
      type: "string",
      description: "The URL to request",
      required: true,
    },
    method: {
      type: "string",
      description: "HTTP method (GET, POST, PUT, DELETE)",
      default: "GET",
    },
    body: {
      type: "string",
      description: "Request body (for POST/PUT)",
    },
    headers: {
      type: "object",
      description: "Additional HTTP headers as key-value pairs",
    },
  },
  async execute(params) {
    const url = params.url as string | undefined;
    if (!url) {
      throw new ToolError("http_request", "URL is required");
    }

    const method = (params.method as string) ?? "GET";
    const body = params.body as string | undefined;
    const headers = params.headers as
      | Record<string, string>
      | undefined;

    try {
      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers: {
          "User-Agent": "ai-agent-house/0.1",
          ...headers,
        },
        ...(body ? { body } : {}),
      });

      const text = await response.text();

      if (!response.ok) {
        return JSON.stringify({
          error: true,
          status: response.status,
          statusText: response.statusText,
          body: text.slice(0, 2000),
        });
      }

      // Truncate very long responses
      return text.length > 10_000
        ? text.slice(0, 10_000) + "\n\n[... truncated]"
        : text;
    } catch (error) {
      throw new ToolError(
        "http_request",
        error instanceof Error ? error.message : String(error)
      );
    }
  },
};
