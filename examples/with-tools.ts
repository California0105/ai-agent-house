import { House, ResearcherAgent, createWebSearchTool } from "../src/index.js";

async function main() {
  const house = new House({
    name: "tool-house",
    provider: {
      type: "openai",
      apiKey: process.env.OPENAI_API_KEY || "dummy",
      model: "gpt-4o",
    },
    verbose: true,
  });

  const researcher = new ResearcherAgent({ name: "Kai" });
  
  // Add a web search tool to the researcher
  // (Note: requires a TAVILY_API_KEY environment variable)
  researcher.addTool(createWebSearchTool({
    provider: "tavily",
    apiKey: process.env.TAVILY_API_KEY || "dummy-key"
  }));

  house.addAgent(researcher);

  console.log("Starting task...");
  // In a real environment with a valid API key, Kai will search the web and summarize the results.
  const result = await house.discuss("What is the latest news about AI agent frameworks? Please search the web and summarize.", { maxRounds: 1 });
  
  console.log("\n=== Final Summary ===");
  console.log(result.summary);
}

main().catch(console.error);
