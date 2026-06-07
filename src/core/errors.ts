/**
 * ai-agent-house — Custom Error Classes
 *
 * Structured error hierarchy for the multi-agent framework.
 * All errors extend AgentHouseError for unified catch handling.
 * @module
 */

/**
 * Base error class for all ai-agent-house errors.
 */
export class AgentHouseError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AgentHouseError";
  }
}

// ─── Provider Errors ────────────────────────────────────────

/**
 * Error originating from an LLM provider.
 */
export class ProviderError extends AgentHouseError {
  /** The provider type that caused the error (e.g., "openai") */
  readonly provider: string;
  /** HTTP status code, if applicable */
  readonly statusCode?: number;

  constructor(
    message: string,
    provider: string,
    statusCode?: number,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "ProviderError";
    this.provider = provider;
    this.statusCode = statusCode;
  }
}

/**
 * Rate limit exceeded error (HTTP 429).
 */
export class RateLimitError extends ProviderError {
  /** Seconds until the rate limit resets */
  readonly retryAfterMs?: number;

  constructor(
    provider: string,
    retryAfterMs?: number,
    options?: ErrorOptions
  ) {
    super(
      `Rate limit exceeded for provider "${provider}"${retryAfterMs ? ` — retry after ${retryAfterMs}ms` : ""}`,
      provider,
      429,
      options
    );
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Request timeout error.
 */
export class TimeoutError extends ProviderError {
  /** The timeout duration in milliseconds */
  readonly timeoutMs: number;

  constructor(
    provider: string,
    timeoutMs: number,
    options?: ErrorOptions
  ) {
    super(
      `Request to provider "${provider}" timed out after ${timeoutMs}ms`,
      provider,
      408,
      options
    );
    this.name = "TimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Network connectivity error.
 */
export class NetworkError extends ProviderError {
  constructor(
    provider: string,
    message?: string,
    options?: ErrorOptions
  ) {
    super(
      message ?? `Network error connecting to provider "${provider}"`,
      provider,
      undefined,
      options
    );
    this.name = "NetworkError";
  }
}

// ─── Tool Errors ────────────────────────────────────────────

/**
 * Error occurring during tool execution.
 */
export class ToolError extends AgentHouseError {
  /** The tool that caused the error */
  readonly toolName: string;

  constructor(
    toolName: string,
    message: string,
    options?: ErrorOptions
  ) {
    super(`Tool "${toolName}" error: ${message}`, options);
    this.name = "ToolError";
    this.toolName = toolName;
  }
}

// ─── Agent Errors ───────────────────────────────────────────

/**
 * Error occurring within an agent.
 */
export class AgentError extends AgentHouseError {
  /** The agent ID that caused the error */
  readonly agentId: string;

  constructor(
    agentId: string,
    message: string,
    options?: ErrorOptions
  ) {
    super(`Agent "${agentId}" error: ${message}`, options);
    this.name = "AgentError";
    this.agentId = agentId;
  }
}

// ─── Memory Errors ──────────────────────────────────────────

/**
 * Error occurring in memory operations.
 */
export class MemoryError extends AgentHouseError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MemoryError";
  }
}
