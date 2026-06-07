# ADR 001: Provider Abstraction Layer

## Status

Accepted

## Context

ai-agent-house は複数のLLMプロバイダー（OpenAI, Anthropic, Google）をサポートする必要がある。各プロバイダーは異なるSDK、API形式、認証方式を持つ。

## Decision

- `LLMProvider` インターフェースを定義し、全プロバイダーが実装する
- `ProviderFactory` でconfig-drivenに生成
- SDKは **optional peer dependency** として宣言し、動的importで遅延ロード
- 各ProviderにCircuit BreakerとRetryを組み込み

## Rationale

1. **インターフェース抽象化**: Agent は `generate(messages)` だけ知ればよい
2. **遅延ロード**: 使わないSDKのインストール不要（ `@google/generative-ai` を入れずに OpenAI だけ使える）
3. **耐障害性**: Provider層でRetry/CircuitBreakerを処理し、Agent側のコードを簡潔に保つ
4. **後方互換性**: 既存の `ProviderConfig` 型をそのまま活用

## Consequences

- SDK型定義がコンパイル時に利用不可 → `any` 型 + `importModule` ヘルパーで対応
- ユーザーは使用するSDKを自分でインストールする必要がある
- カスタムProviderを作成しやすい
