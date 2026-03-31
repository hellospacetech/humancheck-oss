/**
 * humancheck_retest tool
 *
 * Starts a retest round for a task.
 * Optionally specify which scenarios to retest and how many testers.
 * If no scenarioIds provided, all scenarios that failed in the last round are retested.
 */

import { z } from "zod";
import { HumanCheckApiClient } from "../api-client.js";

export const retestInputSchema = {
  taskId: z.string().min(1).describe("The task to retest"),
  scenarioIds: z
    .array(z.string().min(1))
    .optional()
    .describe(
      "Specific scenarios to retest. If omitted, retests all failed from last round"
    ),
  testerCount: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .describe("Number of testers for the new round"),
} as const;

export type RetestInput = {
  taskId: string;
  scenarioIds?: string[];
  testerCount?: number;
};

export async function handleRetest(
  args: RetestInput,
  client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    const round = await client.retest(args.taskId, {
      scenarioIds: args.scenarioIds,
      testerCount: args.testerCount,
    });

    const result = {
      roundNumber: round.roundNumber,
      status: round.status,
      retestOnly: round.retestOnly,
      scenarioCount: round.scenarioCount,
      message: `Retest round #${round.roundNumber} started. ${round.scenarioCount} scenario(s) will be retested. Status: ${round.status}.`,
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
            { error: true, message: `Failed to start retest: ${message}` },
            null,
            2
          ),
        },
      ],
    };
  }
}
