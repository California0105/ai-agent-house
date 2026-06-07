import { describe, it, expect, vi, beforeEach } from "vitest";
import { SharedMemory } from "./shared-memory.js";

describe("SharedMemory", () => {
  let memory: SharedMemory;

  beforeEach(() => {
    memory = new SharedMemory();
  });

  it("should set and get a value", () => {
    memory.set("key1", "value1");
    expect(memory.get("key1")).toBe("value1");
  });

  it("should return undefined for missing key", () => {
    expect(memory.get("nonexistent")).toBeUndefined();
  });

  it("should support typed get", () => {
    memory.set("count", 42);
    const value = memory.get<number>("count");
    expect(value).toBe(42);
  });

  it("should store complex objects", () => {
    const data = { sections: ["intro", "body"], draft: true };
    memory.set("outline", data);
    expect(memory.get("outline")).toEqual(data);
  });

  it("should check existence with has()", () => {
    memory.set("exists", true);
    expect(memory.has("exists")).toBe(true);
    expect(memory.has("nope")).toBe(false);
  });

  it("should delete a key", () => {
    memory.set("key1", "value1");
    expect(memory.delete("key1")).toBe(true);
    expect(memory.has("key1")).toBe(false);
    expect(memory.delete("key1")).toBe(false);
  });

  it("should list all keys", () => {
    memory.set("a", 1);
    memory.set("b", 2);
    memory.set("c", 3);
    expect(memory.keys()).toEqual(["a", "b", "c"]);
  });

  it("should track size", () => {
    expect(memory.size).toBe(0);
    memory.set("a", 1);
    memory.set("b", 2);
    expect(memory.size).toBe(2);
  });

  it("should clear all entries", () => {
    memory.set("a", 1);
    memory.set("b", 2);
    memory.clear();
    expect(memory.size).toBe(0);
    expect(memory.keys()).toEqual([]);
  });

  it("should create a snapshot", () => {
    memory.set("x", 10);
    memory.set("y", "hello");
    const snap = memory.snapshot();
    expect(snap).toEqual({ x: 10, y: "hello" });
  });

  it("should load from a plain object", () => {
    memory.set("old", "data");
    memory.load({ a: 1, b: "two" });
    expect(memory.size).toBe(2);
    expect(memory.get("a")).toBe(1);
    expect(memory.has("old")).toBe(false);
  });

  describe("onChange listeners", () => {
    it("should notify on set", () => {
      const listener = vi.fn();
      memory.onChange(listener);
      memory.set("key", "value");
      expect(listener).toHaveBeenCalledWith("key", "value", undefined);
    });

    it("should notify on update with old value", () => {
      const listener = vi.fn();
      memory.set("key", "old");
      memory.onChange(listener);
      memory.set("key", "new");
      expect(listener).toHaveBeenCalledWith("key", "new", "old");
    });

    it("should notify on delete", () => {
      const listener = vi.fn();
      memory.set("key", "value");
      memory.onChange(listener);
      memory.delete("key");
      expect(listener).toHaveBeenCalledWith("key", undefined, "value");
    });

    it("should support unsubscribe", () => {
      const listener = vi.fn();
      const unsubscribe = memory.onChange(listener);
      memory.set("a", 1);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      memory.set("b", 2);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
