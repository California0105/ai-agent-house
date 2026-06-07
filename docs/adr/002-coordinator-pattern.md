# ADR 002: Coordinator Pattern for Housekeeper

## Status

Accepted

## Context

HousekeeperAgentは当初、他のAgentと同等のAgentとして扱われていた。しかしマルチエージェントシステムでは、タスクの分析・分配・統合を行うCoordinatorが必要。

## Decision

- `HousekeeperAgent` にCoordinator機能を追加（`coordinateTask()`メソッド）
- サブタスク生成 → Agent割当 → 実行 → 統合のフロー
- LLM接続時はAIがインテリジェントにタスク分析
- LLM未接続時はCapabilityベースのヒューリスティックマッチング

## Rationale

1. **段階的導入**: Coordinatorはoptional — 通常のDiscussionも引き続き動作
2. **Housekeeper昇格**: 既存の `canHandle() => true` の設計意図と一致
3. **LLMあり/なし両対応**: フォールバック設計で開発体験を損なわない

## Consequences

- Coordinator使用はオプトイン（`coordinateTask()`を明示的に呼ぶ）
- 通常の `discuss()` は従来通りの動作（後方互換）
- 将来的にはLLMを使ったインテリジェントなタスク分析が可能
