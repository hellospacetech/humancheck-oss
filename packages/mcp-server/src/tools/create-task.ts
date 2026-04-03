/**
 * humancheck_create_task tool
 *
 * Creates a task for an existing project to dispatch testers.
 * Returns the task ID and status.
 */

import { z } from "zod";
import { HumanCheckApiClient } from "../api-client.js";

export const createTaskInputSchema = {
  projectId: z.string().min(1).describe("Project ID to create a task for"),
  title: z
    .string()
    .max(200)
    .optional()
    .describe("Test topic name, e.g. 'Contact form test' or 'Login flow test'. Each task should represent one focused test topic."),
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
  deadline: z
    .string()
    .optional()
    .describe("Optional deadline as ISO 8601 datetime"),
  scenarioIds: z
    .array(z.string().min(1))
    .optional()
    .describe("Scenario IDs to include in this task. If omitted, all project scenarios are included."),
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
        screenshotUrl: z.string().url().optional().describe("Optional screenshot URL"),
      })
    )
    .optional()
    .describe("Inline scenarios to create and attach to this task. Alternative to scenarioIds — creates scenarios and task in one call."),
  webhookUrl: z
    .string()
    .url()
    .optional()
    .describe("Optional URL to receive a POST request when the task completes."),
  autoAcceptTesters: z
    .boolean()
    .optional()
    .describe("Override project-level auto-accept setting for this task. If omitted, inherits from project."),
} as const;

export type CreateTaskInput = {
  projectId: string;
  title?: string;
  testerCount?: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  deadline?: string;
  scenarioIds?: string[];
  scenarios?: Array<{
    title: string;
    steps: Array<{ instruction: string; expectedResult: string }>;
    screenshotUrl?: string;
  }>;
  webhookUrl?: string;
  autoAcceptTesters?: boolean;
};

export async function handleCreateTask(
  args: CreateTaskInput,
  client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    const task = await client.createTask({
      projectId: args.projectId,
      title: args.title,
      testerCount: args.testerCount ?? 3,
      difficulty: args.difficulty ?? "MEDIUM",
      deadline: args.deadline,
      webhookUrl: args.webhookUrl,
      autoAcceptTesters: args.autoAcceptTesters,
      scenarioIds: args.scenarioIds,
      ...(args.scenarios
        ? {
            scenarios: args.scenarios.map((s) => ({
              title: s.title,
              steps: s.steps.map((step, idx) => ({
                order: idx + 1,
                instruction: step.instruction,
                expectedResult: step.expectedResult,
              })),
              expectedOutcome: `All steps in "${s.title}" pass successfully`,
              screenshotUrl: s.screenshotUrl,
            })),
          }
        : {}),
    });

    const result = {
      taskId: task.id,
      title: task.title ?? undefined,
      status: task.status,
      message: `Task${task.title ? ` "${task.title}"` : ""} created. ${task.testerCount} tester(s) will be matched.`,
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
            { error: true, message: `Failed to create task: ${message}` },
            null,
            2
          ),
        },
      ],
    };
  }
}
