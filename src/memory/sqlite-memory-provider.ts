/**
 * ai-agent-house — SQLite Memory Provider
 *
 * Persistent storage using SQLite via better-sqlite3.
 * This is an optional dependency — install `better-sqlite3` to use.
 * @module
 */

import type { MemoryProvider } from "./memory-provider.js";
import { MemoryError } from "../core/errors.js";

/**
 * SQLite Memory Provider.
 *
 * Uses `better-sqlite3` for high-performance local persistence.
 * Install with: `npm install better-sqlite3`
 *
 * @example
 * ```typescript
 * const provider = new SqliteMemoryProvider("./agent-house.db");
 * await provider.save("shared-memory", "key1", { hello: "world" });
 * ```
 */
export class SqliteMemoryProvider implements MemoryProvider {
   
  private db: any = null;
  private readonly dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

   
  private async getDb(): Promise<any> {
    if (this.db) return this.db;

    try {
      const { importModule } = await import("../core/import-helper.js");
      const module = await importModule("better-sqlite3");
      const Database = module.default ?? module;
      this.db = new Database(this.dbPath);

      // Create table if not exists
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS memory (
          namespace TEXT NOT NULL,
          key TEXT NOT NULL,
          value TEXT NOT NULL,
          updated_at TEXT DEFAULT (datetime('now')),
          PRIMARY KEY (namespace, key)
        )
      `);

      return this.db;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("Cannot find module") ||
          error.message.includes("MODULE_NOT_FOUND"))
      ) {
        throw new MemoryError(
          'SQLite provider requires "better-sqlite3". Install with: npm install better-sqlite3'
        );
      }
      throw new MemoryError(
        `Failed to initialize SQLite: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async save(
    namespace: string,
    key: string,
    value: unknown
  ): Promise<void> {
    const db = await this.getDb();
    const serialized = JSON.stringify(value);
    db.prepare(
      `INSERT OR REPLACE INTO memory (namespace, key, value, updated_at) VALUES (?, ?, ?, datetime('now'))`
    ).run(namespace, key, serialized);
  }

  async load(
    namespace: string,
    key: string
  ): Promise<unknown | null> {
    const db = await this.getDb();
    const row = db
      .prepare(`SELECT value FROM memory WHERE namespace = ? AND key = ?`)
      .get(namespace, key) as { value: string } | undefined;

    if (!row) return null;

    try {
      return JSON.parse(row.value) as unknown;
    } catch {
      return row.value;
    }
  }

  async delete(namespace: string, key: string): Promise<void> {
    const db = await this.getDb();
    db.prepare(
      `DELETE FROM memory WHERE namespace = ? AND key = ?`
    ).run(namespace, key);
  }

  async list(namespace: string): Promise<string[]> {
    const db = await this.getDb();
    const rows = db
      .prepare(`SELECT key FROM memory WHERE namespace = ?`)
      .all(namespace) as Array<{ key: string }>;
    return rows.map((r) => r.key);
  }

  async clear(namespace: string): Promise<void> {
    const db = await this.getDb();
    db.prepare(`DELETE FROM memory WHERE namespace = ?`).run(
      namespace
    );
  }

  /**
   * Close the database connection.
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
