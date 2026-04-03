/**
 * Elicitation helpers — capability detection and form builders.
 * Used by guided-test.ts to ask the user for input via MCP elicitation.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ElicitResult } from "@modelcontextprotocol/sdk/types.js";
import type { ProjectResponse } from "../api-client.js";

/**
 * Check if the connected client supports form elicitation.
 */
export function supportsElicitation(mcpServer: McpServer): boolean {
  const caps = mcpServer.server.getClientCapabilities();
  return !!(caps as any)?.elicitation;
}

/**
 * Step 1: Show existing projects + "Create new" option.
 * User picks from a dropdown instead of typing a URL.
 */
export async function askProjectSelection(
  mcpServer: McpServer,
  projects: ProjectResponse[]
): Promise<ElicitResult> {
  const activeProjects = projects.filter((p) => p.status === "ACTIVE");

  const enumValues = [
    ...activeProjects.map((p) => p.id),
    "_new",
  ];
  const enumNames = [
    ...activeProjects.map((p) => `${p.name} — ${p.appUrl}`),
    "Create new project",
  ];

  return mcpServer.server.elicitInput({
    message:
      activeProjects.length > 0
        ? "Select a project or create a new one:"
        : "No existing projects. Let's create one:",
    requestedSchema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          title: "Project",
          enum: enumValues,
          enumNames,
        },
      },
      required: ["project"],
    },
  });
}

/**
 * Ask for a URL when creating a new project.
 */
export async function askNewProjectUrl(
  mcpServer: McpServer
): Promise<ElicitResult> {
  return mcpServer.server.elicitInput({
    message: "What app do you want to test?",
    requestedSchema: {
      type: "object",
      properties: {
        appUrl: {
          type: "string",
          title: "App URL",
          description:
            "Full URL of the app to test (e.g., https://myapp.com)",
          format: "uri",
        },
      },
      required: ["appUrl"],
    },
  });
}

/**
 * Ask what to test and test configuration.
 */
export async function askTestConfig(
  mcpServer: McpServer,
  projectName: string
): Promise<ElicitResult> {
  return mcpServer.server.elicitInput({
    message: `What do you want to test on ${projectName}?`,
    requestedSchema: {
      type: "object",
      properties: {
        testTopic: {
          type: "string",
          title: "Test topic",
          description:
            'What to test (e.g., "contact form", "login flow", "checkout")',
        },
        testerCount: {
          type: "integer",
          title: "Number of testers",
          description: "1-20 testers",
          minimum: 1,
          maximum: 20,
        },
        difficulty: {
          type: "string",
          title: "Difficulty",
          enum: ["EASY", "MEDIUM", "HARD"],
          enumNames: ["Easy", "Medium", "Hard"],
        },
      },
      required: ["testTopic"],
    },
  });
}

/**
 * Show generated scenarios with step details and ask for confirmation.
 */
export async function askScenarioConfirmation(
  mcpServer: McpServer,
  testTopic: string,
  scenarios: Array<{ title: string; steps: Array<{ instruction: string; expectedResult: string }> }>
): Promise<ElicitResult> {
  const detail = scenarios
    .map((s, i) => {
      const stepSummary = s.steps
        .map((step, j) => `   ${j + 1}. ${step.instruction}`)
        .join("\n");
      return `${i + 1}. ${s.title} (${s.steps.length} steps)\n${stepSummary}`;
    })
    .join("\n\n");

  return mcpServer.server.elicitInput({
    message: `Generated ${scenarios.length} scenario(s) for "${testTopic}":\n\n${detail}\n`,
    requestedSchema: {
      type: "object",
      properties: {
        proceed: {
          type: "string",
          title: "Decision",
          enum: ["yes", "edit", "cancel"],
          enumNames: [
            "Proceed — dispatch testers",
            "Let me describe what I want differently",
            "Cancel",
          ],
        },
      },
      required: ["proceed"],
    },
  });
}
