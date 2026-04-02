/**
 * humancheck_cancel_task tool
 *
 * Cancels a task, stopping it and releasing assigned testers.
 * Cannot cancel tasks that are already COMPLETED or CANCELLED.
 */

import { z } from "zod";
import { HumanCheckApiClient } from "../api-client.js";

export const cancelTaskInputSchema = {
  taskId: z.string().min(1).describe("The task ID to cancel"),
} as const;

export type CancelTaskInput = {
  taskId: string;
};

export async function handleCancelTask(
  args: CancelTaskInput,
  client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    const task = await client.cancelTask(args.taskId);

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ taskId: task.id, status: task.status, message: "Task cancelled." }, null, 2),
      }],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ error: true, message: `Failed to cancel task: ${message}` }, null, 2),
      }],
    };
  }
}
