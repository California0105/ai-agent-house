# Architecture

ai-agent-house は、AIエージェントが「同居」してタスクを協力して処理するマルチエージェントフレームワークです。

## コアコンセプト

```
┌──────────────────────────────────────────────────────┐
│                        House                         │
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│  │ Agent A  │  │ Agent B  │  │ Agent C  │  ...       │
│  │(Secretary│  │ (Writer) │  │(Research)│              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │              │              │                 │
│       ▼              ▼              ▼                 │
│  ┌──────────────────────────────────────────────┐    │
│  │              Bulletin Board                   │    │
│  │         (Message-based Communication)         │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │              Shared Memory                    │    │
│  │          (Key-Value State Store)              │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────┐  ┌──────────────────────┐      │
│  │  LLM Provider    │  │   Usage Tracker      │      │
│  │ (OpenAI/Claude/  │  │  (Tokens / Cost)     │      │
│  │  Gemini/Local)   │  │                      │      │
│  └─────────────────┘  └──────────────────────┘      │
│                                                      │
│  ┌─────────────────┐  ┌──────────────────────┐      │
│  │  Tool Registry   │  │  Memory Provider     │      │
│  │ (HTTP/File/Web)  │  │ (JSON File/SQLite)   │      │
│  └─────────────────┘  └──────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

## モジュール構成

| モジュール | パス | 責務 |
|---|---|---|
| **Core** | `src/core/` | Agent基底クラス、House、型定義、エラー、リトライ |
| **Providers** | `src/providers/` | LLM抽象化レイヤー（OpenAI, Anthropic, Google） |
| **Agents** | `src/agents/` | ビルトインAgent実装（Secretary, Writer, Researcher, Housekeeper） |
| **Memory** | `src/memory/` | BulletinBoard, SharedMemory, 永続化プロバイダー |
| **Tools** | `src/tools/` | Tool interface, Registry, ビルトインツール |
| **CLI** | `src/cli/` | コマンドラインインターフェース |

## データフロー

```
User Task
    ↓
House.discuss() / House.askAgent()
    ↓
┌─── For each Agent ──────────────────────┐
│                                          │
│  1. Context取得（BulletinBoard）          │
│  2. buildPrompt() — System + Context     │
│  3. LLMProvider.generate()               │
│  4. Tool呼び出し（必要に応じてループ）     │
│  5. Response → BulletinBoard に投稿      │
│  6. Usage記録（UsageTracker）             │
│  7. 既読マーカー更新                      │
│                                          │
└──────────────────────────────────────────┘
    ↓
DiscussionResult（Summary + Messages + Usage）
```

## エラーハンドリング

```
AgentHouseError
├── ProviderError
│   ├── RateLimitError (429)
│   ├── TimeoutError (408)
│   └── NetworkError
├── ToolError
├── AgentError
└── MemoryError
```

リトライ: Exponential backoff + jitter（`withRetry`）
サーキットブレーカー: 連続失敗時に一時遮断（`CircuitBreaker`）
