/**
 * ai-agent-house — Retry & Circuit Breaker Utilities
 *
 * Provides resilient execution patterns for LLM provider calls.
 * @module
 */

import {
  RateLimitError,
  TimeoutError,
  NetworkError,
  ProviderError,
} from "./errors.js";

// ─── Retry ──────────────────────────────────────────────────

/** Options for the retry utility */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds for exponential backoff (default: 1000) */
  baseDelayMs?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelayMs?: number;
  /** Jitter factor (0-1) to randomize delay (default: 0.1) */
  jitter?: number;
  /** Predicate to determine if an error is retryable */
  isRetryable?: (error: unknown) => boolean;
  /** Callback invoked before each retry */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

/**
 * Default retryable error check.
 * Retries on rate limits, timeouts, and network errors.
 */
function defaultIsRetryable(error: unknown): boolean {
  if (error instanceof RateLimitError) return true;
  if (error instanceof TimeoutError) return true;
  if (error instanceof NetworkError) return true;
  // Retry on 5xx server errors
  if (error instanceof ProviderError && error.statusCode && error.statusCode >= 500) {
    return true;
  }
  return false;
}

/**
 * Calculate delay with exponential backoff and jitter.
 */
function calculateDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  jitter: number,
  rateLimitRetryMs?: number
): number {
  // If rate limit provides a retry-after, use it
  if (rateLimitRetryMs && rateLimitRetryMs > 0) {
    return Math.min(rateLimitRetryMs, maxDelayMs);
  }

  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const jitterAmount = exponentialDelay * jitter * Math.random();
  return Math.min(exponentialDelay + jitterAmount, maxDelayMs);
}

/**
 * Execute a function with retry logic.
 *
 * Uses exponential backoff with jitter. Respects rate limit
 * retry-after headers when available.
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration
 * @returns The result of the function
 * @throws The last error if all retries are exhausted
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => provider.generate(messages),
 *   { maxRetries: 3, baseDelayMs: 1000 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30_000,
    jitter = 0.1,
    isRetryable = defaultIsRetryable,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt or error isn't retryable
      if (attempt >= maxRetries || !isRetryable(error)) {
        throw error;
      }

      const rateLimitRetryMs =
        error instanceof RateLimitError ? error.retryAfterMs : undefined;

      const delayMs = calculateDelay(
        attempt,
        baseDelayMs,
        maxDelayMs,
        jitter,
        rateLimitRetryMs
      );

      onRetry?.(error, attempt + 1, delayMs);

      await sleep(delayMs);
    }
  }

  // Should not reach here, but TypeScript needs it
  throw lastError;
}

// ─── Circuit Breaker ────────────────────────────────────────

/** Circuit breaker states */
export type CircuitState = "closed" | "open" | "half-open";

/** Options for the circuit breaker */
export interface CircuitBreakerOptions {
  /** Number of failures before opening the circuit (default: 5) */
  failureThreshold?: number;
  /** Time in milliseconds before attempting recovery (default: 60000) */
  resetTimeoutMs?: number;
  /** Number of successful calls in half-open to close (default: 1) */
  successThreshold?: number;
}

/**
 * Circuit Breaker pattern implementation.
 *
 * Prevents cascading failures by temporarily blocking calls
 * to a failing provider.
 *
 * @example
 * ```typescript
 * const breaker = new CircuitBreaker({ failureThreshold: 3 });
 * const result = await breaker.execute(() => provider.generate(messages));
 * ```
 */
export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;

  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly successThreshold: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 60_000;
    this.successThreshold = options.successThreshold ?? 1;
  }

  /** Current state of the circuit */
  getState(): CircuitState {
    if (this.state === "open") {
      // Check if enough time has passed to try again
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = "half-open";
      }
    }
    return this.state;
  }

  /**
   * Execute a function through the circuit breaker.
   *
   * @param fn - The async function to execute
   * @throws ProviderError if the circuit is open
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const currentState = this.getState();

    if (currentState === "open") {
      throw new ProviderError(
        "Circuit breaker is open — provider is temporarily unavailable",
        "circuit-breaker",
        503
      );
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === "half-open") {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.reset();
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === "half-open") {
      this.state = "open";
      this.successCount = 0;
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = "open";
    }
  }

  /** Reset the circuit to closed state */
  reset(): void {
    this.state = "closed";
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

// ─── Helpers ────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
