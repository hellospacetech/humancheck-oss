/**
 * humancheck_list_tasks tool
 *
 * Lists tasks with status, round info, and pass rates.
 * Optionally filters by status.
 */

import { z } from "zod";
import { HumanCheckApiClient } from "../api-client.js";

export const listTasksInputSchema = {
  status: z
    .enum(["DRAFT", "ACTIVE", "IN_PROGRESS", "COMPLETED"])
    .optional()
    .describe("Filter by task status"),
  projectId: z.string().optional().describe("Filter tasks by project ID"),
} as const;

export type ListTasksInput = {
  status?: "DRAFT" | "ACTIVE" | "IN_PROGRESS" | "COMPLETED";
  projectId?: string;
};

export async function handleListTasks(
  args: ListTasksInput,
  client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    const tasks = await client.listTasks();

    // Filter by status if provided
    const filtered = args.status
      ? tasks.filter((t) => t.status === args.status)
      : tasks;

    // Filter by projectId if provided
    const filteredByProject = args.projectId
      ? filtered.filter((t) => t.projectId === args.projectId)
      : filtered;

    // Enrich each task with round info where possible
    const enriched = await Promise.all(
      filteredByProject.map(async (task) => {
        let rounds: Array<{
          roundNumber: number;
          status: string;
          passRate: number;
        }> = [];

        try {
          const roundData = await client.getTaskRounds(task.id);
          rounds = roundData.map((r) => ({
            roundNumber: r.roundNumber,
            status: r.status,
            passRate: r.stats.passRate,
          }));
        } catch {
          // Round info is optional — if the endpoint fails, skip it
        }

        // Fetch tester progress for active/in-progress tasks
        let completedTesters = 0;
        let totalTesters = 0;
        if (task.status === "ACTIVE" || task.status === "IN_PROGRESS" || task.status === "COMPLETED") {
          try {
            const progress = await client.getTaskProgress(task.id);
            totalTesters = progress.testers.length;
            completedTesters = progress.testers.filter(
              (t) => t.status === "COMPLETED" || t.completedScenarios >= t.totalScenarios
            ).length;
          } catch {
            // Progress info is optional
          }
        }

        return {
          taskId: task.id,
          projectName: task.project?.name ?? "Unknown",
          status: task.status,
          testerCount: task.testerCount,
          completedTesters,
          totalTesters,
          rounds,
        };
      })
    );

    const output = {
      total: enriched.length,
      tasks: enriched,
      message:
        enriched.length === 0
          ? args.status
            ? `No tasks found with status "${args.status}".`
            : "No tasks found."
          : `Found ${enriched.length} task(s).`,
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(output, null, 2),
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
            { error: true, message: `Failed to list tasks: ${message}` },
            null,
            2
          ),
        },
      ],
    };
  }
}
