/**
 * humancheck_create_project tool
 *
 * Creates a new project for organizing test scenarios.
 */

import { z } from "zod";
import { HumanCheckApiClient } from "../api-client.js";

export const createProjectInputSchema = {
  name: z.string().min(1).describe("Project name"),
  appUrl: z.string().url().describe("The URL of the application to test"),
  description: z.string().optional().describe("Project description"),
  autoAcceptTesters: z
    .boolean()
    .optional()
    .default(true)
    .describe("Auto-accept testers (true) or require manual approval (false)"),
} as const;

export type CreateProjectInput = {
  name: string;
  appUrl: string;
  description?: string;
  autoAcceptTesters?: boolean;
};

export async function handleCreateProject(
  args: CreateProjectInput,
  client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    // 1. Create project
    const project = await client.createProject({
      name: args.name,
      appUrl: args.appUrl,
      description: args.description ?? `Human test project for ${args.appUrl}`,
    });

    // 2. Set auto-accept preference
    if (args.autoAcceptTesters === false) {
      await client.updateProject(project.id, { autoAcceptTesters: false });
    }

    const result = {
      projectId: project.id,
      name: project.name,
      appUrl: project.appUrl,
      description: project.description,
      autoAcceptTesters: args.autoAcceptTesters !== false,
      message:
        "Project created. Use humancheck_add_scenario to add test scenarios.",
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
            { error: true, message: `Failed to create project: ${message}` },
            null,
            2
          ),
        },
      ],
    };
  }
}
