/**
 * humancheck_archive_project tool
 *
 * Archives a project (soft delete). Archived projects are hidden from default listing
 * but testers can still see their work history.
 */

import { z } from "zod";
import { HumanCheckApiClient } from "../api-client.js";

export const archiveProjectInputSchema = {
  projectId: z.string().min(1).describe("The project ID to archive"),
} as const;

export type ArchiveProjectInput = {
  projectId: string;
};

export async function handleArchiveProject(
  args: ArchiveProjectInput,
  client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    const project = await client.archiveProject(args.projectId);

    const result = {
      projectId: project.id,
      name: project.name,
      status: project.status,
      message: `Project "${project.name}" has been archived. It will no longer appear in default project listings, but test history and tester data are preserved.`,
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
            { error: true, message: `Failed to archive project: ${message}` },
            null,
            2
          ),
        },
      ],
    };
  }
}
