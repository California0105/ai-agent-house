/**
 * ai-agent-house — Usage Tracker
 *
 * Tracks token usage and costs across agents and discussions.
 * @module
 */

import type { TokenUsage } from "../providers/provider.js";

// ─── Types ──────────────────────────────────────────────────

/** A single usage record from an LLM call */
export interface UsageRecord {
  /** Agent that made the call */
  agentId: string;
  /** Agent name */
  agentName: string;
  /** Model used */
  model: string;
  /** Token usage breakdown */
  usage: TokenUsage;
  /** Estimated cost in USD (if cost model configured) */
  cost?: number;
  /** Timestamp of the call */
  timestamp: Date;
}

/** Aggregated usage summary */
export interface UsageSummary {
  /** Total prompt tokens */
  promptTokens: number;
  /** Total completion tokens */
  completionTokens: number;
  /** Total tokens */
  totalTokens: number;
  /** Total estimated cost */
  totalCost: number;
  /** Number of LLM calls */
  callCount: number;
}

/** Cost-per-token configuration for a model */
export interface ModelCost {
  /** Cost per 1M prompt tokens in USD */
  promptCostPer1M: number;
  /** Cost per 1M completion tokens in USD */
  completionCostPer1M: number;
}

// ─── Default Costs ──────────────────────────────────────────

/** Default cost models for common LLM models (USD per 1M tokens) */
const DEFAULT_MODEL_COSTS: Record<string, ModelCost> = {
  "gpt-4o": { promptCostPer1M: 2.5, completionCostPer1M: 10 },
  "gpt-4o-mini": { promptCostPer1M: 0.15, completionCostPer1M: 0.6 },
  "gpt-4.1": { promptCostPer1M: 2, completionCostPer1M: 8 },
  "gpt-4.1-mini": { promptCostPer1M: 0.4, completionCostPer1M: 1.6 },
  "gpt-4.1-nano": { promptCostPer1M: 0.1, completionCostPer1M: 0.4 },
  "claude-sonnet-4-20250514": { promptCostPer1M: 3, completionCostPer1M: 15 },
  "claude-opus-4-20250514": { promptCostPer1M: 15, completionCostPer1M: 75 },
  "gemini-2.5-flash": { promptCostPer1M: 0.15, completionCostPer1M: 0.6 },
  "gemini-2.5-pro": { promptCostPer1M: 1.25, completionCostPer1M: 10 },
};

// ─── Usage Tracker ──────────────────────────────────────────

/**
 * Tracks token usage and costs for LLM calls.
 *
 * @example
 * ```typescript
 * const tracker = new UsageTracker();
 * tracker.record({
 *   agentId: "agent-1",
 *   agentName: "Aki",
 *   model: "gpt-4o",
 *   usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
 *   timestamp: new Date(),
 * });
 * console.log(tracker.getTotal());
 * ```
 */
export class UsageTracker {
  private records: UsageRecord[] = [];
  private readonly modelCosts: Record<string, ModelCost>;

  constructor(customCosts?: Record<string, ModelCost>) {
    this.modelCosts = { ...DEFAULT_MODEL_COSTS, ...customCosts };
  }

  /**
   * Record a usage entry.
   * Cost is automatically calculated if a cost model is available.
   */
  record(entry: Omit<UsageRecord, "cost">): UsageRecord {
    const cost = this.calculateCost(entry.model, entry.usage);
    const record: UsageRecord = { ...entry, cost };
    this.records.push(record);
    return record;
  }

  /**
   * Get usage records for a specific agent.
   */
  getByAgent(agentId: string): UsageRecord[] {
    return this.records.filter((r) => r.agentId === agentId);
  }

  /**
   * Get aggregated usage totals.
   */
  getTotal(): UsageSummary {
    return this.aggregate(this.records);
  }

  /**
   * Get aggregated usage for a specific agent.
   */
  getTotalByAgent(agentId: string): UsageSummary {
    return this.aggregate(this.getByAgent(agentId));
  }

  /**
   * Get all usage records.
   */
  getRecords(): UsageRecord[] {
    return [...this.records];
  }

  /**
   * Get a summary per agent.
   */
  getSummaryByAgent(): Map<string, UsageSummary & { agentName: string }> {
    const agents = new Map<string, UsageRecord[]>();

    for (const record of this.records) {
      const existing = agents.get(record.agentId) ?? [];
      existing.push(record);
      agents.set(record.agentId, existing);
    }

    const result = new Map<
      string,
      UsageSummary & { agentName: string }
    >();
    for (const [agentId, records] of agents) {
      const summary = this.aggregate(records);
      const agentName = records[0]?.agentName ?? agentId;
      result.set(agentId, { ...summary, agentName });
    }

    return result;
  }

  /** Clear all usage records */
  reset(): void {
    this.records = [];
  }

  /** Number of recorded calls */
  get count(): number {
    return this.records.length;
  }

  // ─── Private ────────────────────────────────────────────

  private calculateCost(
    model: string,
    usage: TokenUsage
  ): number | undefined {
    const costs = this.modelCosts[model];
    if (!costs) return undefined;

    const promptCost =
      (usage.promptTokens / 1_000_000) * costs.promptCostPer1M;
    const completionCost =
      (usage.completionTokens / 1_000_000) * costs.completionCostPer1M;

    return promptCost + completionCost;
  }

  private aggregate(records: UsageRecord[]): UsageSummary {
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;
    let totalCost = 0;

    for (const record of records) {
      promptTokens += record.usage.promptTokens;
      completionTokens += record.usage.completionTokens;
      totalTokens += record.usage.totalTokens;
      totalCost += record.cost ?? 0;
    }

    return {
      promptTokens,
      completionTokens,
      totalTokens,
      totalCost,
      callCount: records.length,
    };
  }
}
