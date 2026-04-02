/**
 * humancheck_list_projects tool
 *
 * Lists all projects for the authenticated user.
 */

import { z } from "zod";
import { HumanCheckApiClient } from "../api-client.js";

export const listProjectsInputSchema = {
  includeArchived: z
    .boolean()
    .optional()
    .default(false)
    .describe("Include archived projects (default: false, only active projects)"),
} as const;

export type ListProjectsInput = {
  includeArchived?: boolean;
};

export async function handleListProjects(
  args: ListProjectsInput,
  client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    const projects = await client.listProjects(args.includeArchived);

    const archivedCount = projects.filter((p) => p.status === "ARCHIVED").length;

    const output = {
      total: projects.length,
      projects: projects.map((p) => ({
        projectId: p.id,
        name: p.name,
        appUrl: p.appUrl,
        description: p.description ? p.description.slice(0, 60) + (p.description.length > 60 ? "…" : "") : null,
        status: p.status,
      })),
      message:
        projects.length === 0
          ? "No projects found."
          : `Found ${projects.length} project(s).` +
            (archivedCount > 0
              ? ` (${archivedCount} archived)`
              : ""),
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(output, null, 2),
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
            { error: true, message: `Failed to list projects: ${message}` },
            null,
            2
          ),
        },
      ],
    };
  }
}
