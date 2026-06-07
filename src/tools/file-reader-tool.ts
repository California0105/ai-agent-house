/**
 * ai-agent-house — File Reader Tool
 *
 * A tool for reading file contents from the local filesystem.
 * @module
 */

import { readFile, stat } from "node:fs/promises";
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
    const path = params.path as string | undefined;
    if (!path) {
      throw new ToolError("file_reader", "File path is required");
    }

    try {
      // Check file size first
      const fileStat = await stat(path);
      if (fileStat.size > MAX_FILE_SIZE) {
        throw new ToolError(
          "file_reader",
          `File is too large (${fileStat.size} bytes). Maximum: ${MAX_FILE_SIZE} bytes`
        );
      }

      const encoding = (params.encoding as BufferEncoding) ?? "utf-8";
      const content = await readFile(path, { encoding });
      return content;
    } catch (error) {
      if (error instanceof ToolError) throw error;

      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        throw new ToolError(
          "file_reader",
          `File not found: ${path}`
        );
      }
      if (err.code === "EACCES") {
        throw new ToolError(
          "file_reader",
          `Permission denied: ${path}`
        );
      }

      throw new ToolError(
        "file_reader",
        error instanceof Error ? error.message : String(error)
      );
    }
  },
};
