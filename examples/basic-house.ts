/**
 * ai-agent-house — Basic Usage Example
 *
 * This example demonstrates how to create a house, add agents,
 * and run a multi-agent discussion.
 */

import {
  House,
  SecretaryAgent,
  WriterAgent,
  ResearcherAgent,
  HousekeeperAgent,
} from "ai-agent-house";

async function main() {
  // 1. Create a house with an LLM provider
  const house = new House({
    name: "shinpapa-house",
    provider: {
      type: "openai",
      apiKey: process.env.OPENAI_API_KEY ?? "demo-key",
      model: "gpt-4o",
    },
    maxRounds: 2,
    verbose: true,
  });

  // 2. Add agents as roommates
  house.addAgent(new SecretaryAgent({ name: "Aki 🗓️" }));
  house.addAgent(
    new WriterAgent({ name: "Sora ✍️", style: "casual" })
  );
  house.addAgent(
    new ResearcherAgent({ name: "Kai 🔍", depth: "standard" })
  );
  house.addAgent(new HousekeeperAgent({ name: "Hana 🏠" }));

  console.log("🏠 House Status:", house.getStatus());

  // 3. Start a discussion
  const result = await house.discuss(
    "AIエージェントを日常生活に取り入れる方法についてブログ記事を企画してください"
  );

  console.log("\n📋 Discussion Summary:");
  console.log(result.summary);

  console.log(`\n⏱️ Duration: ${result.durationMs}ms`);
  console.log(`💬 Messages: ${result.messages.length}`);

  // 4. Check the bulletin board
  console.log("\n📌 Bulletin Board:");
  const recentMessages = house.bulletinBoard.getMessages({
    limit: 5,
  });
  for (const msg of recentMessages) {
    console.log(`  [${msg.authorName}] ${msg.content.slice(0, 80)}`);
  }
}

main().catch(console.error);
