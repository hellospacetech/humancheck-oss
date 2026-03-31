# @humancheck/mcp-server

[Model Context Protocol](https://modelcontextprotocol.io) server for [HumanCheck](https://humancheckme.com) — trigger human validation tests directly from Claude Desktop or Claude Code.

## Install

```bash
npm install @humancheck/mcp-server
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "humancheckme": {
      "command": "npx",
      "args": ["humancheck-mcp"],
      "env": {
        "HUMANCHECK_API_URL": "https://api.humancheckme.com",
        "HUMANCHECK_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `HUMANCHECK_API_URL` | Yes | HumanCheck API base URL |
| `HUMANCHECK_API_KEY` | Yes | Your API key |

## MCP Tools

| Tool | Description |
|------|-------------|
| `create-test` | Create a new human validation test |
| `get-results` | Get test results and feedback |
| `list-tasks` | List all tasks with status |
| `quick-test` | Quick single-scenario test |
| `retest` | Re-run a previous test |

## Usage with Claude

Once configured, ask Claude:

> "Create a human test for my app at https://myapp.com — have 3 testers check the signup flow"

> "Show me the results for task abc123"

> "List all my active tests"

## License

[MIT](../../LICENSE)
