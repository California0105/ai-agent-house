import { describe, it, expect, vi } from "vitest";
import {
  withRetry,
  CircuitBreaker,
} from "./retry.js";
import {
  AgentHouseError,
  ProviderError,
  RateLimitError,
  TimeoutError,
  NetworkError,
  ToolError,
  AgentError,
  MemoryError,
} from "./errors.js";

// ─── Error Classes ──────────────────────────────────────────

describe("Error Classes", () => {
  it("should create AgentHouseError with name", () => {
    const error = new AgentHouseError("test error");
    expect(error.name).toBe("AgentHouseError");
    expect(error.message).toBe("test error");
    expect(error).toBeInstanceOf(Error);
  });

  it("should create ProviderError with provider info", () => {
    const error = new ProviderError("fail", "openai", 500);
    expect(error.name).toBe("ProviderError");
    expect(error.provider).toBe("openai");
    expect(error.statusCode).toBe(500);
    expect(error).toBeInstanceOf(AgentHouseError);
  });

  it("should create RateLimitError with retry info", () => {
    const error = new RateLimitError("openai", 5000);
    expect(error.name).toBe("RateLimitError");
    expect(error.statusCode).toBe(429);
    expect(error.retryAfterMs).toBe(5000);
    expect(error).toBeInstanceOf(ProviderError);
  });

  it("should create TimeoutError", () => {
    const error = new TimeoutError("anthropic", 30000);
    expect(error.name).toBe("TimeoutError");
    expect(error.timeoutMs).toBe(30000);
    expect(error).toBeInstanceOf(ProviderError);
  });

  it("should create NetworkError", () => {
    const error = new NetworkError("google");
    expect(error.name).toBe("NetworkError");
    expect(error.provider).toBe("google");
    expect(error).toBeInstanceOf(ProviderError);
  });

  it("should create ToolError", () => {
    const error = new ToolError("web-search", "API key missing");
    expect(error.name).toBe("ToolError");
    expect(error.toolName).toBe("web-search");
    expect(error).toBeInstanceOf(AgentHouseError);
  });

  it("should create AgentError", () => {
    const error = new AgentError("agent-1", "processing failed");
    expect(error.name).toBe("AgentError");
    expect(error.agentId).toBe("agent-1");
    expect(error).toBeInstanceOf(AgentHouseError);
  });

  it("should create MemoryError", () => {
    const error = new MemoryError("storage full");
    expect(error.name).toBe("MemoryError");
    expect(error).toBeInstanceOf(AgentHouseError);
  });

  it("should support error cause chaining", () => {
    const cause = new Error("original");
    const error = new ProviderError("wrapped", "openai", 500, {
      cause,
    });
    expect(error.cause).toBe(cause);
  });
});

// ─── withRetry ──────────────────────────────────────────────

describe("withRetry", () => {
  it("should return result on success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry on retryable errors", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new NetworkError("openai"))
      .mockResolvedValue("ok");

    const result = await withRetry(fn, {
      maxRetries: 2,
      baseDelayMs: 1,
    });

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should throw immediately for non-retryable errors", async () => {
    const fn = vi
      .fn()
      .mockRejectedValue(new ProviderError("bad request", "openai", 400));

    await expect(
      withRetry(fn, { maxRetries: 3, baseDelayMs: 1 })
    ).rejects.toThrow("bad request");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should exhaust retries and throw last error", async () => {
    const fn = vi
      .fn()
      .mockRejectedValue(new NetworkError("openai"));

    await expect(
      withRetry(fn, { maxRetries: 2, baseDelayMs: 1 })
    ).rejects.toThrow(NetworkError);
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("should call onRetry callback", async () => {
    const onRetry = vi.fn();
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new TimeoutError("openai", 5000))
      .mockResolvedValue("ok");

    await withRetry(fn, {
      maxRetries: 1,
      baseDelayMs: 1,
      onRetry,
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(
      expect.any(TimeoutError),
      1,
      expect.any(Number)
    );
  });

  it("should retry on RateLimitError", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new RateLimitError("openai", 10))
      .mockResolvedValue("ok");

    const result = await withRetry(fn, {
      maxRetries: 1,
      baseDelayMs: 1,
    });
    expect(result).toBe("ok");
  });

  it("should use custom isRetryable predicate", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("custom error"))
      .mockResolvedValue("ok");

    const result = await withRetry(fn, {
      maxRetries: 1,
      baseDelayMs: 1,
      isRetryable: (e) => e instanceof Error && e.message === "custom error",
    });
    expect(result).toBe("ok");
  });
});

// ─── CircuitBreaker ─────────────────────────────────────────

describe("CircuitBreaker", () => {
  it("should start in closed state", () => {
    const breaker = new CircuitBreaker();
    expect(breaker.getState()).toBe("closed");
  });

  it("should pass through calls when closed", async () => {
    const breaker = new CircuitBreaker();
    const result = await breaker.execute(() =>
      Promise.resolve("ok")
    );
    expect(result).toBe("ok");
  });

  it("should open after failure threshold", async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
    });

    const failing = () => Promise.reject(new Error("fail"));

    await expect(breaker.execute(failing)).rejects.toThrow();
    expect(breaker.getState()).toBe("closed");

    await expect(breaker.execute(failing)).rejects.toThrow();
    expect(breaker.getState()).toBe("open");
  });

  it("should reject calls when open", async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      resetTimeoutMs: 60000,
    });

    await expect(
      breaker.execute(() => Promise.reject(new Error("fail")))
    ).rejects.toThrow();

    await expect(
      breaker.execute(() => Promise.resolve("ok"))
    ).rejects.toThrow("Circuit breaker is open");
  });

  it("should transition to half-open after timeout", async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      resetTimeoutMs: 1,
    });

    await expect(
      breaker.execute(() => Promise.reject(new Error("fail")))
    ).rejects.toThrow();

    // Wait for reset timeout
    await new Promise((r) => setTimeout(r, 5));
    expect(breaker.getState()).toBe("half-open");
  });

  it("should close after success in half-open", async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      resetTimeoutMs: 1,
      successThreshold: 1,
    });

    await expect(
      breaker.execute(() => Promise.reject(new Error("fail")))
    ).rejects.toThrow();

    await new Promise((r) => setTimeout(r, 5));
    expect(breaker.getState()).toBe("half-open");

    await breaker.execute(() => Promise.resolve("ok"));
    expect(breaker.getState()).toBe("closed");
  });

  it("should reset manually", async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
    });

    await expect(
      breaker.execute(() => Promise.reject(new Error("fail")))
    ).rejects.toThrow();
    expect(breaker.getState()).toBe("open");

    breaker.reset();
    expect(breaker.getState()).toBe("closed");
  });
});
