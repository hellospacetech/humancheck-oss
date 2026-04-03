/**
 * humancheck_test_submit — Fallback tool for clients without elicitation.
 *
 * Called AFTER the AI collects input from the user conversationally.
 * dryRun defaults to true — first call always previews.
 */

import { z } from "zod";
import { HumanCheckApiClient } from "../api-client.js";

export const guidedTestSubmitInputSchema = {
  appUrl: z
    .string()
    .url()
    .describe("The URL provided by the user (never infer from code)"),
  description: z
    .string()
    .min(1)
    .describe("What the user wants to test (e.g., 'contact form', 'login flow')"),
  testerCount: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .default(3)
    .describe("Number of testers (1-20, default 3)"),
  difficulty: z
    .enum(["EASY", "MEDIUM", "HARD"])
    .optional()
    .default("MEDIUM")
    .describe("Test difficulty (default MEDIUM)"),
  dryRun: z
    .boolean()
    .optional()
    .default(true)
    .describe("Preview scenarios without dispatching. Defaults to TRUE — always preview first."),
} as const;

export type GuidedTestSubmitInput = {
  appUrl: string;
  description: string;
  testerCount?: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  dryRun?: boolean;
};

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export async function handleGuidedTestSubmit(
  args: GuidedTestSubmitInput,
  client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    // Generate scenarios
    const aiScenarios = await client.generateScenarios(args.appUrl, args.description);
    const scenarios = aiScenarios ?? [
      {
        title: args.description,
        steps: [
          { instruction: `Open ${args.appUrl} and navigate to the relevant section`, expectedResult: "Page loads correctly" },
          { instruction: `Test the ${args.description} functionality`, expectedResult: "Feature works as expected" },
          { instruction: "Check for visual or functional issues", expectedResult: "No issues found" },
        ],
      },
    ];

    // Dry run: return preview
    if (args.dryRun !== false) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            dryRun: true,
            appUrl: args.appUrl,
            scenarioCount: scenarios.length,
            scenarios: scenarios.map((s) => ({
              title: s.title,
              steps: s.steps.map((step, idx) => ({
                order: idx + 1,
                instruction: step.instruction,
                expectedResult: step.expectedResult,
              })),
            })),
            message: `Preview: ${scenarios.length} scenario(s). Show these to the user. If approved, call humancheck_test_submit again with dryRun: false.`,
          }, null, 2),
        }],
      };
    }

    // Find or create project
    const domain = domainFromUrl(args.appUrl);
    const existingProjects = await client.listProjects(false);
    const match = existingProjects.find(
      (p) => domainFromUrl(p.appUrl) === domain && p.status === "ACTIVE"
    );

    let projectId: string;
    if (match) {
      projectId = match.id;
    } else {
      const project = await client.createProject({
        name: domain,
        appUrl: args.appUrl,
        description: `Human testing for ${domain}`,
      });
      projectId = project.id;
    }

    // Add scenarios
    const scenarioResults = await client.addScenariosBulk(
      projectId,
      scenarios.map((s) => ({
        title: s.title,
        steps: s.steps.map((step, idx) => ({
          order: idx + 1,
          instruction: step.instruction,
          expectedResult: step.expectedResult,
        })),
        expectedOutcome: `All steps in "${s.title}" pass successfully`,
      }))
    );

    // Create task
    const task = await client.createTask({
      projectId,
      title: args.description,
      testerCount: args.testerCount ?? 3,
      difficulty: args.difficulty ?? "MEDIUM",
      scenarioIds: scenarioResults.map((s) => s.id),
    });

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          taskId: task.id,
          projectId,
          title: args.description,
          status: task.status,
          scenarioCount: scenarioResults.length,
          message: `Task "${args.description}" created. ${task.testerCount} tester(s) will be matched.`,
        }, null, 2),
      }],
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(
          { error: true, message: `Failed to submit test: ${message}` },
          null, 2
        ),
      }],
    };
  }
}
