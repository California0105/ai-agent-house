# Workflow Guide

## 基本的な使い方

### 1. House の作成

```typescript
import { House, SecretaryAgent, WriterAgent } from "ai-agent-house";

const house = new House({
  name: "my-house",
  provider: {
    type: "openai",
    apiKey: process.env.OPENAI_API_KEY!,
    model: "gpt-4o",
  },
  maxRounds: 2,
  verbose: true,
});
```

### 2. Agent の追加

```typescript
house.addAgent(new SecretaryAgent({ name: "Aki" }));
house.addAgent(new WriterAgent({ name: "Sora", style: "creative" }));
```

### 3. Discussion の実行

```typescript
// 逐次実行（デフォルト）
const result = await house.discuss("AIブログ記事を企画して");

// 並列実行
const result = await house.discuss("市場調査を実施して", {
  parallel: true,
  maxRounds: 3,
});
```

### 4. 単一Agent への質問

```typescript
const agents = house.getAgents();
const writer = agents.find(a => a.role === "writer");
if (writer) {
  const response = await house.askAgent(writer.id, "記事を書いて");
}
```

## Tool の利用

```typescript
import { httpTool, fileReaderTool, createWebSearchTool } from "ai-agent-house";

// Agent にツールを追加
const researcher = new ResearcherAgent({ name: "Kai" });
researcher.addTool(httpTool);
researcher.addTool(fileReaderTool);

// カスタム検索プロバイダ
const searchTool = createWebSearchTool({
  search: async (query) => {
    // Your search API implementation
    return "Search results...";
  },
});
researcher.addTool(searchTool);
```

## Shared Memory

```typescript
// Agent 間で状態を共有
house.memory.set("research_complete", true);
house.memory.set("outline", { sections: ["intro", "body"] });

// 変更を監視
house.memory.onChange((key, value) => {
  console.log(`Memory updated: ${key} = ${JSON.stringify(value)}`);
});
```

## Usage Tracking

```typescript
const result = await house.discuss("タスク");

// Discussion レベル
console.log(result.usage);
// { promptTokens: 1500, completionTokens: 500, totalTokens: 2000, cost: 0.015 }

// Agent レベル
const summary = house.usageTracker.getSummaryByAgent();
for (const [agentId, usage] of summary) {
  console.log(`${usage.agentName}: ${usage.totalTokens} tokens ($${usage.totalCost})`);
}
```

## Persistent Memory

```typescript
import { House, JsonFileMemoryProvider } from "ai-agent-house";

const house = new House({
  name: "persistent-house",
  provider: { type: "openai", apiKey: "...", model: "gpt-4o" },
  memoryProvider: new JsonFileMemoryProvider("./data"),
});

// 状態を復元
await house.restoreState();

// ... 作業 ...

// 状態を保存
await house.saveState();
```

## Coordinator パターン

```typescript
import { HousekeeperAgent } from "ai-agent-house";

const housekeeper = new HousekeeperAgent({ name: "Hana" });
house.addAgent(housekeeper);

// Housekeeper がタスクを分析・分配・統合
const result = await housekeeper.coordinateTask(
  "AIブログ記事を作成",
  house.getAgents(),
  house.bulletinBoard
);
```
