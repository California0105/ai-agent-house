/**
 * ai-agent-house — Memory Provider Interface
 *
 * Abstract interface for persistent memory storage.
 * Implementations can use SQLite, JSON files, Redis, etc.
 * @module
 */

/**
 * Interface for persistent memory storage.
 *
 * Data is organized by namespace (e.g., "agent-state", "shared-memory").
 * Each namespace contains key-value pairs.
 *
 * @example
 * ```typescript
 * const provider = new JsonFileMemoryProvider("./data");
 * await provider.save("shared", "research_complete", true);
 * const val = await provider.load("shared", "research_complete");
 * ```
 */
export interface MemoryProvider {
  /**
   * Save a value under a namespace and key.
   */
  save(
    namespace: string,
    key: string,
    value: unknown
  ): Promise<void>;

  /**
   * Load a value by namespace and key.
   * Returns null if not found.
   */
  load(namespace: string, key: string): Promise<unknown | null>;

  /**
   * Delete a value by namespace and key.
   */
  delete(namespace: string, key: string): Promise<void>;

  /**
   * List all keys in a namespace.
   */
  list(namespace: string): Promise<string[]>;

  /**
   * Clear all entries in a namespace.
   */
  clear(namespace: string): Promise<void>;
}
