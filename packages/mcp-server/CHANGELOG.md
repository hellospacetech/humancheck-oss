# @humancheck/mcp-server

## 0.3.0

### Minor Changes

- a8d6296: Major MCP server update with 8 new tools and DX improvements

  New tools:

  - humancheck_add_scenario: Add single test scenario to project
  - humancheck_add_scenarios: Bulk-add multiple scenarios in one call
  - humancheck_create_project: Create a new project
  - humancheck_archive_project: Archive a project
  - humancheck_unarchive_project: Restore archived project
  - humancheck_list_projects: List all projects
  - humancheck_get_testers: Get tester details for a task
  - humancheck_help: Platform usage guide

  Improvements:

  - humancheck_create_task: Supports inline scenario creation
  - humancheck_get_results: includeTesters flag merges tester data
  - humancheck_quick_test: AI-powered scenario generation (Claude Haiku, keyword fallback)
  - humancheck_quick_test: App URL dedup + optional projectId reuse
  - Bulk scenario API for faster workflow

## 0.1.0

### Initial Release

- Model Context Protocol server implementation
- HumanCheck API client integration
- MCP tools for project, task, and feedback management
