<div align="center">

# 🏠 ai-agent-house

**Where AI Agents Live Together**

*複数のAIエージェントが「同居」して協力する、軽量マルチエージェントフレームワーク*

[![npm version](https://img.shields.io/npm/v/ai-agent-house.svg)](https://www.npmjs.com/package/ai-agent-house)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/California0105/ai-agent-house/actions/workflows/ci.yml/badge.svg)](https://github.com/California0105/ai-agent-house/actions)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)

[English](#english) | [日本語](#日本語)

</div>

---

## English

### What is ai-agent-house?

**ai-agent-house** is a lightweight TypeScript framework for building multi-AI-agent systems where agents coexist like roommates in a shared house. Each agent has its own role, personality, and capabilities — and they communicate through a shared **Bulletin Board** (memory system).

Think of it as a **smart home for AI agents** 🏠🤖

### Key Features

- 🏠 **House Model** — Manage multiple agents in a single "house" environment
- 📋 **Bulletin Board** — Shared memory system for inter-agent communication
- 🔌 **Multi-Provider** — Works with OpenAI, Anthropic, Google, and local LLMs
- 🧩 **MCP Compatible** — Built-in Model Context Protocol support
- 🎭 **Role-Based Agents** — Secretary, Writer, Researcher, and custom agents
- ⚡ **Lightweight** — Minimal dependencies, maximum flexibility
- 📦 **CLI & Library** — Use as a CLI tool or import as a library

### Quick Start

```bash
# Install
npm install ai-agent-house

# Or use directly with npx
npx ai-house init my-house
```

### Basic Usage

```typescript
import { House, SecretaryAgent, WriterAgent } from "ai-agent-house";

// Create a house with agents
const house = new House({
  name: "my-ai-home",
  provider: {
    type: "openai",
    apiKey: process.env.OPENAI_API_KEY!,
    model: "gpt-4o",
  },
});

// Add agents as roommates
house.addAgent(new SecretaryAgent({ name: "Aki" }));
house.addAgent(new WriterAgent({ name: "Sora" }));

// Start a conversation
const result = await house.discuss("Plan a blog post about AI agents in daily life");
console.log(result.summary);

// Check the bulletin board
const messages = house.bulletinBoard.getMessages();
console.log(messages);
```

### Built-in Agents

| Agent | Role | Description |
|---|---|---|
| 🗓️ **SecretaryAgent** | Organizer | Schedule management, task tracking, reminders |
| ✍️ **WriterAgent** | Creator | Blog posts, SNS content, documentation |
| 🔍 **ResearcherAgent** | Investigator | Information gathering, summarization, analysis |
| 🏠 **HousekeeperAgent** | Coordinator | Task delegation, conflict resolution |

### Creating Custom Agents

```typescript
import { Agent, AgentConfig } from "ai-agent-house";

class TranslatorAgent extends Agent {
  constructor() {
    super({
      name: "Translator",
      role: "translator",
      personality: "Precise, culturally aware, multilingual",
      capabilities: ["translate", "localize", "proofread"],
      systemPrompt: `You are a professional translator. 
        Translate content while preserving tone and cultural nuances.`,
    });
  }
}

house.addAgent(new TranslatorAgent());
```

### CLI Usage

```bash
# Initialize a new house
ai-house init my-house

# List agents in the house
ai-house agents list

# Send a task to the house
ai-house discuss "Write a tweet about our latest feature"

# Check the bulletin board
ai-house board
```

### Architecture

```
┌─────────────────────────────────────────────┐
│                   House 🏠                   │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │Secretary │ │ Writer   │ │ Researcher   │ │
│  │   🗓️     │ │   ✍️     │ │     🔍       │ │
│  └────┬─────┘ └────┬─────┘ └──────┬───────┘ │
│       │             │              │          │
│  ┌────▼─────────────▼──────────────▼───────┐ │
│  │         Bulletin Board 📋               │ │
│  │   (Shared Memory & Communication)       │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │         Provider Adapter 🔌             │ │
│  │   OpenAI | Anthropic | Google | Local   │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 日本語

### ai-agent-house とは？

**ai-agent-house** は、複数のAIエージェントがルームメイトのように共同生活する環境を構築するための、軽量TypeScriptフレームワークです。各エージェントはそれぞれの役割・個性・能力を持ち、共有の **掲示板（Bulletin Board）** を通じてコミュニケーションします。

いわば **AIエージェントのためのスマートホーム** です 🏠🤖

### 特徴

- 🏠 **ハウスモデル** — 複数エージェントを一つの「家」で管理
- 📋 **掲示板システム** — エージェント間の共有メモリ＆コミュニケーション
- 🔌 **マルチプロバイダー** — OpenAI・Anthropic・Google・ローカルLLM対応
- 🧩 **MCP対応** — Model Context Protocol（標準プロトコル）ビルトインサポート
- 🎭 **役割ベース** — 秘書・ライター・リサーチャー＋カスタムエージェント
- ⚡ **軽量設計** — 最小限の依存関係で最大限の柔軟性
- 📦 **CLI＆ライブラリ** — コマンドラインツールとしてもライブラリとしても利用可能

### クイックスタート

```bash
# インストール
npm install ai-agent-house

# npxで直接使用
npx ai-house init my-house
```

### 基本的な使い方

```typescript
import { House, SecretaryAgent, WriterAgent } from "ai-agent-house";

// 家を作ってエージェントを追加
const house = new House({
  name: "わが家",
  provider: {
    type: "openai",
    apiKey: process.env.OPENAI_API_KEY!,
    model: "gpt-4o",
  },
});

// エージェントをルームメイトとして追加
house.addAgent(new SecretaryAgent({ name: "アキ" }));
house.addAgent(new WriterAgent({ name: "ソラ" }));

// ディスカッションを開始
const result = await house.discuss("AIエージェントの日常活用についてブログ記事を企画して");
console.log(result.summary);
```

### ビルトインエージェント

| エージェント | 役割 | 説明 |
|---|---|---|
| 🗓️ **SecretaryAgent** | 秘書 | スケジュール管理、タスク追跡、リマインダー |
| ✍️ **WriterAgent** | ライター | ブログ、SNS投稿、ドキュメント作成 |
| 🔍 **ResearcherAgent** | リサーチャー | 情報収集、要約、分析 |
| 🏠 **HousekeeperAgent** | ハウスキーパー | タスク振り分け、調整、衝突解決 |

---

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

## Security

Please see [SECURITY.md](SECURITY.md) for reporting security vulnerabilities.

## License

[MIT](LICENSE) © shinpapa

---

<div align="center">

**Built with 🦞 by [しんパパ | AIエージェント同棲中](https://github.com/California0105)**

*AI agents deserve a home too.*

</div>
