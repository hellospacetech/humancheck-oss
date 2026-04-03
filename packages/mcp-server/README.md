# @humancheck/mcp-server

[Model Context Protocol](https://modelcontextprotocol.io) server for [HumanCheck](https://humancheckme.com) — trigger human validation tests directly from Claude Desktop or Claude Code.

## Setup

Get your API key from [humancheckme.com/settings](https://app.humancheckme.com/settings/api-keys).

### Claude Code (recommended)

```bash
claude mcp add --transport http humancheck https://api.humancheckme.com/mcp \
  --header "Authorization: Bearer YOUR_API_KEY"
```

Then start a new Claude Code conversation.

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "humancheck": {
      "command": "npx",
      "args": ["-y", "humancheck-mcp"],
      "env": {
        "HUMANCHECK_API_KEY": "YOUR_API_KEY",
        "HUMANCHECK_API_URL": "https://api.humancheckme.com"
      }
    }
  }
}
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `humancheck_help` | Usage guide and workflow reference |
| `humancheck_create_project` | Create a project for testing |
| `humancheck_list_projects` | List your projects |
| `humancheck_get_project` | Get project details with scenarios |
| `humancheck_update_project` | Update project name, URL, description |
| `humancheck_archive_project` | Archive a project |
| `humancheck_unarchive_project` | Restore an archived project |
| `humancheck_add_scenario` | Add a test scenario |
| `humancheck_add_scenarios` | Bulk-add multiple scenarios |
| `humancheck_list_scenarios` | List scenarios for a project |
| `humancheck_update_scenario` | Update a scenario |
| `humancheck_delete_scenario` | Delete a scenario |
| `humancheck_create_task` | Dispatch human testers |
| `humancheck_quick_test` | Generate scenarios + dispatch in one call |
| `humancheck_list_tasks` | List tasks with status |
| `humancheck_get_results` | Get test results and AI feedback |
| `humancheck_get_testers` | Get tester profiles and stats |
| `humancheck_retest` | Start a retest round |
| `humancheck_cancel_task` | Cancel a running task |

## Usage with Claude

Once configured, ask Claude:

> "Create a human test for my app at https://myapp.com — have 3 testers check the signup flow"

> "Show me the results for task abc123"

> "List all my active tests"

## License

[MIT](../../LICENSE)
