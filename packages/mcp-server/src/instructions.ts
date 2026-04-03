/**
 * MCP Server instructions — sent to AI clients during initialization.
 * Points to humancheck_test as the primary entry point.
 */
export const HUMANCHECK_INSTRUCTIONS = `
# HumanCheck MCP

## Primary: Use humancheck_test
When the user wants to create a test, call **humancheck_test**. It takes zero parameters — the server will ask the user for every detail (URL, test topic, tester count) via interactive forms. This is the correct and preferred workflow.

Do NOT use humancheck_quick_test for interactive use — it is for programmatic/automated pipelines only.

## Other tools
- humancheck_list_projects, humancheck_get_results, humancheck_list_tasks, humancheck_retest — use these for querying and managing existing tests.
- humancheck_add_scenarios, humancheck_create_task — advanced atomic tools for power users.

## Rules
1. **Never guess the app URL.** The server asks the user directly. Do not infer from code.
2. **Project = Domain, Task = Test Topic.** One project per app URL. Each test topic gets its own task.
`.trim();
