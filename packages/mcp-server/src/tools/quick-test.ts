/**
 * humancheck_quick_test tool
 *
 * Quick test: provide an app URL and description, and this tool
 * generates test scenarios, creates (or reuses) the project,
 * scenarios, and task in one go.
 *
 * - If projectId is given: adds scenarios to that project
 * - If appUrl matches an existing active project: reuses it (dedup)
 * - Otherwise: creates a new project
 */

import { z } from "zod";
import { HumanCheckApiClient } from "../api-client.js";
import { generateScenariosWithAI } from "../ai-scenario-generator.js";

export const quickTestInputSchema = {
  appUrl: z.string().url().describe("The URL of the application to test"),
  description: z
    .string()
    .min(1)
    .describe(
      "Description of what to test (e.g. 'sign up flow, login page, dashboard navigation')"
    ),
  projectId: z
    .string()
    .optional()
    .describe("Optional: reuse an existing project instead of creating a new one"),
  testerCount: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .default(3)
    .describe("Number of testers (1-20, default 3)"),
  difficulty: z
    .enum(["EASY", "MEDIUM", "HARD"])
    .optional()
    .default("MEDIUM")
    .describe("Test difficulty (default MEDIUM)"),
  deadline: z
    .string()
    .optional()
    .describe("Optional deadline in ISO 8601 format"),
} as const;

export type QuickTestInput = {
  appUrl: string;
  description: string;
  projectId?: string;
  testerCount?: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  deadline?: string;
};

/**
 * Generates simple test scenarios from a free-text description.
 * This is a basic heuristic approach for MVP — no AI generation.
 */
function generateScenariosFromDescription(
  appUrl: string,
  description: string
): Array<{
  title: string;
  steps: Array<{ instruction: string; expectedResult: string }>;
}> {
  const scenarios: Array<{
    title: string;
    steps: Array<{ instruction: string; expectedResult: string }>;
  }> = [];

  // Always start with a basic accessibility/load test
  scenarios.push({
    title: "Page loads and is accessible",
    steps: [
      {
        instruction: `Open ${appUrl} in your browser`,
        expectedResult: "Page loads without errors",
      },
      {
        instruction: "Check that the page is visually complete and readable",
        expectedResult:
          "All text is readable, images load, no broken layouts",
      },
      {
        instruction:
          "Try navigating using only the keyboard (Tab, Enter, Escape)",
        expectedResult: "Focus indicators are visible, interactive elements are reachable",
      },
    ],
  });

  const lowerDesc = description.toLowerCase();

  if (
    lowerDesc.includes("sign up") ||
    lowerDesc.includes("signup") ||
    lowerDesc.includes("register")
  ) {
    scenarios.push({
      title: "Sign up flow",
      steps: [
        {
          instruction: "Navigate to the sign-up / registration page",
          expectedResult: "Sign-up form is displayed",
        },
        {
          instruction: "Try submitting the form with empty fields",
          expectedResult: "Validation errors are shown for required fields",
        },
        {
          instruction:
            "Fill in valid details and submit the sign-up form",
          expectedResult:
            "Account is created successfully, user is redirected or shown a success message",
        },
      ],
    });
  }

  if (lowerDesc.includes("login") || lowerDesc.includes("sign in") || lowerDesc.includes("signin")) {
    scenarios.push({
      title: "Login flow",
      steps: [
        {
          instruction: "Navigate to the login page",
          expectedResult: "Login form is displayed",
        },
        {
          instruction: "Try logging in with incorrect credentials",
          expectedResult: "An appropriate error message is shown",
        },
        {
          instruction: "Log in with valid credentials",
          expectedResult:
            "User is authenticated and redirected to the appropriate page",
        },
      ],
    });
  }

  if (
    lowerDesc.includes("dashboard") ||
    lowerDesc.includes("admin") ||
    lowerDesc.includes("panel")
  ) {
    scenarios.push({
      title: "Dashboard functionality",
      steps: [
        {
          instruction: "Navigate to the dashboard / admin panel",
          expectedResult: "Dashboard loads with relevant data displayed",
        },
        {
          instruction: "Interact with dashboard widgets or controls",
          expectedResult: "Widgets respond correctly, data updates as expected",
        },
        {
          instruction: "Check responsive layout by resizing the browser window",
          expectedResult: "Dashboard adapts properly to different screen sizes",
        },
      ],
    });
  }

  if (
    lowerDesc.includes("navigation") ||
    lowerDesc.includes("nav") ||
    lowerDesc.includes("menu")
  ) {
    scenarios.push({
      title: "Navigation and menu",
      steps: [
        {
          instruction: "Click through all main navigation links",
          expectedResult: "Each link leads to the correct page without errors",
        },
        {
          instruction: "Check the mobile menu (if applicable, resize to mobile width)",
          expectedResult: "Mobile menu opens/closes correctly, all links work",
        },
      ],
    });
  }

  if (
    lowerDesc.includes("form") ||
    lowerDesc.includes("submit") ||
    lowerDesc.includes("input")
  ) {
    scenarios.push({
      title: "Form submission",
      steps: [
        {
          instruction: "Locate the main form on the page",
          expectedResult: "Form is visible and all fields are accessible",
        },
        {
          instruction: "Submit the form with invalid data",
          expectedResult: "Validation messages appear for incorrect fields",
        },
        {
          instruction: "Fill in valid data and submit",
          expectedResult:
            "Form submits successfully with a confirmation message or redirect",
        },
      ],
    });
  }

  if (
    lowerDesc.includes("checkout") ||
    lowerDesc.includes("payment") ||
    lowerDesc.includes("cart") ||
    lowerDesc.includes("purchase")
  ) {
    scenarios.push({
      title: "Checkout / payment flow",
      steps: [
        {
          instruction: "Add an item to the cart",
          expectedResult: "Item appears in the cart with correct details",
        },
        {
          instruction: "Proceed to checkout",
          expectedResult: "Checkout form is displayed with order summary",
        },
        {
          instruction: "Complete the purchase flow",
          expectedResult:
            "Order confirmation is shown, no errors during payment",
        },
      ],
    });
  }

  if (
    lowerDesc.includes("search") ||
    lowerDesc.includes("filter")
  ) {
    scenarios.push({
      title: "Search and filter",
      steps: [
        {
          instruction: "Use the search functionality with a valid query",
          expectedResult: "Relevant results are displayed",
        },
        {
          instruction: "Search with an empty or nonsensical query",
          expectedResult:
            "Appropriate empty state or error message is shown",
        },
        {
          instruction: "Apply filters (if available) and verify results",
          expectedResult: "Results update correctly based on applied filters",
        },
      ],
    });
  }

  // If no specific patterns were matched beyond the base scenario,
  // add a generic "explore and test" scenario
  if (scenarios.length === 1) {
    scenarios.push({
      title: "Core functionality test",
      steps: [
        {
          instruction: `Open ${appUrl} and explore the main features described: "${description}"`,
          expectedResult: "Features work as described without errors",
        },
        {
          instruction: "Try common user interactions (clicking buttons, filling forms, navigating)",
          expectedResult: "All interactions respond correctly",
        },
        {
          instruction: "Look for any visual bugs, broken links, or error messages",
          expectedResult: "No visual bugs, broken links, or unexpected errors found",
        },
      ],
    });
  }

  return scenarios;
}

