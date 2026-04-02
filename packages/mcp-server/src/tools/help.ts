/**
 * humancheck_help tool
 *
 * Returns usage guide for HumanCheck MCP tools.
 * Supports topic-based help for specific workflows.
 */

import { z } from "zod";
import { HumanCheckApiClient } from "../api-client.js";

export const helpInputSchema = {
  topic: z
    .enum(["overview", "workflow", "quick-test", "results", "testers", "retest"])
    .optional()
    .default("overview")
    .describe("Help topic (default: overview)"),
} as const;

export type HelpInput = {
  topic?: "overview" | "workflow" | "quick-test" | "results" | "testers" | "retest";
};

const HELP_TOPICS: Record<string, string> = {
  overview: `# HumanCheck — AI-Powered Human Testing

HumanCheck lets you send your app to real human testers directly from your AI assistant.
Testers manually verify your scenarios and report bugs, UX issues, and feedback.

## Available Commands

### Test Creation (atomic workflow)
1. **humancheck_list_projects** — See your existing projects
2. **humancheck_create_project** — Create a new project (name + app URL)
3. **humancheck_add_scenario** — Add test scenarios to a project (repeatable)
4. **humancheck_create_task** — Dispatch testers to start testing

### Quick Start
- **humancheck_quick_test** — Describe what to test, everything is created automatically

### Results & Monitoring
- **humancheck_list_tasks** — See all tasks and their status
- **humancheck_get_results** — Get test results with AI-analyzed feedback
- **humancheck_get_testers** — See who tested and their expertise/stats
- **humancheck_retest** — Re-run failed scenarios with new testers

## Help Topics
Ask for help on a specific topic: workflow, quick-test, results, testers, retest`,

  workflow: `# Test Creation Workflow

## Step 1: Create a Project
\`humancheck_create_project\` with a name and your app's URL.
A project groups all your test scenarios and tasks.

## Step 2: Add Scenarios
\`humancheck_add_scenario\` for each thing you want tested.
Each scenario has a title and steps (instruction + expected result).

Example scenario: "Login Flow"
- Step 1: Open the login page → Login form is visible
- Step 2: Enter invalid credentials → Error message shown
- Step 3: Enter valid credentials → User is logged in

Add as many scenarios as needed — each call adds one scenario.

## Step 3: Create a Task
\`humancheck_create_task\` to dispatch human testers.
Choose tester count (1-20), difficulty (EASY/MEDIUM/HARD), and optional deadline.

## After Testing
- \`humancheck_get_results\` — See what testers found
- \`humancheck_get_testers\` — See who tested and their credibility
- \`humancheck_retest\` — Re-test failed scenarios

## Tip: Adding Tests to an Existing Project
Use \`humancheck_quick_test\` with **projectId** or the same **appUrl** — it automatically reuses the existing project. No need for separate list_projects + add_scenario + create_task calls.`,

  "quick-test": `# Quick Test

\`humancheck_quick_test\` is the fastest way to launch a test — for new or existing projects.

## Parameters
- **appUrl** — Your app's URL (required)
- **description** — What to test (required)
- **projectId** — Reuse an existing project (optional)
- **testerCount** — How many testers, 1-20 (default: 3)
- **difficulty** — EASY, MEDIUM, or HARD (default: MEDIUM)
- **deadline** — ISO 8601 deadline (optional)

## Smart Project Reuse
- If **projectId** is given: adds scenarios to that project
- If **appUrl** matches an existing active project: reuses it automatically
- Otherwise: creates a new project

You never need to worry about duplicate projects — quick_test handles it.

## When to Use
- First time testing an app
- Adding more tests to an existing project
- Quick validation of a feature
- When you don't need precise control over individual scenarios`,

  results: `# Understanding Test Results

\`humancheck_get_results\` returns AI-analyzed feedback from your testers.

## What You Get
- **Summary** — Total scenarios, passed/failed counts, consensus score
- **Issues** — Sorted by severity (CRITICAL → HIGH → MEDIUM → LOW)
- Each issue includes: scenario, step, description, reproducibility, how many testers reported it

## Formats
- **json** (default) — Structured data, good for programmatic use
- **markdown** — Formatted report, good for reading

## Next Steps After Results
- Fix the issues in your code
- Use \`humancheck_retest\` to verify fixes with new testers
- Use \`humancheck_get_testers\` to see who tested and their expertise`,

  testers: `# Tester Profiles

\`humancheck_get_testers\` shows who tested your app and their credentials.

## What You Get Per Tester
- **Profile** — Name, bio, expertise areas (technologies)
- **Task Stats** — Feedback count, pass/fail rate, detail score for this specific task
- **Global Stats** — Total tests completed across all projects

## Why This Matters
A critical bug found by a tester with 150 completed tests and 95% consistency score carries more weight than one found by a new tester. Use tester profiles to prioritize which issues to fix first.

## When to Use
- After \`humancheck_get_results\` to add credibility context
- When deciding whether to trust a specific finding
- To understand the expertise behind the feedback`,

  retest: `# Retesting

\`humancheck_retest\` starts a new round of testing for a task.

## How It Works
- Provide the **taskId** to retest
- Optionally specify **scenarioIds** to retest only specific scenarios
- Optionally change **testerCount** for the new round

## When to Use
- After fixing bugs found in the first round
- To verify that issues are actually resolved
- To get a second opinion with different testers

## Tip
Check results first with \`humancheck_get_results\` to identify which scenarios failed, then retest only those — saves time and cost.`,
};

export async function handleHelp(
  args: HelpInput,
  _client: HumanCheckApiClient
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const topic = args.topic ?? "overview";
  const text = HELP_TOPICS[topic] ?? HELP_TOPICS.overview;

  return {
    content: [
      {
        type: "text" as const,
        text,
      },
    ],
  };
}
