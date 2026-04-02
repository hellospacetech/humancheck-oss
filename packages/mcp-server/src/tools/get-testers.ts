/**
 * humancheck_get_testers tool
 *
 * Returns profiles and metrics of testers assigned to a task.
 */

import { z } from "zod";
import { HumanCheckApiClient } from "../api-client.js";

export const getTestersInputSchema = {
  taskId: z.string().min(1).describe("The task ID to get testers for"),
} as const;

export type GetTestersInput = {
  taskId: string;
};

export async function handleGetTesters(
  args: GetTestersInput,
  client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    const data = await client.getTaskTesters(args.taskId);

    const result = {
      taskId: data.taskId,
      total: data.total,
      testers: data.testers.map((t) => ({
        name: t.name,
        bio: t.bio,
        technologies: t.technologies,
        assignmentStatus: t.assignmentStatus,
        testerScore: t.testerScore,
        testerLevel: t.testerLevel,
        rounds: t.rounds,
        memberSince: t.memberSince,
        taskStats: t.taskStats,
        globalStats: t.globalStats,
      })),
      message:
        data.total === 0
          ? "No testers assigned to this task yet."
          : `${data.total} tester(s) assigned to this task.`,
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
            { error: true, message: `Failed to get testers: ${message}` },
            null,
            2
          ),
        },
      ],
    };
  }
}
