#!/usr/bin/env node

/**
 * HumanCheckMe MCP Server
 *
 * Allows Claude Desktop and Claude Code users to trigger human tests
 * directly from their AI assistant.
 *
 * Transport: stdio
 * Auth: HUMANCHECK_API_KEY env var
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createApiClient, HumanCheckApiClient } from "./api-client.js";
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
  addScenarioInputSchema,
  handleAddScenario,
  type AddScenarioInput,
} from "./tools/add-scenario.js";
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
  addScenariosInputSchema,
  handleAddScenarios,
  type AddScenariosInput,
} from "./tools/add-scenarios.js";
import {
  retestInputSchema,
  handleRetest,
  type RetestInput,
} from "./tools/retest.js";
import {
  helpInputSchema,
  handleHelp,
  type HelpInput,
} from "./tools/help.js";
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

// --- Initialize API client ---
let apiClient: HumanCheckApiClient;
try {
  apiClient = createApiClient();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[HumanCheckMe MCP] Error: ${message}\n`);
  process.exit(1);
}

// --- Create MCP server ---
const server = new McpServer(
  {
    name: "humancheckme",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// --- Register tools ---

server.tool(
  "humancheck_help",
  "Show usage guide for HumanCheck. Call this when the user asks how to use HumanCheck, needs help, or says 'help'. Topics: overview, workflow, quick-test, results, testers, retest.",
  helpInputSchema,
  async (args) => {
    return handleHelp(args as unknown as HelpInput, apiClient);
  }
);

server.tool(
  "humancheck_list_projects",
  "List your existing projects. Use this to find a project's ID before adding scenarios or creating tasks. Returns project name, URL, and ID.",
  listProjectsInputSchema,
  async (args) => {
    return handleListProjects(args as unknown as ListProjectsInput, apiClient);
  }
);

server.tool(
  "humancheck_create_project",
  "Create a new project for human testing. Step 1 of the test workflow. A project groups scenarios and tasks for a specific app URL. After creating, use humancheck_add_scenario to define what to test.",
  createProjectInputSchema,
  async (args) => {
    return handleCreateProject(args as unknown as CreateProjectInput, apiClient);
  }
);

server.tool(
  "humancheck_archive_project",
  "Archive a project (soft delete). The project is hidden from default listings but test history and tester work data are preserved. Use when a project is no longer needed.",
  archiveProjectInputSchema,
  async (args) => {
    return handleArchiveProject(args as unknown as ArchiveProjectInput, apiClient);
  }
);

server.tool(
  "humancheck_unarchive_project",
  "Restore an archived project back to active status. The project will appear in default listings again. Use when you need to reactivate a previously archived project.",
  unarchiveProjectInputSchema,
  async (args) => {
    return handleUnarchiveProject(args as unknown as UnarchiveProjectInput, apiClient);
  }
);

server.tool(
  "humancheck_add_scenario",
  `Add a test scenario to an existing project. Step 2 (repeatable). Each scenario has a title and ordered steps with instructions and expected results. Add as many scenarios as needed, then use humancheck_create_task to dispatch testers.

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
  async (args) => {
    return handleAddScenario(args as unknown as AddScenarioInput, apiClient);
  }
);

server.tool(
  "humancheck_add_scenarios",
  `Bulk-add multiple test scenarios to a project in one call. More efficient than calling add_scenario repeatedly. Each scenario has a title and ordered steps with instructions and expected results.

IMPORTANT — Same quality rules as add_scenario apply: verify UI elements exist before referencing them in steps.`,
  addScenariosInputSchema,
  async (args) => {
    return handleAddScenarios(args as unknown as AddScenariosInput, apiClient);
  }
);

server.tool(
  "humancheck_create_task",
  "Create a task to dispatch human testers. Step 3 (final). The project must already have at least one scenario (or provide inline scenarios). Specify tester count, difficulty, and optional deadline. Testers will be matched and begin testing.",
  createTaskInputSchema,
  async (args) => {
    return handleCreateTask(args as unknown as CreateTaskInput, apiClient);
  }
);

server.tool(
  "humancheck_quick_test",
  `Quick test: generates scenarios from a description and launches a test. Works for both new and existing projects. If projectId is given, adds to that project. If appUrl matches an existing project, reuses it automatically. Otherwise creates a new project. Supports difficulty and deadline options.

IMPORTANT — Before generating scenarios: if the target app's codebase is accessible, read routes/pages/components to verify what UI elements actually exist. Generate scenarios that reference real buttons, fields, and behaviors — not assumptions.`,
  quickTestInputSchema,
  async (args) => {
    return handleQuickTest(args as unknown as QuickTestInput, apiClient);
  }
);

server.tool(
  "humancheck_list_tasks",
  "List human test tasks with status, round info, and pass rates. Optionally filter by status (DRAFT, ACTIVE, IN_PROGRESS, COMPLETED) or project ID.",
  listTasksInputSchema,
  async (args) => {
    return handleListTasks(args as unknown as ListTasksInput, apiClient);
  }
);

server.tool(
  "humancheck_get_results",
  "Get results from a human test task. Returns structured AI feedback with issues sorted by severity, pass rates, and consensus scores. After showing results, ask the user if they want to fix the issues or start a retest.",
  getResultsInputSchema,
  async (args) => {
    return handleGetResults(args as unknown as GetResultsInput, apiClient);
  }
);

server.tool(
  "humancheck_get_testers",
  "Get profiles and stats of testers assigned to a task. Shows tester name, expertise areas, bio, total tests completed, and per-task pass rates. Use after get_results to understand who tested and their credibility.",
  getTestersInputSchema,
  async (args) => {
    return handleGetTesters(args as unknown as GetTestersInput, apiClient);
  }
);

server.tool(
  "humancheck_retest",
  "Start a retest round for a task. Before calling, show the user which scenarios failed in the last round and ask which ones to retest. If no scenarioIds provided, all scenarios are retested.",
  retestInputSchema,
  async (args) => {
    return handleRetest(args as unknown as RetestInput, apiClient);
  }
);

server.tool(
  "humancheck_get_project",
  "Get full details for a single project including its scenarios.",
  getProjectInputSchema,
  async (args) => {
    return handleGetProject(args as unknown as GetProjectInput, apiClient);
  }
);

server.tool(
  "humancheck_update_project",
  "Update a project's name, description, URL, or auto-accept preference.",
  updateProjectInputSchema,
  async (args) => {
    return handleUpdateProject(args as unknown as UpdateProjectInput, apiClient);
  }
);

server.tool(
  "humancheck_list_scenarios",
  "List all scenarios for a project with step details.",
  listScenariosInputSchema,
  async (args) => {
    return handleListScenarios(args as unknown as ListScenariosInput, apiClient);
  }
);

server.tool(
  "humancheck_update_scenario",
  "Update a scenario's title, steps, or screenshot URL. Steps are fully replaced if provided.",
  updateScenarioInputSchema,
  async (args) => {
    return handleUpdateScenario(args as unknown as UpdateScenarioInput, apiClient);
  }
);

server.tool(
  "humancheck_delete_scenario",
  "Permanently delete a scenario. Cannot be undone.",
  deleteScenarioInputSchema,
  async (args) => {
    return handleDeleteScenario(args as unknown as DeleteScenarioInput, apiClient);
  }
);

server.tool(
  "humancheck_cancel_task",
  "Cancel a task, stopping it and releasing assigned testers. Cannot cancel COMPLETED or already CANCELLED tasks.",
  cancelTaskInputSchema,
  async (args) => {
    return handleCancelTask(args as unknown as CancelTaskInput, apiClient);
  }
);

// --- Start server ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("[HumanCheckMe MCP] Server started on stdio\n");
}

main().catch((error) => {
  process.stderr.write(
    `[HumanCheckMe MCP] Fatal error: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exit(1);
});
