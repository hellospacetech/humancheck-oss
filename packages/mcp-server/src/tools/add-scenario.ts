/**
 * humancheck_add_scenario tool
 *
 * Adds a test scenario to an existing project.
 * Returns the scenario ID and step count.
 */

import { z } from "zod";
import { HumanCheckApiClient } from "../api-client.js";

export const addScenarioInputSchema = {
  projectId: z.string().min(1).describe("Project ID to add the scenario to"),
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
} as const;

export type AddScenarioInput = {
  projectId: string;
  title: string;
  steps: Array<{ instruction: string; expectedResult: string }>;
  screenshotUrl?: string;
};

export async function handleAddScenario(
  args: AddScenarioInput,
  client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    const scenario = await client.addScenario({
      projectId: args.projectId,
      title: args.title,
      steps: args.steps.map((s, idx) => ({
        order: idx + 1,
        instruction: s.instruction,
        expectedResult: s.expectedResult,
      })),
      expectedOutcome: `All steps in "${args.title}" pass successfully`,
      screenshotUrl: args.screenshotUrl,
    });

    const result = {
      scenarioId: scenario.id,
      projectId: scenario.projectId,
      title: scenario.title,
      stepCount: args.steps.length,
      message:
        "Scenario added. Add more scenarios or use humancheck_create_task to dispatch testers.",
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
            { error: true, message: `Failed to add scenario: ${message}` },
            null,
            2
          ),
        },
      ],
    };
  }
}
