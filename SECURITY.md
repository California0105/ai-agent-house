# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | ✅ Current release |

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
