/**
 * humancheck_list_scenarios tool
 *
 * Lists all scenarios for a given project with step details.
 */

import { z } from "zod";
import { HumanCheckApiClient } from "../api-client.js";

export const listScenariosInputSchema = {
  projectId: z.string().min(1).describe("The project ID to list scenarios for"),
} as const;

export type ListScenariosInput = {
  projectId: string;
};

export async function handleListScenarios(
  args: ListScenariosInput,
  client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    const scenarios = await client.listScenarios(args.projectId);

    const result = {
      projectId: args.projectId,
      total: scenarios.length,
      scenarios: scenarios.map((s) => ({
        id: s.id,
        title: s.title,
        steps: s.steps.map((step) => ({
          order: step.order,
          instruction: step.instruction,
          expectedResult: step.expectedResult,
        })),
      })),
      message:
        scenarios.length === 0
          ? "No scenarios found."
          : `${scenarios.length} scenario(s).`,
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
            { error: true, message: `Failed to list scenarios: ${message}` },
            null,
            2
          ),
        },
      ],
    };
  }
}
