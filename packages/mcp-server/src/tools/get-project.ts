/**
 * humancheck_get_project tool
 *
 * Returns full details for a single project including scenarios.
 */

import { z } from "zod";
import { HumanCheckApiClient } from "../api-client.js";

export const getProjectInputSchema = {
  projectId: z.string().min(1).describe("The project ID to retrieve"),
} as const;

export type GetProjectInput = {
  projectId: string;
};

export async function handleGetProject(
  args: GetProjectInput,
  client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    const project = await client.getProject(args.projectId);
    const scenarios = await client.listScenarios(args.projectId);

    const result = {
      projectId: project.id,
      name: project.name,
      appUrl: project.appUrl,
      description: project.description,
      status: project.status,
      createdAt: project.createdAt,
      scenarioCount: scenarios.length,
      scenarios: scenarios.map((s) => ({
        id: s.id,
        title: s.title,
        stepCount: s.steps.length,
      })),
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
            { error: true, message: `Failed to get project: ${message}` },
            null,
            2
          ),
        },
      ],
    };
  }
}
