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
  createTestInputSchema,
  handleCreateTest,
  type CreateTestInput,
} from "./tools/create-test.js";
import {
  getResultsInputSchema,
  handleGetResults,
  type GetResultsInput,
} from "./tools/get-results.js";
import {
  listTasksInputSchema,
  handleListTasks,
  type ListTasksInput,
} from "./tools/list-tasks.js";
import {
  quickTestInputSchema,
  handleQuickTest,
  type QuickTestInput,
} from "./tools/quick-test.js";
import {
  retestInputSchema,
  handleRetest,
  type RetestInput,
} from "./tools/retest.js";

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
  "humancheck_create_test",
  `Create a human test with real human testers. IMPORTANT workflow — ask the user ALL of these before calling:
1. Analyze the codebase and suggest test scenarios. Present each one and let the user select/deselect.
2. Ask: "How many testers should test this?" (default: 3, range: 1-20)
3. Ask: "Difficulty level?" (EASY / MEDIUM / HARD — affects tester matching)
4. Ask: "Should testers be auto-accepted or do you want to approve each one?" (auto-accept default: on)
5. Ask: "Any deadline for this test?" (optional)
Only call this tool after the user confirms all choices. Never auto-submit.`,
  createTestInputSchema,
  async (args) => {
    return handleCreateTest(args as unknown as CreateTestInput, apiClient);
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
  "humancheck_list_tasks",
  "List all human test tasks with their status, round info, and pass rates. Optionally filter by status (DRAFT, ACTIVE, IN_PROGRESS, COMPLETED).",
  listTasksInputSchema,
  async (args) => {
    return handleListTasks(args as unknown as ListTasksInput, apiClient);
  }
);

server.tool(
  "humancheck_quick_test",
  `Quick test from a description. IMPORTANT workflow — before calling:
1. Generate scenarios from the description and present them to the user for approval.
2. Ask: "How many testers?" (default: 3)
3. Ask: "Auto-accept testers or manual approval?"
4. Only call after user confirms scenario selection and settings.`,
  quickTestInputSchema,
  async (args) => {
    return handleQuickTest(args as unknown as QuickTestInput, apiClient);
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
