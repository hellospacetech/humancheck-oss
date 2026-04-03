# @humancheck/mcp-server

## 0.14.1

### Patch Changes

- Delegate scenario generation to AI client — it has code context for better scenarios. No server-side AI cost.

## 0.14.0

### Minor Changes

- Server-side AI scenario generation. No user ANTHROPIC_API_KEY needed — server handles it.

## 0.13.2

### Patch Changes

- Remove appUrl parameter from humancheck_test — always show project picker dropdown to prevent AI from guessing URLs.

## 0.13.1

### Patch Changes

- Guided test UX: project picker dropdown, optional params from conversation context, rich scenario preview with step details.

## 0.13.0

### Minor Changes

- Add guided workflow with MCP elicitation. humancheck_test is zero-param entry point — server asks user for every decision. Fallback humancheck_test_submit for non-elicitation clients.

## 0.12.0

### Minor Changes

- [`abc3fd8`](https://github.com/hellospacetech/humancheck/commit/abc3fd8add6e1123e4581cf235182fb15a5a4b89) Thanks [@namelooksgreat](https://github.com/namelooksgreat)! - feat: remote MCP server via Streamable HTTP — connect with URL + API key, no npx needed

- Add humancheck-workflow skill as 4th layer of AI workflow enforcement. Setup command now installs skill file. Instructions slimmed to concise safety net. Task = test topic model enforced via scenarioIds.

## 0.9.0

### Minor Changes

- feat: MCP audit findings — new tools + response optimization + bug fixes

  MCP Server:

  - add list_scenarios, update_scenario, delete_scenario tools
  - add get_project, update_project tools
  - add cancel_task tool
  - add dryRun mode to quick_test (review before dispatch)
  - add completedTesters/totalTesters to task responses
  - slim mutation responses (no echo), truncate list descriptions
  - add webhook support for task completion

  Server:

  - fix get_results false positive (consensusScore=null when 0 testers)
  - add scenario CRUD endpoints
  - add task cancel endpoint
  - add webhook callback on task completion

### Patch Changes

- Updated dependencies [438bd0a]
  - @humancheck/shared@0.9.0

## 0.8.0

### Minor Changes

- 473575a: MCP audit fixes — 10 findings addressed, 14 → 20 tools:

  - fix: get_results returns null consensusScore when no testers responded
  - feat: humancheck_get_project (full details + scenario list)
  - feat: humancheck_update_project (name, appUrl, description, autoAcceptTesters)
  - feat: humancheck_list_scenarios (with step details)
  - feat: humancheck_update_scenario (title, steps, screenshotUrl)
  - feat: humancheck_delete_scenario (permanent delete)
  - feat: humancheck_cancel_task (stop task, release testers)
  - feat: quick_test dryRun mode (preview before dispatch)
  - feat: webhookUrl param on create_task + webhook dispatcher on completion
  - feat: completedTesters/totalTesters in list_tasks response
  - refactor: slim mutation responses (remove input echo, shorten hints)
  - refactor: list_projects truncates descriptions to 60 chars

  Server changes:

  - Add webhookUrl column to Task model (migration)
  - Add webhook dispatcher (fire-and-forget POST on task.completed)
  - Accept webhookUrl in task creation endpoint

## 0.7.0

### Minor Changes

- c254687: Initial release — HumanCheck human-in-the-loop validation platform

  - Monorepo with shared types, API server, MCP server, and Telegram bot
  - Express + Prisma backend with Better Auth
  - Model Context Protocol integration for AI workflows
  - Telegram bot for tester feedback collection

- Embed scenario quality rules in tool descriptions

  - humancheck_add_scenario now includes UI-aware scenario writing guidelines
  - humancheck_quick_test description includes codebase verification reminder
  - All MCP users automatically get scenario quality rules when Claude reads tool descriptions
  - Rules: verify UI elements exist, match real behavior, follow navigation flow, 3-5 steps per scenario

### Patch Changes

- Updated dependencies [c254687]
  - @humancheck/shared@0.7.0

## 0.1.0

### Initial Release

- Model Context Protocol server implementation
- HumanCheck API client integration
- MCP tools for project, task, and feedback management
