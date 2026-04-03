/**
 * humancheck_create_project tool
 *
 * Creates a new project for organizing test scenarios.
 */

import { z } from "zod";
import { HumanCheckApiClient, ApiError } from "../api-client.js";

export const createProjectInputSchema = {
  appUrl: z.string().url().describe("The URL of the application to test (e.g. https://hellospace.studio)"),
  description: z.string().optional().describe("What does this app do? One sentence."),
  autoAcceptTesters: z
    .boolean()
    .optional()
    .default(true)
    .describe("Auto-accept testers (true) or require manual approval (false)"),
} as const;

export type CreateProjectInput = {
  appUrl: string;
  description?: string;
  autoAcceptTesters?: boolean;
};

/** Extract domain name from URL to use as project name */
function domainFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    // Remove www. prefix
    return hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export async function handleCreateProject(
  args: CreateProjectInput,
  client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    // 1. Create project
    const projectName = domainFromUrl(args.appUrl);
    const project = await client.createProject({
      name: projectName,
      appUrl: args.appUrl,
      description: args.description ?? `Human test project for ${projectName}`,
    });

    // 2. Set auto-accept preference
    if (args.autoAcceptTesters === false) {
      await client.updateProject(project.id, { autoAcceptTesters: false });
    }

    const result = {
      projectId: project.id,
      status: "ACTIVE",
      message: "Project created.",
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
    // Handle duplicate project — guide AI to use existing project
    if (error instanceof ApiError && error.statusCode === 409 && error.body) {
      const body = error.body as Record<string, unknown>;
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                error: true,
                code: "DUPLICATE_PROJECT",
                message: body.message || "A project for this URL already exists.",
                existingProjectId: body.existingProjectId,
                existingProjectName: body.existingProjectName,
                action: "Use humancheck_add_scenarios to add test scenarios to the existing project instead of creating a new one.",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { error: true, message: `Failed to create project: ${message}` },
            null,
            2
          ),
        },
      ],
    };
  }
}
