import { describe, it, expect, afterEach } from "vitest";
import { join } from "node:path";
import { rm, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { JsonFileMemoryProvider } from "./json-file-memory-provider.js";
import type { MemoryProvider } from "./memory-provider.js";

describe("JsonFileMemoryProvider", () => {
  let tempDir: string;
  let provider: MemoryProvider;

  // Use a fresh temp dir for each test file run
  const setup = async () => {
    tempDir = await mkdtemp(join(tmpdir(), "agent-house-test-"));
    provider = new JsonFileMemoryProvider(tempDir);
  };

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("should save and load a value", async () => {
    await setup();
    await provider.save("test", "key1", { hello: "world" });
    const value = await provider.load("test", "key1");
    expect(value).toEqual({ hello: "world" });
  });

  it("should return null for missing key", async () => {
    await setup();
    const value = await provider.load("test", "nonexistent");
    expect(value).toBeNull();
  });

  it("should overwrite existing value", async () => {
    await setup();
    await provider.save("test", "key1", "old");
    await provider.save("test", "key1", "new");
    const value = await provider.load("test", "key1");
    expect(value).toBe("new");
  });

  it("should delete a value", async () => {
    await setup();
    await provider.save("test", "key1", "value");
    await provider.delete("test", "key1");
    const value = await provider.load("test", "key1");
    expect(value).toBeNull();
  });

  it("should list keys in a namespace", async () => {
    await setup();
    await provider.save("test", "a", 1);
    await provider.save("test", "b", 2);
    await provider.save("test", "c", 3);
    const keys = await provider.list("test");
    expect(keys.sort()).toEqual(["a", "b", "c"]);
  });

  it("should clear a namespace", async () => {
    await setup();
    await provider.save("test", "key1", "value");
    await provider.clear("test");
    const keys = await provider.list("test");
    expect(keys).toEqual([]);
  });

  it("should handle separate namespaces", async () => {
    await setup();
    await provider.save("ns1", "key", "value1");
    await provider.save("ns2", "key", "value2");
    expect(await provider.load("ns1", "key")).toBe("value1");
    expect(await provider.load("ns2", "key")).toBe("value2");
  });

  it("should handle various value types", async () => {
    await setup();
    await provider.save("test", "string", "hello");
    await provider.save("test", "number", 42);
    await provider.save("test", "boolean", true);
    await provider.save("test", "null", null);
    await provider.save("test", "array", [1, 2, 3]);

    expect(await provider.load("test", "string")).toBe("hello");
    expect(await provider.load("test", "number")).toBe(42);
    expect(await provider.load("test", "boolean")).toBe(true);
    expect(await provider.load("test", "null")).toBeNull();
    expect(await provider.load("test", "array")).toEqual([1, 2, 3]);
  });
});
