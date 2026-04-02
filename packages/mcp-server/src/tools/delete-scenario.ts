/**
 * humancheck_delete_scenario tool
 *
 * Permanently deletes a scenario from a project.
 */

import { z } from "zod";
import { HumanCheckApiClient } from "../api-client.js";

export const deleteScenarioInputSchema = {
  scenarioId: z.string().min(1).describe("The scenario ID to delete"),
} as const;

export type DeleteScenarioInput = {
  scenarioId: string;
};

export async function handleDeleteScenario(
  args: DeleteScenarioInput,
  client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    await client.deleteScenario(args.scenarioId);

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ scenarioId: args.scenarioId, message: "Scenario deleted." }, null, 2),
      }],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ error: true, message: `Failed to delete scenario: ${message}` }, null, 2),
      }],
    };
  }
}
