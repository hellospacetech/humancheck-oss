# @humancheck/mcp-server

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
