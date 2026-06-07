import { House, SecretaryAgent, WriterAgent, ResearcherAgent } from "../src/index.js";

async function main() {
  const house = new House({
    name: "parallel-house",
    provider: {
      type: "openai",
      apiKey: process.env.OPENAI_API_KEY || "dummy",
      model: "gpt-4o",
    },
    verbose: true,
  });

  house.addAgent(new SecretaryAgent({ name: "Aki" }));
  house.addAgent(new WriterAgent({ name: "Sora" }));
  house.addAgent(new ResearcherAgent({ name: "Kai" }));

  console.log("Starting parallel discussion...");
  // Set parallel: true to allow agents to generate responses simultaneously
  const result = await house.discuss("Let's brainstorm ideas for our new AI product.", {
    maxRounds: 2,
    parallel: true,
  });
  
  console.log("\n=== Discussion Result ===");
  console.log(`Tokens used: ${result.tokensUsed || 0}`);
  console.log(`Duration: ${result.durationMs}ms`);
  console.log(`\nSummary:\n${result.summary}`);
}

main().catch(console.error);
