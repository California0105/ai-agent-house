/**
 * ai-agent-house — HTTP Tool
 *
 * A tool for making HTTP requests using the built-in fetch API.
 * @module
 */

import type { Tool } from "./tool.js";
import { ToolError } from "../core/errors.js";

/**
 * Validates URLs to prevent SSRF against localhost, private IPs, and metadata endpoints.
 */
function isBlockedUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname;
    const blockedPatterns = [
      /^localhost$/, /^127\.\d+\.\d+\.\d+$/, /^::1$/, 
      /^169\.254\.\d+\.\d+$/, /^10\.\d+\.\d+\.\d+$/, 
      /^192\.168\.\d+\.\d+$/, /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/
    ];
    return blockedPatterns.some(pattern => pattern.test(hostname));
  } catch {
    return true; // Block invalid URLs
  }
}

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

    if (isBlockedUrl(url)) {
      throw new ToolError("http_request", "Access denied: Request to internal or metadata network is forbidden");
    }

    const method = (params.method as string) ?? "GET";
    const body = params.body as string | undefined;
    const headers = params.headers as
      | Record<string, string>
      | undefined;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: method.toUpperCase(),
        signal: controller.signal,
        headers: {
          "User-Agent": "ai-agent-house/0.1",
          ...headers,
        },
        ...(body ? { body } : {}),
      });

      clearTimeout(timeoutId);

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
