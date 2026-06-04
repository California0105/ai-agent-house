/**
 * ai-agent-house — Bulletin Board (Shared Memory)
 *
 * The central communication hub for all agents in a house.
 * Agents post messages, read context, and coordinate through the board.
 * @module
 */

import { nanoid } from "nanoid";
import type {
  BoardMessage,
  MessageType,
  MessagePriority,
} from "../core/types.js";

/** Options for posting a message */
export interface PostOptions {
  /** Message type */
  type?: MessageType;
  /** Priority level */
  priority?: MessagePriority;
  /** Target specific agents by ID */
  targetAgents?: string[];
  /** Tags for categorization */
  tags?: string[];
  /** Parent message ID for threading */
  parentId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/** Options for querying messages */
export interface QueryOptions {
  /** Filter by message type */
  type?: MessageType;
  /** Filter by author ID */
  authorId?: string;
  /** Filter by priority */
  priority?: MessagePriority;
  /** Filter by tags (any match) */
  tags?: string[];
  /** Maximum number of messages to return */
  limit?: number;
  /** Only messages after this date */
  after?: Date;
  /** Only messages before this date */
  before?: Date;
}

/**
 * Bulletin Board — Shared memory and communication system for agents.
 *
 * The bulletin board acts as the central nervous system of the house.
 * Agents post messages to communicate, share findings, and coordinate tasks.
 *
 * @example
 * ```typescript
 * const board = new BulletinBoard();
 *
 * // Post a message
 * board.post("agent-1", "Aki", "Meeting scheduled for 3pm", {
 *   type: "note",
 *   priority: "normal",
 *   tags: ["schedule"],
 * });
 *
 * // Query messages
 * const recent = board.getMessages({ limit: 10 });
 * const tasks = board.getMessages({ type: "task" });
 * ```
 */
export class BulletinBoard {
  /** All messages on the board */
  private messages: BoardMessage[] = [];

  /** Maximum number of messages to retain */
  private readonly maxMessages: number;

  constructor(maxMessages = 1000) {
    this.maxMessages = maxMessages;
  }

  /**
   * Post a new message to the bulletin board.
   *
   * @param authorId - ID of the posting agent
   * @param authorName - Display name of the posting agent
   * @param content - Message content
   * @param options - Additional message options
   * @returns The created message
   */
  post(
    authorId: string,
    authorName: string,
    content: string,
    options: PostOptions = {}
  ): BoardMessage {
    const message: BoardMessage = {
      id: nanoid(10),
      authorId,
      authorName,
      content,
      type: options.type ?? "note",
      priority: options.priority ?? "normal",
      targetAgents: options.targetAgents,
      tags: options.tags,
      parentId: options.parentId,
      createdAt: new Date(),
      metadata: options.metadata,
    };

    this.messages.push(message);

    // Prune old messages if exceeding limit
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }

    return message;
  }

  /**
   * Get messages from the bulletin board, optionally filtered.
   *
   * @param options - Query options for filtering
   * @returns Array of matching messages, newest first
   */
  getMessages(options: QueryOptions = {}): BoardMessage[] {
    let result = [...this.messages];

    if (options.type) {
      result = result.filter((m) => m.type === options.type);
    }

    if (options.authorId) {
      result = result.filter((m) => m.authorId === options.authorId);
    }

    if (options.priority) {
      result = result.filter((m) => m.priority === options.priority);
    }

    if (options.tags && options.tags.length > 0) {
      result = result.filter(
        (m) =>
          m.tags && m.tags.some((t) => options.tags!.includes(t))
      );
    }

    if (options.after) {
      result = result.filter((m) => m.createdAt > options.after!);
    }

    if (options.before) {
      result = result.filter((m) => m.createdAt < options.before!);
    }

    // Sort newest first
    result.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    if (options.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  /**
   * Get messages targeted at a specific agent.
   *
   * @param agentId - The agent ID to get messages for
   * @param limit - Maximum number of messages
   * @returns Messages targeted at the agent
   */
  getMessagesForAgent(
    agentId: string,
    limit = 20
  ): BoardMessage[] {
    return this.messages
      .filter(
        (m) =>
          !m.targetAgents ||
          m.targetAgents.length === 0 ||
          m.targetAgents.includes(agentId)
      )
      .sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )
      .slice(0, limit);
  }

  /**
   * Get a thread of messages starting from a parent message.
   *
   * @param parentId - The root message ID
   * @returns All messages in the thread
   */
  getThread(parentId: string): BoardMessage[] {
    const root = this.messages.find((m) => m.id === parentId);
    if (!root) return [];

    const thread = [root];
    const replies = this.messages.filter(
      (m) => m.parentId === parentId
    );
    thread.push(...replies);

    return thread.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
  }

  /**
   * Get the total number of messages on the board.
   */
  get count(): number {
    return this.messages.length;
  }

  /**
   * Clear all messages from the board.
   */
  clear(): void {
    this.messages = [];
  }

  /**
   * Export all messages as a serializable array.
   */
  export(): BoardMessage[] {
    return [...this.messages];
  }

  /**
   * Import messages from a serialized array.
   */
  import(messages: BoardMessage[]): void {
    this.messages = messages.map((m) => ({
      ...m,
      createdAt: new Date(m.createdAt),
    }));
  }
}
