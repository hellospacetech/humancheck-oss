/**
 * AI-powered scenario generation using Claude Haiku.
 * Falls back to keyword matching if ANTHROPIC_API_KEY is not available.
 *
 * Uses raw fetch (same pattern as packages/server ai-evaluator.service.ts)
 * to avoid adding @anthropic-ai/sdk as a dependency.
 */

export interface GeneratedScenario {
  title: string;
  steps: Array<{ instruction: string; expectedResult: string }>;
}

interface AnthropicMessageResponse {
  content: Array<{ type: string; text: string }>;
}

/**
 * Attempts AI-powered scenario generation.
 * Returns null if unavailable (no API key) or on error (caller falls back to keywords).
 */
export async function generateScenariosWithAI(
  appUrl: string,
  description: string,
): Promise<GeneratedScenario[] | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    return await callClaudeForScenarios(apiKey, appUrl, description);
  } catch (err) {
    console.error(
      "[AI Scenario Generator] AI generation failed, falling back to keyword matching:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

async function callClaudeForScenarios(
  apiKey: string,
  appUrl: string,
  description: string,
): Promise<GeneratedScenario[]> {
  const prompt = buildPrompt(appUrl, description);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Claude API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as AnthropicMessageResponse;
    const text = data.content[0]?.text || "";

    return parseAndValidateScenarios(text);
  } finally {
    clearTimeout(timeout);
  }
}

function buildPrompt(appUrl: string, description: string): string {
  return `You are a QA test scenario designer. Given an application URL and description, generate structured test scenarios for human testers.

App URL: ${appUrl}
Description: ${description}

Generate 3-7 test scenarios. Each scenario should have:
- A clear title
- 2-5 specific steps with:
  - instruction: What the tester should do (specific, actionable)
  - expectedResult: What should happen (verifiable)

Cover:
- Happy path (main functionality works)
- Error handling (invalid inputs, edge cases)
- UI/UX (responsive, accessibility, visual consistency)

Return ONLY a valid JSON array, no markdown, no explanation:
[{"title":"...","steps":[{"instruction":"...","expectedResult":"..."}]}]`;
}

/**
 * Parses AI response text and validates the scenario structure.
 * Throws if the response cannot be parsed into valid scenarios.
 */
function parseAndValidateScenarios(text: string): GeneratedScenario[] {
  // Extract JSON array from the response — the model may include whitespace or minor wrapping
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("No JSON array found in AI response");
  }

  const parsed: unknown = JSON.parse(jsonMatch[0]);

  if (!Array.isArray(parsed)) {
    throw new Error("Parsed response is not an array");
  }

  if (parsed.length === 0) {
    throw new Error("AI returned an empty scenario array");
  }

  const scenarios: GeneratedScenario[] = [];

  for (const item of parsed) {
    if (!isValidScenario(item)) {
      continue; // skip malformed entries rather than failing entirely
    }
    scenarios.push({
      title: String(item.title),
      steps: item.steps.map(
        (s: { instruction: unknown; expectedResult: unknown }) => ({
          instruction: String(s.instruction),
          expectedResult: String(s.expectedResult),
        }),
      ),
    });
  }

  if (scenarios.length === 0) {
    throw new Error("No valid scenarios after parsing AI response");
  }

  return scenarios;
}

/**
 * Type guard for a single scenario object from the AI response.
 */
function isValidScenario(
  obj: unknown,
): obj is {
  title: string;
  steps: Array<{ instruction: string; expectedResult: string }>;
} {
  if (typeof obj !== "object" || obj === null) return false;

  const record = obj as Record<string, unknown>;

  if (typeof record.title !== "string" || record.title.length === 0) {
    return false;
  }

  if (!Array.isArray(record.steps) || record.steps.length === 0) {
    return false;
  }

  return record.steps.every((step: unknown) => {
    if (typeof step !== "object" || step === null) return false;
    const s = step as Record<string, unknown>;
    return (
      typeof s.instruction === "string" &&
      s.instruction.length > 0 &&
      typeof s.expectedResult === "string" &&
      s.expectedResult.length > 0
    );
  });
}
