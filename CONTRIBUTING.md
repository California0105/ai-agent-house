# Contributing to ai-agent-house

Thank you for your interest in contributing! 🏠🤖

## How to Contribute

### Reporting Bugs

1. Check if the issue already exists in [GitHub Issues](https://github.com/California0105/ai-agent-house/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node.js version, OS, etc.)

### Suggesting Features

1. Open a [GitHub Discussion](https://github.com/California0105/ai-agent-house/discussions) or Issue
2. Describe the feature and its use case
3. Include code examples if applicable

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `npm test`
6. Run linting: `npm run lint`
7. Run type checking: `npm run typecheck`
8. Commit with clear messages: `git commit -m "feat: add translator agent"`
9. Push and create a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/California0105/ai-agent-house.git
cd ai-agent-house

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build
npm run build
```

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Adding or updating tests
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

### Creating a New Agent

To add a new built-in agent:

1. Create `src/agents/your-agent.ts`
2. Extend the `Agent` base class
3. Add tests in `src/agents/__tests__/your-agent.test.ts`
4. Export from `src/agents/index.ts`
5. Document in README.md

### Code Style

- TypeScript strict mode
- ESM modules
- Descriptive variable names
- JSDoc comments for public APIs

## Code of Conduct

Be respectful, inclusive, and constructive. We're all building something together! 🦞

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
