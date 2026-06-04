import { describe, it, expect } from "vitest";
import { House } from "../core/house.js";
import { SecretaryAgent } from "../agents/secretary.js";
import { WriterAgent } from "../agents/writer.js";
import { ResearcherAgent } from "../agents/researcher.js";
import { HousekeeperAgent } from "../agents/housekeeper.js";

const createTestHouse = () =>
  new House({
    name: "test-house",
    provider: {
      type: "openai",
      apiKey: "test-key",
      model: "test-model",
    },
    maxRounds: 1,
    verbose: false,
  });

describe("House", () => {
  describe("constructor", () => {
    it("should create a house with valid config", () => {
      const house = createTestHouse();
      expect(house.name).toBe("test-house");
      expect(house.provider.type).toBe("openai");
      expect(house.maxRounds).toBe(1);
    });

    it("should reject invalid config", () => {
      expect(
        () =>
          new House({
            name: "",
            provider: {
              type: "openai",
              apiKey: "",
              model: "",
            },
          })
      ).toThrow();
    });
  });

  describe("addAgent", () => {
    it("should add an agent to the house", () => {
      const house = createTestHouse();
      const agent = new SecretaryAgent({ name: "Aki" });
      house.addAgent(agent);
      expect(house.getAgents()).toHaveLength(1);
      expect(house.getAgents()[0].name).toBe("Aki");
    });

    it("should post a system message when agent joins", () => {
      const house = createTestHouse();
      house.addAgent(new SecretaryAgent({ name: "Aki" }));
      const messages = house.bulletinBoard.getMessages({
        type: "system",
      });
      expect(messages).toHaveLength(1);
      expect(messages[0].content).toContain("Aki");
    });
  });

  describe("removeAgent", () => {
    it("should remove an agent from the house", () => {
      const house = createTestHouse();
      const agent = new SecretaryAgent({ name: "Aki" });
      house.addAgent(agent);
      house.removeAgent(agent.id);
      expect(house.getAgents()).toHaveLength(0);
    });
  });

  describe("getCapableAgents", () => {
    it("should find agents that can handle a task", () => {
      const house = createTestHouse();
      house.addAgent(new SecretaryAgent({ name: "Aki" }));
      house.addAgent(new WriterAgent({ name: "Sora" }));

      const capable = house.getCapableAgents(
        "schedule a meeting"
      );
      expect(capable.length).toBeGreaterThanOrEqual(1);
      expect(capable[0].name).toBe("Aki");
    });
  });

  describe("discuss", () => {
    it("should run a multi-agent discussion", async () => {
      const house = createTestHouse();
      house.addAgent(new SecretaryAgent({ name: "Aki" }));
      house.addAgent(new WriterAgent({ name: "Sora" }));

      const result = await house.discuss("Test discussion");
      expect(result.messages.length).toBeGreaterThan(0);
      expect(result.rounds).toBe(1);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.participants).toHaveLength(2);
    });

    it("should throw if no agents available", async () => {
      const house = createTestHouse();
      await expect(
        house.discuss("Test")
      ).rejects.toThrow("No agents available");
    });
  });

  describe("getStatus", () => {
    it("should return house status", () => {
      const house = createTestHouse();
      house.addAgent(new SecretaryAgent({ name: "Aki" }));
      house.addAgent(new ResearcherAgent({ name: "Kai" }));

      const status = house.getStatus();
      expect(status.name).toBe("test-house");
      expect(status.agentCount).toBe(2);
      expect(status.agents).toHaveLength(2);
    });
  });
});

describe("Built-in Agents", () => {
  describe("SecretaryAgent", () => {
    it("should create with default config", () => {
      const agent = new SecretaryAgent();
      expect(agent.name).toBe("Secretary");
      expect(agent.role).toBe("secretary");
    });

    it("should create with custom name", () => {
      const agent = new SecretaryAgent({ name: "Aki" });
      expect(agent.name).toBe("Aki");
    });

    it("should handle schedule-related tasks", () => {
      const agent = new SecretaryAgent();
      expect(agent.canHandle("schedule a meeting")).toBe(true);
      expect(agent.canHandle("random gibberish xyz")).toBe(false);
    });

    it("should process a task", async () => {
      const agent = new SecretaryAgent({ name: "Aki" });
      const result = await agent.processTask("Plan my day", []);
      expect(result).toContain("Aki");
      expect(result).toContain("Plan my day");
    });
  });

  describe("WriterAgent", () => {
    it("should create with style option", () => {
      const agent = new WriterAgent({
        name: "Sora",
        style: "creative",
      });
      expect(agent.style).toBe("creative");
    });

    it("should handle writing-related tasks", () => {
      const agent = new WriterAgent();
      expect(agent.canHandle("write a blog post")).toBe(true);
    });
  });

  describe("ResearcherAgent", () => {
    it("should create with depth option", () => {
      const agent = new ResearcherAgent({
        name: "Kai",
        depth: "deep",
      });
      expect(agent.depth).toBe("deep");
    });

    it("should handle research-related tasks", () => {
      const agent = new ResearcherAgent();
      expect(agent.canHandle("research AI trends")).toBe(true);
    });
  });

  describe("HousekeeperAgent", () => {
    it("should handle any task", () => {
      const agent = new HousekeeperAgent();
      expect(agent.canHandle("literally anything")).toBe(true);
      expect(agent.canHandle("")).toBe(true);
    });
  });
});
