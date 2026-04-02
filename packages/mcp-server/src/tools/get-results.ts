/**
 * humancheck_get_results tool
 *
 * Returns AI-structured feedback results for a given task.
 * Supports JSON and markdown output formats.
 */

import { z } from "zod";
import { HumanCheckApiClient } from "../api-client.js";

export const getResultsInputSchema = {
  taskId: z.string().min(1).describe("The task ID to get results for"),
  format: z
    .enum(["json", "markdown"])
    .optional()
    .default("json")
    .describe("Output format: json (structured) or markdown (for AI prompt)"),
  includeTesters: z
    .boolean()
    .optional()
    .default(false)
    .describe("If true, include tester profiles and stats in the response"),
} as const;

export type GetResultsInput = {
  taskId: string;
  format?: "json" | "markdown";
  includeTesters?: boolean;
};

export async function handleGetResults(
  args: GetResultsInput,
  client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    const format = args.format ?? "json";

    if (format === "markdown") {
      const markdown = await client.getResultsMarkdown(args.taskId);
      return {
        content: [
          {
            type: "text" as const,
            text: markdown,
          },
        ],
      };
    }

    // JSON format: get AI-structured results
    const results = await client.getResultsAI(args.taskId);

    const output: Record<string, unknown> = {
      taskId: results.taskId,
      appUrl: results.appUrl,
      summary: results.summary,
      issues: results.issues,
      message:
        results.issues.length === 0
          ? "All scenarios passed! No issues found."
          : `Found ${results.issues.length} issue(s) across ${results.summary.failed} failed scenario(s). ${results.summary.passed} scenario(s) passed.`,
    };

    if (args.includeTesters) {
      const testersData = await client.getTaskTesters(args.taskId);
      output.testers = {
        total: testersData.total,
        testers: testersData.testers.map((t) => ({
          name: t.name,
          bio: t.bio,
          technologies: t.technologies,
          assignmentStatus: t.assignmentStatus,
          testerScore: t.testerScore,
          testerLevel: t.testerLevel,
          rounds: t.rounds,
          memberSince: t.memberSince,
          taskStats: t.taskStats,
          globalStats: t.globalStats,
        })),
      };
    }

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
            { error: true, message: `Failed to get results: ${message}` },
            null,
            2
          ),
        },
      ],
    };
  }
}
