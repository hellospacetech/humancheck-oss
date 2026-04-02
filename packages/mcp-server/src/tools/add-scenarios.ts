/**
 * humancheck_add_scenarios tool
 *
 * Bulk-adds multiple test scenarios to an existing project in one call.
 * Returns the project ID, scenario count, and summary of created scenarios.
 */

import { z } from "zod";
import { HumanCheckApiClient } from "../api-client.js";

export const addScenariosInputSchema = {
  projectId: z.string().min(1).describe("Project ID to add the scenarios to"),
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
        screenshotUrl: z.string().url().optional().describe("Optional screenshot URL as visual reference for testers"),
      })
    )
    .min(1)
    .describe("Array of scenarios to create"),
} as const;

export type AddScenariosInput = {
  projectId: string;
  scenarios: Array<{
    title: string;
    steps: Array<{ instruction: string; expectedResult: string }>;
    screenshotUrl?: string;
  }>;
};

export async function handleAddScenarios(
  args: AddScenariosInput,
  client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    const created = await client.addScenariosBulk(
      args.projectId,
      args.scenarios.map((s) => ({
        title: s.title,
        steps: s.steps.map((step, idx) => ({
          order: idx + 1,
          instruction: step.instruction,
          expectedResult: step.expectedResult,
        })),
        expectedOutcome: `All steps in "${s.title}" pass successfully`,
        screenshotUrl: s.screenshotUrl,
      }))
    );

    const result = {
      scenarioCount: created.length,
      scenarioIds: created.map((s) => s.id),
      message: `${created.length} scenario(s) added.`,
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
            { error: true, message: `Failed to add scenarios: ${message}` },
            null,
            2
          ),
        },
      ],
    };
  }
}
