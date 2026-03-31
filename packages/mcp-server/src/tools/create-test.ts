/**
 * humancheck_create_test tool
 *
 * Creates a project + scenarios + task in one call.
 * Returns the task ID and status.
 */

import { z } from "zod";
import { HumanCheckApiClient } from "../api-client.js";

export const createTestInputSchema = {
  appUrl: z.string().url().describe("The URL of the application to test"),
  projectName: z.string().min(1).describe("Name for the test project"),
  scenarios: z
    .array(
      z.object({
        title: z.string().min(1).describe("Scenario title"),
        steps: z
          .array(
            z.object({
              instruction: z.string().min(1).describe("What the tester should do"),
              expectedResult: z.string().min(1).describe("What should happen"),
            })
          )
          .min(1)
          .describe("Test steps"),
      })
    )
    .min(1)
    .describe("Test scenarios to run"),
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
    .describe("Task difficulty (default MEDIUM)"),
  autoAcceptTesters: z
    .boolean()
    .optional()
    .default(true)
    .describe("Auto-accept testers (true) or require manual approval (false)"),
  deadline: z
    .string()
    .optional()
    .describe("Optional deadline as ISO 8601 datetime"),
} as const;

export type CreateTestInput = {
  appUrl: string;
  projectName: string;
  scenarios: Array<{
    title: string;
    steps: Array<{ instruction: string; expectedResult: string }>;
  }>;
  testerCount?: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  autoAcceptTesters?: boolean;
  deadline?: string;
};

export async function handleCreateTest(
  args: CreateTestInput,
  client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    // 1. Create project
    const project = await client.createProject({
      name: args.projectName,
      appUrl: args.appUrl,
      description: `Human test project for ${args.appUrl}`,
    });

    // 2. Set auto-accept preference
    if (args.autoAcceptTesters === false) {
      await client.updateProject(project.id, { autoAcceptTesters: false });
    }

    // 3. Add scenarios
    const scenarioResults = await client.addScenarios(
      args.scenarios.map((s) => ({
        projectId: project.id,
        title: s.title,
        steps: s.steps.map((step, idx) => ({
          order: idx + 1,
          instruction: step.instruction,
          expectedResult: step.expectedResult,
        })),
        expectedOutcome: `All steps in "${s.title}" pass successfully`,
      }))
    );

    // 4. Create task
    const task = await client.createTask({
      projectId: project.id,
      testerCount: args.testerCount ?? 3,
      difficulty: args.difficulty ?? "MEDIUM",
      deadline: args.deadline,
    });

    const result = {
      taskId: task.id,
      projectId: project.id,
      status: task.status,
      projectName: args.projectName,
      appUrl: args.appUrl,
      scenarioCount: scenarioResults.length,
      testerCount: task.testerCount,
      difficulty: task.difficulty,
      message: `Test created successfully. ${scenarioResults.length} scenario(s) will be tested by ${task.testerCount} human tester(s). Task is now ${task.status}.`,
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { error: true, message: `Failed to create test: ${message}` },
            null,
            2
          ),
        },
      ],
    };
  }
}