export async function handleQuickTest(
  args: QuickTestInput,
  client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    // Try AI-powered generation, fall back to keyword matching
    const aiScenarios = await generateScenariosWithAI(args.appUrl, args.description);
    const scenarios = aiScenarios ?? generateScenariosFromDescription(
      args.appUrl,
      args.description
    );

    let projectId = args.projectId;
    let projectName = "";
    let reusedProject = false;

    if (projectId) {
      // Explicit projectId — reuse directly
      const project = await client.getProject(projectId);
      projectName = project.name;
      reusedProject = true;
    } else {
      // Check if an active project with this appUrl already exists (dedup)
      const existingProjects = await client.listProjects(false);
      const match = existingProjects.find(
        (p) => p.appUrl === args.appUrl && p.status === "ACTIVE"
      );

      if (match) {
        projectId = match.id;
        projectName = match.name;
        reusedProject = true;
      } else {
        // Create new project
        try {
          const url = new URL(args.appUrl);
          projectName = `Quick Test — ${url.hostname}`;
        } catch {
          projectName = `Quick Test — ${args.appUrl}`;
        }

        const project = await client.createProject({
          name: projectName,
          appUrl: args.appUrl,
          description: `Quick test: ${args.description}`,
        });
        projectId = project.id;
      }
    }

    // Add scenarios (bulk)
    const scenarioResults = await client.addScenariosBulk(
      projectId!,
      scenarios.map((s) => ({
        title: s.title,
        steps: s.steps.map((step, idx) => ({
          order: idx + 1,
          instruction: step.instruction,
          expectedResult: step.expectedResult,
        })),
        expectedOutcome: `All steps in "${s.title}" pass successfully`,
      }))
    );

    // Create task
    const task = await client.createTask({
      projectId: projectId!,
      testerCount: args.testerCount ?? 3,
      difficulty: args.difficulty ?? "MEDIUM",
      scenarioIds: scenarioResults.map((s) => s.id),
      ...(args.deadline ? { deadline: args.deadline } : {}),
    });

    const result = {
      taskId: task.id,
      projectId,
      status: task.status,
      projectName,
      reusedProject,
      appUrl: args.appUrl,
      scenarioCount: scenarioResults.length,
      testerCount: task.testerCount,
      difficulty: task.difficulty,
      message: reusedProject
        ? `Test added to existing project "${projectName}". ${scenarioResults.length} scenario(s) will be tested by ${task.testerCount} tester(s).`
        : `New project "${projectName}" created. ${scenarioResults.length} scenario(s) will be tested by ${task.testerCount} tester(s). Task is now ${task.status}.`,
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
            { error: true, message: `Failed to create quick test: ${message}` },
            null,
            2
          ),
        },
      ],
    };
  }
}
