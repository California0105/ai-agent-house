import { describe, it, expect, beforeEach } from "vitest";
import { BulletinBoard } from "../memory/bulletin-board.js";

describe("BulletinBoard", () => {
  let board: BulletinBoard;

  beforeEach(() => {
    board = new BulletinBoard();
  });

  describe("post", () => {
    it("should post a message to the board", () => {
      const msg = board.post("agent-1", "Aki", "Hello, house!");
      expect(msg.id).toBeDefined();
      expect(msg.authorId).toBe("agent-1");
      expect(msg.authorName).toBe("Aki");
      expect(msg.content).toBe("Hello, house!");
      expect(msg.type).toBe("note");
      expect(msg.priority).toBe("normal");
      expect(msg.createdAt).toBeInstanceOf(Date);
    });

    it("should post with custom options", () => {
      const msg = board.post("agent-1", "Aki", "Urgent task!", {
        type: "task",
        priority: "urgent",
        tags: ["deadline", "important"],
        targetAgents: ["agent-2"],
      });

      expect(msg.type).toBe("task");
      expect(msg.priority).toBe("urgent");
      expect(msg.tags).toEqual(["deadline", "important"]);
      expect(msg.targetAgents).toEqual(["agent-2"]);
    });

    it("should generate unique IDs for each message", () => {
      const msg1 = board.post("agent-1", "Aki", "Message 1");
      const msg2 = board.post("agent-1", "Aki", "Message 2");
      expect(msg1.id).not.toBe(msg2.id);
    });

    it("should enforce max message limit", () => {
      const smallBoard = new BulletinBoard(3);
      smallBoard.post("a", "A", "msg 1");
      smallBoard.post("a", "A", "msg 2");
      smallBoard.post("a", "A", "msg 3");
      smallBoard.post("a", "A", "msg 4");

      expect(smallBoard.count).toBe(3);
    });
  });

  describe("getMessages", () => {
    beforeEach(() => {
      board.post("agent-1", "Aki", "Task 1", {
        type: "task",
        priority: "high",
        tags: ["work"],
      });
      board.post("agent-2", "Sora", "Response 1", {
        type: "response",
        priority: "normal",
        tags: ["creative"],
      });
      board.post("agent-1", "Aki", "Note 1", {
        type: "note",
        priority: "low",
        tags: ["work"],
      });
    });

    it("should return all messages by default", () => {
      const messages = board.getMessages();
      expect(messages).toHaveLength(3);
    });

    it("should filter by type", () => {
      const tasks = board.getMessages({ type: "task" });
      expect(tasks).toHaveLength(1);
      expect(tasks[0].content).toBe("Task 1");
    });

    it("should filter by author", () => {
      const akiMessages = board.getMessages({
        authorId: "agent-1",
      });
      expect(akiMessages).toHaveLength(2);
    });

    it("should filter by priority", () => {
      const highPriority = board.getMessages({
        priority: "high",
      });
      expect(highPriority).toHaveLength(1);
    });

    it("should filter by tags", () => {
      const workMessages = board.getMessages({
        tags: ["work"],
      });
      expect(workMessages).toHaveLength(2);
    });

    it("should limit results", () => {
      const limited = board.getMessages({ limit: 1 });
      expect(limited).toHaveLength(1);
    });

    it("should sort newest first", () => {
      const messages = board.getMessages();
      // Messages created in same tick may have identical timestamps,
      // so we verify the sort is at least non-ascending by createdAt
      for (let i = 0; i < messages.length - 1; i++) {
        expect(messages[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          messages[i + 1].createdAt.getTime()
        );
      }
    });
  });

  describe("getMessagesForAgent", () => {
    it("should return messages targeted at the agent or broadcast", () => {
      board.post("agent-1", "Aki", "For everyone");
      board.post("agent-1", "Aki", "For Sora only", {
        targetAgents: ["agent-2"],
      });
      board.post("agent-1", "Aki", "For Kai only", {
        targetAgents: ["agent-3"],
      });

      const soraMessages = board.getMessagesForAgent("agent-2");
      // Should get broadcast + targeted message
      expect(soraMessages).toHaveLength(2);
    });
  });

  describe("getThread", () => {
    it("should return a message thread", () => {
      const parent = board.post("agent-1", "Aki", "Parent message");
      board.post("agent-2", "Sora", "Reply 1", {
        parentId: parent.id,
      });
      board.post("agent-3", "Kai", "Reply 2", {
        parentId: parent.id,
      });

      const thread = board.getThread(parent.id);
      expect(thread).toHaveLength(3);
      expect(thread[0].content).toBe("Parent message");
    });

    it("should return empty array for non-existent parent", () => {
      const thread = board.getThread("non-existent");
      expect(thread).toHaveLength(0);
    });
  });

  describe("clear", () => {
    it("should remove all messages", () => {
      board.post("agent-1", "Aki", "Message 1");
      board.post("agent-2", "Sora", "Message 2");
      board.clear();
      expect(board.count).toBe(0);
    });
  });

  describe("export/import", () => {
    it("should export and import messages", () => {
      board.post("agent-1", "Aki", "Message 1");
      board.post("agent-2", "Sora", "Message 2");

      const exported = board.export();
      expect(exported).toHaveLength(2);

      const newBoard = new BulletinBoard();
      newBoard.import(exported);
      expect(newBoard.count).toBe(2);

      const messages = newBoard.getMessages();
      expect(messages[0].createdAt).toBeInstanceOf(Date);
    });
  });
});
