# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-06-07

### Added
- **LLM Provider Abstraction**: Built-in support for OpenAI, Anthropic, Google, and Local providers via `ProviderFactory`.
- **Tool System**: Agents can now use tools. Added built-in `httpTool`, `fileReaderTool`, and `webSearchTool` (Tavily).
- **Persistent Memory**: Pluggable memory architecture with `JsonFileMemoryProvider` and `SqliteMemoryProvider` (`better-sqlite3`).
- **Resilience**: Added `withRetry` (exponential backoff) and `CircuitBreaker` for fault-tolerant provider calls.
- **Usage Tracking**: Added `UsageTracker` to monitor tokens and calculate costs per agent.
- **Parallel Discussions**: Added `{ parallel: true }` option to `house.discuss()` for faster multi-agent brainstorming.
- **Housekeeper Agent**: Enhanced with task decomposition and delegation capabilities.

### Changed
- `Agent` class now integrates directly with LLM providers to handle automatic prompt building and tool-calling loops.
- Replaced basic mocking in core examples with actual provider integrations.

### Fixed
- Fixed Node.js globals in ESLint config to resolve CI failures.
- Resolved various minor bugs in bulletin board message retrieval.

## [0.1.1] - 2026-06-06

### Fixed
- Normalized `repository.url` in `package.json`.
- Added missing ESLint dev dependencies.

## [0.1.0] - 2026-06-06

### Added
- Initial release of `ai-agent-house`.
- Core architecture: House, Agent, BulletinBoard.
- Built-in agents: Secretary, Writer, Researcher, Housekeeper.
