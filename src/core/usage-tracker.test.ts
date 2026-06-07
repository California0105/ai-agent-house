import { describe, it, expect, beforeEach } from "vitest";
import { UsageTracker } from "./usage-tracker.js";

describe("UsageTracker", () => {
  let tracker: UsageTracker;

  beforeEach(() => {
    tracker = new UsageTracker();
  });

  const makeEntry = (
    agentId: string,
    agentName: string,
    model: string,
    promptTokens: number,
    completionTokens: number
  ) => ({
    agentId,
    agentName,
    model,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    },
    timestamp: new Date(),
  });

  it("should record usage entries", () => {
    tracker.record(makeEntry("a1", "Aki", "gpt-4o", 100, 50));
    expect(tracker.count).toBe(1);
  });

  it("should calculate cost for known models", () => {
    const record = tracker.record(
      makeEntry("a1", "Aki", "gpt-4o", 1_000_000, 1_000_000)
    );
    // gpt-4o: $2.5/1M prompt, $10/1M completion
    expect(record.cost).toBeCloseTo(12.5);
  });

  it("should return undefined cost for unknown models", () => {
    const record = tracker.record(
      makeEntry("a1", "Aki", "unknown-model", 100, 50)
    );
    expect(record.cost).toBeUndefined();
  });

  it("should get records by agent", () => {
    tracker.record(makeEntry("a1", "Aki", "gpt-4o", 100, 50));
    tracker.record(makeEntry("a2", "Sora", "gpt-4o", 200, 100));
    tracker.record(makeEntry("a1", "Aki", "gpt-4o", 300, 150));

    const akiRecords = tracker.getByAgent("a1");
    expect(akiRecords).toHaveLength(2);
  });

  it("should aggregate total usage", () => {
    tracker.record(makeEntry("a1", "Aki", "gpt-4o", 100, 50));
    tracker.record(makeEntry("a2", "Sora", "gpt-4o", 200, 100));

    const total = tracker.getTotal();
    expect(total.promptTokens).toBe(300);
    expect(total.completionTokens).toBe(150);
    expect(total.totalTokens).toBe(450);
    expect(total.callCount).toBe(2);
  });

  it("should aggregate per-agent usage", () => {
    tracker.record(makeEntry("a1", "Aki", "gpt-4o", 100, 50));
    tracker.record(makeEntry("a1", "Aki", "gpt-4o", 200, 100));
    tracker.record(makeEntry("a2", "Sora", "gpt-4o", 300, 150));

    const akiTotal = tracker.getTotalByAgent("a1");
    expect(akiTotal.promptTokens).toBe(300);
    expect(akiTotal.callCount).toBe(2);
  });

  it("should generate summary by agent", () => {
    tracker.record(makeEntry("a1", "Aki", "gpt-4o", 100, 50));
    tracker.record(makeEntry("a2", "Sora", "gpt-4o", 200, 100));

    const summary = tracker.getSummaryByAgent();
    expect(summary.size).toBe(2);
    expect(summary.get("a1")?.agentName).toBe("Aki");
    expect(summary.get("a2")?.promptTokens).toBe(200);
  });

  it("should accept custom cost models", () => {
    const customTracker = new UsageTracker({
      "my-model": {
        promptCostPer1M: 1,
        completionCostPer1M: 2,
      },
    });

    const record = customTracker.record(
      makeEntry("a1", "Aki", "my-model", 1_000_000, 1_000_000)
    );
    expect(record.cost).toBeCloseTo(3.0);
  });

  it("should reset all records", () => {
    tracker.record(makeEntry("a1", "Aki", "gpt-4o", 100, 50));
    tracker.reset();
    expect(tracker.count).toBe(0);
    expect(tracker.getTotal().totalTokens).toBe(0);
  });
});
