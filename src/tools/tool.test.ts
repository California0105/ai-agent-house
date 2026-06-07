import { describe, it, expect, vi } from "vitest";
import { ToolRegistry } from "./tool-registry.js";
import { toolsToPrompt, parseToolCall } from "./tool.js";
import type { Tool } from "./tool.js";
import { createWebSearchTool } from "./web-search-tool.js";

const mockTool: Tool = {
  name: "mock_tool",
  description: "A mock tool for testing",
  parameters: {
    input: {
      type: "string",
      description: "Test input",
      required: true,
    },
  },
  execute: vi.fn().mockResolvedValue("mock result"),
};

describe("ToolRegistry", () => {
  it("should register and retrieve a tool", () => {
    const registry = new ToolRegistry();
    registry.register(mockTool);
    expect(registry.get("mock_tool")).toBe(mockTool);
    expect(registry.has("mock_tool")).toBe(true);
    expect(registry.size).toBe(1);
  });

  it("should throw on duplicate registration", () => {
    const registry = new ToolRegistry();
    registry.register(mockTool);
    expect(() => registry.register(mockTool)).toThrow("already registered");
  });

  it("should list all tools", () => {
    const registry = new ToolRegistry();
    registry.register(mockTool);
    const tools = registry.list();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe("mock_tool");
  });

  it("should remove a tool", () => {
    const registry = new ToolRegistry();
    registry.register(mockTool);
    expect(registry.remove("mock_tool")).toBe(true);
    expect(registry.has("mock_tool")).toBe(false);
    expect(registry.remove("mock_tool")).toBe(false);
  });
});

describe("toolsToPrompt", () => {
  it("should return empty string for no tools", () => {
    expect(toolsToPrompt([])).toBe("");
  });

  it("should generate prompt with tool descriptions", () => {
    const prompt = toolsToPrompt([mockTool]);
    expect(prompt).toContain("mock_tool");
    expect(prompt).toContain("A mock tool for testing");
    expect(prompt).toContain("input");
    expect(prompt).toContain("(required)");
  });
});

describe("parseToolCall", () => {
  it("should parse JSON block with tool call", () => {
    const text = 'Some text\n```json\n{"tool": "http_request", "params": {"url": "https://example.com"}}\n```';
    const result = parseToolCall(text);
    expect(result).toEqual({
      tool: "http_request",
      params: { url: "https://example.com" },
    });
  });

  it("should parse without params", () => {
    const text = '```json\n{"tool": "file_reader"}\n```';
    const result = parseToolCall(text);
    expect(result).toEqual({
      tool: "file_reader",
      params: {},
    });
  });

  it("should return null for no tool call", () => {
    const text = "Just a normal response without any tool calls.";
    expect(parseToolCall(text)).toBeNull();
  });

  it("should handle inline JSON", () => {
    const text = 'I will use {"tool": "web_search", "params": {"query": "test"}} to find info.';
    const result = parseToolCall(text);
    expect(result).toEqual({
      tool: "web_search",
      params: { query: "test" },
    });
  });
});

describe("createWebSearchTool", () => {
  it("should create a tool with a search provider", async () => {
    const provider = {
      search: vi.fn().mockResolvedValue("Result 1\nResult 2"),
    };

    const tool = createWebSearchTool(provider);
    expect(tool.name).toBe("web_search");

    const result = await tool.execute({ query: "test query" });
    expect(result).toBe("Result 1\nResult 2");
    expect(provider.search).toHaveBeenCalledWith("test query", 5);
  });

  it("should throw ToolError for missing query", async () => {
    const provider = { search: vi.fn() };
    const tool = createWebSearchTool(provider);
    await expect(tool.execute({})).rejects.toThrow("query is required");
  });
});
