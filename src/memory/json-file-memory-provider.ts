/**
 * ai-agent-house — JSON File Memory Provider
 *
 * Persistent storage using JSON files. No external dependencies.
 * Each namespace is stored as a separate JSON file.
 * @module
 */

import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import type { MemoryProvider } from "./memory-provider.js";
import { MemoryError } from "../core/errors.js";

/**
 * JSON File Memory Provider.
 *
 * Stores data as JSON files on disk. Each namespace gets its own file.
 * Suitable for development and small-scale usage.
 *
 * @example
 * ```typescript
 * const provider = new JsonFileMemoryProvider("./agent-data");
 * await provider.save("shared-memory", "key1", { hello: "world" });
 * ```
 */
export class JsonFileMemoryProvider implements MemoryProvider {
  private readonly baseDir: string;
  private initialized = false;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  async save(
    namespace: string,
    key: string,
    value: unknown
  ): Promise<void> {
    await this.ensureDir();
    const data = await this.loadNamespace(namespace);
    data[key] = value;
    await this.saveNamespace(namespace, data);
  }

  async load(
    namespace: string,
    key: string
  ): Promise<unknown | null> {
    const data = await this.loadNamespace(namespace);
    return data[key] ?? null;
  }

  async delete(namespace: string, key: string): Promise<void> {
    const data = await this.loadNamespace(namespace);
    delete data[key];
    await this.saveNamespace(namespace, data);
  }

  async list(namespace: string): Promise<string[]> {
    const data = await this.loadNamespace(namespace);
    return Object.keys(data);
  }

  async clear(namespace: string): Promise<void> {
    await this.ensureDir();
    const filePath = this.getFilePath(namespace);
    try {
      await unlink(filePath);
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw new MemoryError(
          `Failed to clear namespace "${namespace}": ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  // ─── Private ────────────────────────────────────────────

  private getFilePath(namespace: string): string {
    // Sanitize namespace for use as filename
    const safe = namespace.replace(/[^a-zA-Z0-9_-]/g, "_");
    return join(this.baseDir, `${safe}.json`);
  }

  private async ensureDir(): Promise<void> {
    if (this.initialized) return;
    try {
      await mkdir(this.baseDir, { recursive: true });
      this.initialized = true;
    } catch (error) {
      throw new MemoryError(
        `Failed to create storage directory: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async loadNamespace(
    namespace: string
  ): Promise<Record<string, unknown>> {
    await this.ensureDir();
    const filePath = this.getFilePath(namespace);
    try {
      const content = await readFile(filePath, "utf-8");
      return JSON.parse(content) as Record<string, unknown>;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return {};
      }
      throw new MemoryError(
        `Failed to read namespace "${namespace}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async saveNamespace(
    namespace: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const filePath = this.getFilePath(namespace);
    try {
      await writeFile(
        filePath,
        JSON.stringify(data, null, 2),
        "utf-8"
      );
    } catch (error) {
      throw new MemoryError(
        `Failed to save namespace "${namespace}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
