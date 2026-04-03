/**
 * Shared tool registration for HumanCheck MCP Server.
 * Used by both stdio (local) and HTTP (remote) transports.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HumanCheckApiClient } from "./api-client.js";

import {
  helpInputSchema,
  handleHelp,
  type HelpInput,
} from "./tools/help.js";
import {
  listProjectsInputSchema,
  handleListProjects,
  type ListProjectsInput,
} from "./tools/list-projects.js";
import {
  createProjectInputSchema,
  handleCreateProject,
  type CreateProjectInput,
} from "./tools/create-project.js";
import {
  archiveProjectInputSchema,
  handleArchiveProject,
  type ArchiveProjectInput,
} from "./tools/archive-project.js";
import {
  unarchiveProjectInputSchema,
  handleUnarchiveProject,
  type UnarchiveProjectInput,
} from "./tools/unarchive-project.js";
import {
  addScenarioInputSchema,
  handleAddScenario,
  type AddScenarioInput,
} from "./tools/add-scenario.js";
import {
  addScenariosInputSchema,
  handleAddScenarios,
  type AddScenariosInput,
} from "./tools/add-scenarios.js";
import {
  createTaskInputSchema,
  handleCreateTask,
  type CreateTaskInput,
} from "./tools/create-task.js";
import {
  quickTestInputSchema,
  handleQuickTest,
  type QuickTestInput,
} from "./tools/quick-test.js";
import {
  listTasksInputSchema,
  handleListTasks,
  type ListTasksInput,
} from "./tools/list-tasks.js";
import {
  getResultsInputSchema,
  handleGetResults,
  type GetResultsInput,
} from "./tools/get-results.js";
import {
  getTestersInputSchema,
  handleGetTesters,
  type GetTestersInput,
} from "./tools/get-testers.js";
import {
  retestInputSchema,
  handleRetest,
  type RetestInput,
} from "./tools/retest.js";
import {
  getProjectInputSchema,
  handleGetProject,
  type GetProjectInput,
} from "./tools/get-project.js";
import {
  updateProjectInputSchema,
  handleUpdateProject,
  type UpdateProjectInput,
} from "./tools/update-project.js";
import {
  listScenariosInputSchema,
  handleListScenarios,
  type ListScenariosInput,
} from "./tools/list-scenarios.js";
import {
  updateScenarioInputSchema,
  handleUpdateScenario,
  type UpdateScenarioInput,
} from "./tools/update-scenario.js";
import {
  deleteScenarioInputSchema,
  handleDeleteScenario,
  type DeleteScenarioInput,
} from "./tools/delete-scenario.js";
import {
  cancelTaskInputSchema,
  handleCancelTask,
  type CancelTaskInput,
} from "./tools/cancel-task.js";
import {
  guidedTestInputSchema,
  handleGuidedTest,
  type GuidedTestInput,
} from "./tools/guided-test.js";
import {
  guidedTestSubmitInputSchema,
  handleGuidedTestSubmit,
  type GuidedTestSubmitInput,
} from "./tools/guided-test-submit.js";

export function registerTools(
  server: McpServer,
  client: HumanCheckApiClient
): void {
  server.tool(
    "humancheck_help",
    "Show usage guide for HumanCheck. Call this when the user asks how to use HumanCheck, needs help, or says 'help'. Topics: overview, workflow, quick-test, results, testers, retest.",
    helpInputSchema,
    async (args) => handleHelp(args as unknown as HelpInput, client)
  );

  server.tool(
    "humancheck_list_projects",
    "List your existing projects. ALWAYS call this before humancheck_create_project to check for duplicates. If a project for the target URL exists, use humancheck_add_scenarios instead of creating a new one. Returns project name, URL, ID, and status.",
    listProjectsInputSchema,
    async (args) =>
      handleListProjects(args as unknown as ListProjectsInput, client)
  );

  server.tool(
    "humancheck_create_project",
    `Create a new project for human testing. A project groups scenarios and tasks for a specific app URL.

IMPORTANT — Before calling this tool:
1. ALWAYS call humancheck_list_projects first
2. If a project for this URL already exists, use humancheck_add_scenarios instead
3. The server REJECTS duplicate projects for the same URL (409 error)

One app URL = one project. Different test topics are SCENARIOS, not separate projects.`,
    createProjectInputSchema,
    async (args) =>
      handleCreateProject(args as unknown as CreateProjectInput, client)
  );

  server.tool(
    "humancheck_archive_project",
    "Archive a project (soft delete). The project is hidden from default listings but test history and tester work data are preserved. Use when a project is no longer needed.",
    archiveProjectInputSchema,
    async (args) =>
      handleArchiveProject(args as unknown as ArchiveProjectInput, client)
  );

  server.tool(
    "humancheck_unarchive_project",
    "Restore an archived project back to active status. The project will appear in default listings again. Use when you need to reactivate a previously archived project.",
    unarchiveProjectInputSchema,
    async (args) =>
      handleUnarchiveProject(args as unknown as UnarchiveProjectInput, client)
  );

  server.tool(
    "humancheck_add_scenario",
    `Add a test scenario to an existing project. This is the correct way to test a new aspect of an app — do NOT create a separate project. Each scenario has a title and ordered steps with instructions and expected results. Add as many scenarios as needed, then use humancheck_create_task to dispatch testers.

IMPORTANT — Scenario Quality Rules (follow BEFORE calling this tool):
1. If the target app's codebase is available, read routes/pages/components FIRST to verify what actually exists in the UI
2. If only a URL is available, fetch the page to see real elements
3. Every step instruction must reference a REAL UI element — never assume buttons/fields exist without checking
4. Every expected result must describe REAL behavior verified from code or observation
5. Do NOT test features that don't exist (e.g., "Forgot password" if no such link is implemented)
6. Steps must follow real navigation flow — include login if pages require auth
7. 3-5 steps per scenario, each = one action + one verifiable result
8. Quality checklist: page exists? fields exist? behavior matches code? no ghost references?`,
    addScenarioInputSchema,
    async (args) =>
      handleAddScenario(args as unknown as AddScenarioInput, client)
  );

  server.tool(
    "humancheck_add_scenarios",
    `Bulk-add multiple test scenarios to a project in one call. Returns scenarioIds — save them to pass to humancheck_create_task.

Each scenario has a title and ordered steps with instructions and expected results. Only add scenarios for ONE test topic per call, then create a task with those scenarioIds.

IMPORTANT — Verify UI elements exist before referencing them in steps.`,
    addScenariosInputSchema,
    async (args) =>
      handleAddScenarios(args as unknown as AddScenariosInput, client)
  );

  server.tool(
    "humancheck_create_task",
    `Create a task to dispatch human testers for a specific test topic.

IMPORTANT: Always pass scenarioIds to scope the task to specific scenarios. Without scenarioIds, ALL project scenarios are included in one task — this mixes unrelated test topics and produces unclear results.

Correct pattern: add_scenarios → save returned IDs → create_task(scenarioIds: [...]).
Each test topic (e.g., "contact form", "booking button") should be a separate task.`,
    createTaskInputSchema,
    async (args) =>
      handleCreateTask(args as unknown as CreateTaskInput, client)
  );

  server.tool(
    "humancheck_quick_test",
    `Programmatic test creation for automated pipelines and CI/CD. For interactive use, prefer humancheck_test instead — it guides the user through every step.

Generates scenarios from a description and launches a test. Works for both new and existing projects.`,
    quickTestInputSchema,
    async (args) =>
      handleQuickTest(args as unknown as QuickTestInput, client)
  );

  server.tool(
    "humancheck_list_tasks",
    "List human test tasks with status, round info, and pass rates. Optionally filter by status (DRAFT, ACTIVE, IN_PROGRESS, COMPLETED) or project ID.",
    listTasksInputSchema,
    async (args) =>
      handleListTasks(args as unknown as ListTasksInput, client)
  );

  server.tool(
    "humancheck_get_results",
    "Get results from a human test task. Returns structured AI feedback with issues sorted by severity, pass rates, and consensus scores. After showing results, ask the user if they want to fix the issues or start a retest.",
    getResultsInputSchema,
    async (args) =>
      handleGetResults(args as unknown as GetResultsInput, client)
  );

  server.tool(
    "humancheck_get_testers",
    "Get profiles and stats of testers assigned to a task. Shows tester name, expertise areas, bio, total tests completed, and per-task pass rates. Use after get_results to understand who tested and their credibility.",
    getTestersInputSchema,
    async (args) =>
      handleGetTesters(args as unknown as GetTestersInput, client)
  );

  server.tool(
    "humancheck_retest",
    "Start a retest round for a task. Before calling, show the user which scenarios failed in the last round and ask which ones to retest. If no scenarioIds provided, all scenarios are retested.",
    retestInputSchema,
    async (args) => handleRetest(args as unknown as RetestInput, client)
  );

  server.tool(
    "humancheck_get_project",
    "Get full details for a single project including its scenarios.",
    getProjectInputSchema,
    async (args) =>
      handleGetProject(args as unknown as GetProjectInput, client)
  );

  server.tool(
    "humancheck_update_project",
    "Update a project's name, description, URL, or auto-accept preference.",
    updateProjectInputSchema,
    async (args) =>
      handleUpdateProject(args as unknown as UpdateProjectInput, client)
  );

  server.tool(
    "humancheck_list_scenarios",
    "List all scenarios for a project with step details.",
    listScenariosInputSchema,
    async (args) =>
      handleListScenarios(args as unknown as ListScenariosInput, client)
  );

  server.tool(
    "humancheck_update_scenario",
    "Update a scenario's title, steps, or screenshot URL. Steps are fully replaced if provided.",
    updateScenarioInputSchema,
    async (args) =>
      handleUpdateScenario(args as unknown as UpdateScenarioInput, client)
  );

  server.tool(
    "humancheck_delete_scenario",
    "Permanently delete a scenario. Cannot be undone.",
    deleteScenarioInputSchema,
    async (args) =>
      handleDeleteScenario(args as unknown as DeleteScenarioInput, client)
  );

  server.tool(
    "humancheck_cancel_task",
    "Cancel a task, stopping it and releasing assigned testers. Cannot cancel COMPLETED or already CANCELLED tasks.",
    cancelTaskInputSchema,
    async (args) =>
      handleCancelTask(args as unknown as CancelTaskInput, client)
  );

  // ─── Guided workflow tools ───

  server.tool(
    "humancheck_test",
    `Start a guided human test. This is the PREFERRED way to create tests.

The server shows a project picker (existing projects + create new). Then asks for test details. Scenario confirmation is always shown before dispatch.

If the user already said WHAT to test (e.g., "test the contact form"), pass it as testTopic. The server will skip that form.

USE THIS TOOL WHEN: The user wants to create a test, test with humans, or says "test oluştur".
DO NOT USE quick_test: That tool is for programmatic/automated use only.`,
    guidedTestInputSchema,
    async (args) => handleGuidedTest(args as unknown as GuidedTestInput, client, server)
  );

  server.tool(
    "humancheck_test_submit",
    `Submit a test after collecting input from the user. Only use this if humancheck_test returned a COLLECT_INPUT fallback response.

IMPORTANT: dryRun defaults to TRUE. The first call always previews scenarios. Show the preview to the user, get their approval, then call again with dryRun: false.`,
    guidedTestSubmitInputSchema,
    async (args) =>
      handleGuidedTestSubmit(args as unknown as GuidedTestSubmitInput, client)
  );
}
