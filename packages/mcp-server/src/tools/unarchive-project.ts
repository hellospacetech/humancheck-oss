/**
 * humancheck_unarchive_project tool
 *
 * Restores an archived project back to ACTIVE status.
 * The project becomes visible in default listings again.
 */

import { z } from "zod";
import { HumanCheckApiClient } from "../api-client.js";

export const unarchiveProjectInputSchema = {
  projectId: z.string().min(1).describe("The project ID to unarchive"),
} as const;

export type UnarchiveProjectInput = {
  projectId: string;
};

export async function handleUnarchiveProject(
  args: UnarchiveProjectInput,
  client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    const project = await client.unarchiveProject(args.projectId);

    const result = {
      projectId: project.id,
      name: project.name,
      status: project.status,
      message: `Project "${project.name}" has been restored to active status. It will now appear in default project listings.`,
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
            { error: true, message: `Failed to unarchive project: ${message}` },
            null,
            2
          ),
        },
      ],
    };
  }
}
