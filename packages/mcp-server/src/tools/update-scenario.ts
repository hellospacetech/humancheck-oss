/**
 * humancheck_update_scenario tool
 *
 * Updates an existing scenario's title, steps, or screenshot.
 */

import { z } from "zod";
import { HumanCheckApiClient } from "../api-client.js";

export const updateScenarioInputSchema = {
  scenarioId: z.string().min(1).describe("The scenario ID to update"),
  title: z.string().min(1).optional().describe("New scenario title"),
  steps: z
    .array(
      z.object({
        instruction: z.string().min(1).describe("What the tester should do"),
        expectedResult: z.string().min(1).describe("What should happen"),
      })
    )
    .optional()
    .describe("Replacement steps (replaces all existing steps)"),
  screenshotUrl: z.string().url().optional().describe("New screenshot URL"),
} as const;

export type UpdateScenarioInput = {
  scenarioId: string;
  title?: string;
  steps?: Array<{ instruction: string; expectedResult: string }>;
  screenshotUrl?: string;
};

export async function handleUpdateScenario(
  args: UpdateScenarioInput,
  client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    const data: Record<string, unknown> = {};
    if (args.title !== undefined) data.title = args.title;
    if (args.steps !== undefined) {
      data.steps = args.steps.map((step, idx) => ({
        order: idx + 1,
        instruction: step.instruction,
        expectedResult: step.expectedResult,
      }));
    }
    if (args.screenshotUrl !== undefined) data.screenshotUrl = args.screenshotUrl;

    if (Object.keys(data).length === 0) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ error: true, message: "No fields to update." }, null, 2),
        }],
      };
    }

    await client.updateScenario(args.scenarioId, data as any);

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ scenarioId: args.scenarioId, message: "Scenario updated." }, null, 2),
      }],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ error: true, message: `Failed to update scenario: ${message}` }, null, 2),
      }],
    };
  }
}
