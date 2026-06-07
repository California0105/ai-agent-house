/**
 * ai-agent-house — File Reader Tool
 *
 * A tool for reading file contents from the local filesystem.
 * @module
 */

import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { Tool } from "./tool.js";
import { ToolError } from "../core/errors.js";

/** Maximum file size to read (1MB) */
const MAX_FILE_SIZE = 1_048_576;

/**
 * File reader tool.
 *
 * Allows agents to read text files from the filesystem.
 */
export const fileReaderTool: Tool = {
  name: "file_reader",
  description:
    "Read the contents of a text file from the local filesystem.",
  parameters: {
    path: {
      type: "string",
      description: "Absolute or relative path to the file",
      required: true,
    },
    encoding: {
      type: "string",
      description: "File encoding",
      default: "utf-8",
    },
  },
  async execute(params) {
    const requestedPath = params.path as string | undefined;
    if (!requestedPath) {
      throw new ToolError("file_reader", "File path is required");
    }

    const allowedBaseDir = process.cwd();
    const absolutePath = path.resolve(allowedBaseDir, requestedPath);
    if (!absolutePath.startsWith(allowedBaseDir)) {
      throw new ToolError("file_reader", "Access denied: Path is outside the allowed directory");
    }

    try {
      // Check file size first
      const fileStat = await stat(absolutePath);
      if (fileStat.size > MAX_FILE_SIZE) {
        throw new ToolError(
          "file_reader",
          `File is too large (${fileStat.size} bytes). Maximum: ${MAX_FILE_SIZE} bytes`
        );
      }

      const encoding = (params.encoding as BufferEncoding) ?? "utf-8";
      const content = await readFile(absolutePath, { encoding });
      return content;
    } catch (error) {
      if (error instanceof ToolError) throw error;

      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        throw new ToolError(
          "file_reader",
          `File not found: ${absolutePath}`
        );
      }
      if (err.code === "EACCES") {
        throw new ToolError(
          "file_reader",
          `Permission denied: ${absolutePath}`
        );
      }

      throw new ToolError(
        "file_reader",
        error instanceof Error ? error.message : String(error)
      );
    }
  },
};
