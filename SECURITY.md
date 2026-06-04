# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | ✅ Current release |

## AI Security & Prompt Injection

As `ai-agent-house` is a framework for orchestrating LLM-based agents, developers must be aware of inherent risks associated with Large Language Models, particularly **Prompt Injection**.

- **Trust Boundary**: The `task` string and bulletin board `messages` are passed directly into the LLM context. If your application accepts untrusted user input, malicious users could craft inputs to override system prompts (Prompt Injection or Jailbreaking).
- **Mitigation**: We recommend sanitizing or validating user input *before* passing it as a `task` to the `House` or individual `Agent`s. Do not grant agents capabilities to execute sensitive system commands or access private databases without strict human-in-the-loop validation.

## Reporting a Vulnerability

If you discover a security vulnerability in ai-agent-house, please report it responsibly:

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Email: [security@California0105.dev](mailto:security@California0105.dev)
3. Or use [GitHub Security Advisories](https://github.com/California0105/ai-agent-house/security/advisories/new)

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Fix & Disclosure**: Within 30 days (coordinated disclosure)

## Security Best Practices

When using ai-agent-house:

- **Never hardcode API keys** — Use environment variables or secret managers
- **Validate agent outputs** — AI-generated content should be reviewed before external use
- **Limit agent permissions** — Use the principle of least privilege for agent capabilities
- **Keep dependencies updated** — Run `npm audit` regularly
- **Review bulletin board data** — Shared memory may contain sensitive information

## Dependency Security

This project uses:
- `npm audit` in CI/CD to detect known vulnerabilities
- Dependabot for automated dependency updates
- Minimal dependencies to reduce attack surface
