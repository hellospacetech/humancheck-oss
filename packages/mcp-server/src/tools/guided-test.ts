/**
 * humancheck_test — Guided test creation.
 *
 * Accepts optional parameters from conversation context.
 * Only elicits what's missing. Scenario confirmation is always shown.
 *
 * If the client does not support elicitation, returns structured
 * instructions for the AI to collect input conversationally.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HumanCheckApiClient } from "../api-client.js";
import {
  supportsElicitation,
  askProjectSelection,
  askNewProjectUrl,
  askTestConfig,
} from "../lib/elicitation.js";

export const guidedTestInputSchema = {
  testTopic: z
    .string()
    .optional()
    .describe("Test topic if the user already said what to test (e.g., 'contact form', 'booking button'). Pass from conversation context only."),
  testerCount: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .describe("Number of testers if the user specified."),
  difficulty: z
    .enum(["EASY", "MEDIUM", "HARD"])
    .optional()
    .describe("Difficulty if the user specified."),
} as const;

export type GuidedTestInput = {
  testTopic?: string;
  testerCount?: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
};

type ToolResult = { content: Array<{ type: "text"; text: string }> };

function textResult(data: Record<string, unknown>): ToolResult {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Elicitation-powered guided flow.
 * Skips forms for parameters already provided by AI from conversation.
 * Scenario confirmation is ALWAYS shown — never skipped.
 */
async function runElicitationFlow(
  args: GuidedTestInput,
  client: HumanCheckApiClient,
  mcpServer: McpServer
): Promise<ToolResult> {
  let projectId: string;
  let projectName: string;
  let appUrl: string;

  // ── Step 1: Project selection (always shown — never skipped) ──
  const projects = await client.listProjects(false);

  if (projects.length === 0) {
    // No projects — ask for URL to create one
    const urlResult = await askNewProjectUrl(mcpServer);
    if (urlResult.action !== "accept" || !urlResult.content?.appUrl) {
      return textResult({ cancelled: true, message: "Test creation cancelled." });
    }
    appUrl = String(urlResult.content.appUrl);
    const domain = domainFromUrl(appUrl);
    const project = await client.createProject({
      name: domain,
      appUrl,
      description: `Human testing for ${domain}`,
    });
    projectId = project.id;
    projectName = domain;
  } else {
    // Show project list — user picks or creates new
    const selectResult = await askProjectSelection(mcpServer, projects);
    if (selectResult.action !== "accept" || !selectResult.content?.project) {
      return textResult({ cancelled: true, message: "Test creation cancelled." });
    }

    const selection = String(selectResult.content.project);
    if (selection === "_new") {
      // Create new — ask for URL
      const urlResult = await askNewProjectUrl(mcpServer);
      if (urlResult.action !== "accept" || !urlResult.content?.appUrl) {
        return textResult({ cancelled: true, message: "Test creation cancelled." });
      }
      appUrl = String(urlResult.content.appUrl);
      const domain = domainFromUrl(appUrl);
      const project = await client.createProject({
        name: domain,
        appUrl,
        description: `Human testing for ${domain}`,
      });
      projectId = project.id;
      projectName = domain;
    } else {
      // Existing project selected
      const selected = projects.find((p) => p.id === selection);
      projectId = selection;
      projectName = selected?.name ?? selection;
      appUrl = selected?.appUrl ?? "";
    }
  }

  // ── Step 2: Test topic and config ──
  // ── Step 2: Test topic and config ──
  let testTopic = args.testTopic ?? "";
  let testerCount = args.testerCount ?? 3;
  let difficulty: "EASY" | "MEDIUM" | "HARD" = args.difficulty ?? "MEDIUM";

  if (!testTopic) {
    const configResult = await askTestConfig(mcpServer, projectName);
    if (configResult.action !== "accept" || !configResult.content?.testTopic) {
      return textResult({ cancelled: true, message: "Test creation cancelled." });
    }
    testTopic = String(configResult.content.testTopic);
    testerCount = Number(configResult.content.testerCount) || testerCount;
    difficulty = (String(configResult.content.difficulty || difficulty)) as "EASY" | "MEDIUM" | "HARD";
  }

  // ── Return: hand off to AI for scenario generation ──
  // AI has code context — it can generate much better scenarios than our server.
  return textResult({
    action: "GENERATE_SCENARIOS",
    projectId,
    projectName,
    appUrl,
    testTopic,
    testerCount,
    difficulty,
    message: `Project "${projectName}" selected. Now generate test scenarios for "${testTopic}".`,
    instructions: [
      `Read the codebase to understand the "${testTopic}" feature — check routes, components, forms, buttons.`,
      `Generate 3-7 test scenarios with 2-5 steps each. Every step must reference REAL UI elements you verified in the code.`,
      `Show the scenarios to the user for review.`,
      `After user approves, call humancheck_add_scenarios with projectId "${projectId}" and the scenarios.`,
      `Then call humancheck_create_task with projectId "${projectId}", title "${testTopic}", scenarioIds from add_scenarios, testerCount ${testerCount}, difficulty "${difficulty}".`,
    ],
  });
}

/**
 * Fallback for clients without elicitation support.
 */
function returnFallbackInstructions(): ToolResult {
  return textResult({
    action: "COLLECT_INPUT",
    _fallback: true,
    message:
      "This client does not support elicitation. Ask the user for the following information, then call humancheck_test_submit with their answers.",
    required: [
      { field: "appUrl", question: "What is the URL of the app you want to test?", type: "url" },
      { field: "description", question: "What do you want to test? (e.g., contact form, login flow)", type: "text" },
      { field: "testerCount", question: "How many testers? (1-20)", type: "number", default: 3 },
      { field: "difficulty", question: "Difficulty level?", options: ["EASY", "MEDIUM", "HARD"], default: "MEDIUM" },
    ],
  });
}

/**
 * Main handler for humancheck_test.
 */
export async function handleGuidedTest(
  args: GuidedTestInput,
  client: HumanCheckApiClient,
  mcpServer: McpServer
): Promise<ToolResult> {
  try {
    if (supportsElicitation(mcpServer)) {
      return await runElicitationFlow(args, client, mcpServer);
    }
    return returnFallbackInstructions();
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return textResult({
      error: true,
      message: `Failed to create guided test: ${message}`,
    });
  }
}
