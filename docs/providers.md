# Provider Configuration Guide

## サポートプロバイダー

| Provider | Type | SDK | 対応モデル例 |
|---|---|---|---|
| OpenAI | `openai` | `openai` | gpt-4o, gpt-4.1, gpt-5 |
| Anthropic | `anthropic` | `@anthropic-ai/sdk` | claude-sonnet-4-20250514, claude-opus-4 |
| Google | `google` | `@google/generative-ai` | gemini-2.5-flash, gemini-2.5-pro |
| Local | `local` | `openai` (互換) | Ollama, vLLM, LM Studio等 |

## セットアップ

### 1. SDKのインストール

使用するプロバイダーのSDKのみインストールしてください：

```bash
# OpenAI
npm install openai

# Anthropic
npm install @anthropic-ai/sdk

# Google
npm install @google/generative-ai

# 全て
npm install openai @anthropic-ai/sdk @google/generative-ai
```

### 2. 基本設定

```typescript
// OpenAI
const house = new House({
  name: "my-house",
  provider: {
    type: "openai",
    apiKey: process.env.OPENAI_API_KEY!,
    model: "gpt-4o",
    temperature: 0.7,
    maxTokens: 4096,
  },
});

// Anthropic
const house = new House({
  name: "my-house",
  provider: {
    type: "anthropic",
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: "claude-sonnet-4-20250514",
  },
});

// Google
const house = new House({
  name: "my-house",
  provider: {
    type: "google",
    apiKey: process.env.GOOGLE_API_KEY!,
    model: "gemini-2.5-flash",
  },
});

// Local (Ollama等)
const house = new House({
  name: "my-house",
  provider: {
    type: "local",
    apiKey: "not-needed",
    model: "llama3.1",
    baseUrl: "http://localhost:11434/v1",
  },
});
```

## Agent毎のProvider設定

特定のAgentに異なるProviderを割り当てることも可能です：

```typescript
const researcher = new ResearcherAgent({
  name: "Kai",
  // Agent固有のProvider設定
  provider: {
    type: "anthropic",
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: "claude-sonnet-4-20250514",
  },
});

house.addAgent(researcher);
// → Kai は Anthropic を使用、他のAgentはHouseデフォルト（OpenAI）を使用
```

## カスタムProvider

`LLMProvider`インターフェースを実装して独自のProviderを作成できます：

```typescript
import type { LLMProvider, ChatMessage, LLMResponse } from "ai-agent-house";

class MyProvider implements LLMProvider {
  readonly providerType = "custom";
  readonly modelName = "my-model";

  async generate(messages: ChatMessage[]): Promise<LLMResponse> {
    // カスタム実装
    const response = await myApi.call(messages);
    return {
      content: response.text,
      model: this.modelName,
      usage: {
        promptTokens: response.inputTokens,
        completionTokens: response.outputTokens,
        totalTokens: response.inputTokens + response.outputTokens,
      },
    };
  }
}
```

## エラーハンドリング

Provider呼び出しには自動的にリトライとサーキットブレーカーが適用されます：

- **Rate Limit (429)**: 自動リトライ（exponential backoff）
- **Timeout**: 自動リトライ（最大3回）
- **Network Error**: 自動リトライ
- **5xx Server Error**: 自動リトライ
- **4xx Client Error**: 即座に失敗（リトライなし）
- **連続5回失敗**: サーキットブレーカーが開き、60秒間リクエストを遮断
