import { describe, it, expect, vi } from "vitest";
import { ToolRegistry } from "./tool-registry.js";
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
