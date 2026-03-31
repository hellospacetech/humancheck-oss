# @humancheck/mcp-server

[Model Context Protocol](https://modelcontextprotocol.io) server for [HumanCheck](https://humancheckme.com) — trigger human validation tests directly from Claude Desktop or Claude Code.

## Quick Setup (Claude Code)

```bash
claude mcp add humancheck -s user \
  -e HUMANCHECK_API_KEY=your-api-key \
  -e HUMANCHECK_API_URL=https://api.humancheckme.com \
  -- npx -y @humancheck/mcp-server@latest
```

Get your API key at [app.humancheckme.com/settings](https://app.humancheckme.com/settings).

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "humancheck": {
      "command": "npx",
      "args": ["-y", "@humancheck/mcp-server@latest"],
      "env": {
        "HUMANCHECK_API_URL": "https://api.humancheckme.com",
        "HUMANCHECK_API_KEY": "your-api-key"
      }
    }
  }
}
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `humancheck_create_test` | Create a new human validation test |
| `humancheck_get_results` | Get test results and feedback |
| `humancheck_list_tasks` | List all tasks with status |
| `humancheck_quick_test` | Quick single-scenario test |
| `humancheck_retest` | Re-run a previous test |

## Usage with Claude

Once configured, ask Claude:

> "Create a human test for my app at https://myapp.com — have 3 testers check the signup flow"

> "Show me the results for task abc123"

> "List all my active tests"

## License

[MIT](../../LICENSE)
