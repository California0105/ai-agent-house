#!/usr/bin/env node

/**
 * ai-agent-house — CLI Entry Point
 *
 * Command-line interface for managing AI agent houses.
 * @module
 */

import { Command } from "commander";
import chalk from "chalk";
import { House } from "../core/house.js";
import { SecretaryAgent } from "../agents/secretary.js";
import { WriterAgent } from "../agents/writer.js";
import { ResearcherAgent } from "../agents/researcher.js";
import { HousekeeperAgent } from "../agents/housekeeper.js";

const VERSION = "0.1.0";

const program = new Command();

program
  .name("ai-house")
  .description(
    "🏠 ai-agent-house — Where AI Agents Live Together"
  )
  .version(VERSION);

// ─── init ───────────────────────────────────────────────

program
  .command("init")
  .description("Initialize a new AI agent house")
  .argument("[name]", "House name", "my-ai-home")
  .option(
    "-p, --provider <type>",
    "LLM provider (openai|anthropic|google|local)",
    "openai"
  )
  .option("-m, --model <model>", "Model name", "gpt-4o")
  .action((name: string, opts: { provider: string; model: string }) => {
    console.log(chalk.bold.cyan("\n🏠 Initializing AI Agent House\n"));
    console.log(chalk.white(`  Name:     ${chalk.bold(name)}`));
    console.log(
      chalk.white(`  Provider: ${chalk.bold(opts.provider)}`)
    );
    console.log(chalk.white(`  Model:    ${chalk.bold(opts.model)}`));
    console.log(
      chalk.gray(
        "\n  Set OPENAI_API_KEY (or appropriate env var) to enable LLM features.\n"
      )
    );
    console.log(chalk.green("  ✓ House initialized successfully!\n"));
    console.log(
      chalk.gray("  Next steps:")
    );
    console.log(
      chalk.gray("    1. Set your API key: export OPENAI_API_KEY=sk-...")
    );
    console.log(
      chalk.gray("    2. Add agents: ai-house agents add secretary")
    );
    console.log(
      chalk.gray(
        '    3. Start a discussion: ai-house discuss "Your topic here"'
      )
    );
    console.log();
  });

// ─── demo ───────────────────────────────────────────────

program
  .command("demo")
  .description("Run a demo discussion with built-in agents")
  .option(
    "-t, --topic <topic>",
    "Discussion topic",
    "Plan an AI-powered daily routine for a busy parent"
  )
  .action(async (opts: { topic: string }) => {
    console.log(chalk.bold.cyan("\n🏠 AI Agent House — Demo Mode\n"));

    const house = new House({
      name: "demo-house",
      provider: {
        type: "openai",
        apiKey: "demo-mode",
        model: "demo",
      },
      maxRounds: 1,
      verbose: false,
    });

    // Add all built-in agents
    const agents = [
      new SecretaryAgent({ name: "Aki 🗓️" }),
      new WriterAgent({ name: "Sora ✍️", style: "casual" }),
      new ResearcherAgent({ name: "Kai 🔍" }),
      new HousekeeperAgent({ name: "Hana 🏠" }),
    ];

    for (const agent of agents) {
      house.addAgent(agent);
    }

    console.log(
      chalk.white(
        `  Topic: ${chalk.bold.yellow(opts.topic)}\n`
      )
    );
    console.log(
      chalk.white(
        `  Agents: ${agents.map((a) => chalk.bold(a.name)).join(", ")}\n`
      )
    );

    const result = await house.discuss(opts.topic);

    console.log(chalk.bold.green("─── Discussion Results ───\n"));

    for (const msg of result.messages) {
      if (msg.type === "system") {
        console.log(chalk.gray(`  📢 ${msg.content}`));
      } else {
        console.log(
          chalk.bold.white(`  ${msg.authorName}:`)
        );
        const lines = msg.content.split("\n");
        for (const line of lines) {
          console.log(chalk.white(`    ${line}`));
        }
        console.log();
      }
    }

    console.log(chalk.bold.green("─── Summary ───\n"));
    console.log(
      chalk.white(
        `  Duration: ${result.durationMs}ms | Rounds: ${result.rounds} | Messages: ${result.messages.length}`
      )
    );
    console.log(
      chalk.gray(
        "\n  💡 Connect an LLM provider for full AI-powered discussions!"
      )
    );
    console.log();
  });

// ─── agents ─────────────────────────────────────────────

const agentsCmd = program
  .command("agents")
  .description("Manage agents in the house");

agentsCmd
  .command("list")
  .description("List available built-in agents")
  .action(() => {
    console.log(chalk.bold.cyan("\n🏠 Built-in Agents\n"));
    const agents = [
      {
        name: "SecretaryAgent",
        emoji: "🗓️",
        desc: "Schedule, task management, reminders",
      },
      {
        name: "WriterAgent",
        emoji: "✍️",
        desc: "Blog posts, SNS content, documentation",
      },
      {
        name: "ResearcherAgent",
        emoji: "🔍",
        desc: "Information gathering, analysis, summarization",
      },
      {
        name: "HousekeeperAgent",
        emoji: "🏠",
        desc: "Task delegation, coordination, synthesis",
      },
    ];

    for (const agent of agents) {
      console.log(
        `  ${agent.emoji}  ${chalk.bold(agent.name)}`
      );
      console.log(chalk.gray(`     ${agent.desc}\n`));
    }
  });

// ─── status ─────────────────────────────────────────────

program
  .command("status")
  .description("Show house status")
  .action(() => {
    console.log(chalk.bold.cyan("\n🏠 AI Agent House Status\n"));
    console.log(chalk.white("  Version: " + chalk.bold(VERSION)));
    console.log(chalk.white("  Status:  " + chalk.bold.green("Ready")));
    console.log(
      chalk.gray(
        "\n  Use 'ai-house demo' to run a demonstration.\n"
      )
    );
  });

program.parse();
