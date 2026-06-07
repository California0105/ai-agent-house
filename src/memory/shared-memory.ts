/**
 * ai-agent-house — Shared Memory (Key-Value State Store)
 *
 * A simple key-value store for sharing state between agents.
 * Unlike the BulletinBoard (message log), SharedMemory provides
 * direct read/write access to named values.
 * @module
 */

/**
 * Shared Memory — Key-value state store for inter-agent communication.
 *
 * Agents can use SharedMemory to share structured state:
 * flags, counters, partial results, configuration, etc.
 *
 * @example
 * ```typescript
 * const memory = new SharedMemory();
 *
 * memory.set("research_complete", true);
 * memory.set("draft_version", 2);
 * memory.set("outline", { sections: ["intro", "body", "conclusion"] });
 *
 * if (memory.get<boolean>("research_complete")) {
 *   // proceed to writing phase
 * }
 * ```
 */
export class SharedMemory {
  private store: Map<string, unknown> = new Map();

  /** Change listeners */
  private listeners: Array<
    (key: string, value: unknown, oldValue: unknown) => void
  > = [];

  /**
   * Set a value in shared memory.
   *
   * @param key - The key to store under
   * @param value - The value to store (must be serializable)
   */
  set<T>(key: string, value: T): void {
    const oldValue = this.store.get(key);
    this.store.set(key, value);
    this.notifyListeners(key, value, oldValue);
  }

  /**
   * Get a value from shared memory.
   *
   * @param key - The key to retrieve
   * @returns The value, or undefined if not found
   */
  get<T>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  /**
   * Check if a key exists in shared memory.
   */
  has(key: string): boolean {
    return this.store.has(key);
  }

  /**
   * Delete a key from shared memory.
   *
   * @returns true if the key existed and was deleted
   */
  delete(key: string): boolean {
    const oldValue = this.store.get(key);
    const deleted = this.store.delete(key);
    if (deleted) {
      this.notifyListeners(key, undefined, oldValue);
    }
    return deleted;
  }

  /**
   * Get all keys in shared memory.
   */
  keys(): string[] {
    return Array.from(this.store.keys());
  }

  /**
   * Get the number of entries in shared memory.
   */
  get size(): number {
    return this.store.size;
  }

  /**
   * Clear all entries from shared memory.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get a snapshot of all entries as a plain object.
   * Useful for serialization or debugging.
   */
  snapshot(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of this.store) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Load entries from a plain object.
   * Replaces all current entries.
   */
  load(data: Record<string, unknown>): void {
    this.store.clear();
    for (const [key, value] of Object.entries(data)) {
      this.store.set(key, value);
    }
  }

  /**
   * Register a listener for changes.
   * Returns an unsubscribe function.
   */
  onChange(
    listener: (key: string, value: unknown, oldValue: unknown) => void
  ): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(
    key: string,
    value: unknown,
    oldValue: unknown
  ): void {
    for (const listener of this.listeners) {
      listener(key, value, oldValue);
    }
  }
}
