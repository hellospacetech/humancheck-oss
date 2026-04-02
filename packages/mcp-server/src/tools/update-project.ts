/**
 * humancheck_update_project tool
 *
 * Updates project name, description, URL, or auto-accept preference.
 */

import { z } from "zod";
import { HumanCheckApiClient } from "../api-client.js";

export const updateProjectInputSchema = {
  projectId: z.string().min(1).describe("The project ID to update"),
  name: z.string().min(1).optional().describe("New project name"),
  appUrl: z.string().url().optional().describe("New application URL"),
  description: z.string().optional().describe("New project description"),
  autoAcceptTesters: z
    .boolean()
    .optional()
    .describe("Auto-accept testers preference"),
} as const;

export type UpdateProjectInput = {
  projectId: string;
  name?: string;
  appUrl?: string;
  description?: string;
  autoAcceptTesters?: boolean;
};

export async function handleUpdateProject(
  args: UpdateProjectInput,
  client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    const { projectId, ...updates } = args;

    // Filter out undefined values
    const data: Record<string, unknown> = {};
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.appUrl !== undefined) data.appUrl = updates.appUrl;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.autoAcceptTesters !== undefined) data.autoAcceptTesters = updates.autoAcceptTesters;

    if (Object.keys(data).length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { error: true, message: "No fields to update. Provide at least one of: name, appUrl, description, autoAcceptTesters." },
              null,
              2
            ),
          },
        ],
      };
    }

    const project = await client.updateProject(projectId, data as { autoAcceptTesters?: boolean });

    const result = {
      projectId: project.id,
      status: project.status,
      message: "Project updated.",
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
            { error: true, message: `Failed to update project: ${message}` },
            null,
            2
          ),
        },
      ],
    };
  }
}
