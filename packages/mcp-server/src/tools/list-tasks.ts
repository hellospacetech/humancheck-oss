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
} as const;

export type ListTasksInput = {
  status?: "DRAFT" | "ACTIVE" | "IN_PROGRESS" | "COMPLETED";
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

    // Enrich each task with round info where possible
    const enriched = await Promise.all(
      filtered.map(async (task) => {
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

        return {
          taskId: task.id,
          projectName: task.project?.name ?? "Unknown",
          appUrl: task.project?.appUrl ?? "Unknown",
          status: task.status,
          testerCount: task.testerCount,
          difficulty: task.difficulty,
          assignedTesters: task._count?.assignments ?? 0,
          createdAt: task.createdAt,
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
