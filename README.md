# HumanCheck OSS

Open-source SDKs and integrations for [HumanCheck](https://humancheckme.com) — human-in-the-loop validation platform for AI-generated products.

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| [`@humancheck/shared`](./packages/shared) | Shared types, interfaces, and constants | `npm i @humancheck/shared` |
| [`@humancheck/mcp-server`](./packages/mcp-server) | MCP Server for Claude Desktop/Code | `npm i @humancheck/mcp-server` |
| [`@humancheck/telegram-bot`](./packages/telegram-bot) | Telegram bot for feedback collection | `npm i @humancheck/telegram-bot` |

## What is HumanCheck?

HumanCheck lets you validate AI-generated products with real human testers. Create test scenarios, assign testers, and collect structured feedback — via web dashboard, Telegram, or directly from your AI workflow through MCP.

These open-source packages let you integrate with the HumanCheck platform:

- **@humancheck/shared** — TypeScript types and constants used across all integrations
- **@humancheck/mcp-server** — Use Claude Desktop or Claude Code to create tests and view results
- **@humancheck/telegram-bot** — Collect tester feedback through Telegram

## Quick Start

### MCP Server (Claude Integration)

```bash
claude mcp add humancheck -s user \
  -e HUMANCHECK_API_KEY=your-api-key \
  -e HUMANCHECK_API_URL=https://api.humancheckme.com \
  -- npx -y @humancheck/mcp-server@latest
```

Get your API key at [app.humancheckme.com/settings](https://app.humancheckme.com/settings).

### Telegram Bot

```bash
npm install @humancheck/telegram-bot
```

```bash
export TELEGRAM_BOT_TOKEN="your-bot-token"
export HUMANCHECK_API_URL="https://api.humancheckme.com"
export HUMANCHECK_API_KEY="your-api-key"
npx humancheck-bot
```

## Development

```bash
git clone https://github.com/hellospacetech/humancheck-oss.git
cd humancheck-oss
npm install
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Add a changeset (`npx changeset`)
4. Commit your changes
5. Push to the branch
6. Open a Pull Request

## License

[MIT](./LICENSE)
