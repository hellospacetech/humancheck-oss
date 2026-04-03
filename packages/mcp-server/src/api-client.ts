/**
 * HumanCheckMe API Client
 * Wrapper around the HumanCheckMe REST API using fetch.
 * Auth via API key passed as env var HUMANCHECK_API_KEY.
 */

export interface ApiClientConfig {
  baseUrl: string;
  apiKey: string;
}

interface ScenarioStepInput {
  order: number;
  instruction: string;
  expectedResult: string;
}

interface CreateProjectInput {
  name: string;
  appUrl: string;
  description?: string;
}

interface CreateScenarioInput {
  projectId: string;
  title: string;
  steps: ScenarioStepInput[];
  expectedOutcome: string;
  screenshotUrl?: string;
}

interface CreateTaskInput {
  projectId: string;
  title?: string;
  testerCount: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  deadline?: string;
  price?: number;
  scenarioIds?: string[];
  webhookUrl?: string;
  autoAcceptTesters?: boolean;
  scenarios?: Array<{
    title: string;
    steps: ScenarioStepInput[];
    expectedOutcome?: string;
    screenshotUrl?: string;
  }>;
}

export interface ProjectResponse {
  id: string;
  name: string;
  appUrl: string;
  description: string | null;
  status: string;
  createdAt: string;
}

export interface ScenarioResponse {
  id: string;
  projectId: string;
  title: string;
  steps: ScenarioStepInput[];
  expectedOutcome: string;
  createdAt: string;
}

export interface TaskResponse {
  id: string;
  projectId: string;
  title: string | null;
  status: string;
  testerCount: number;
  difficulty: string;
  deadline: string | null;
  price: number | null;
  createdAt: string;
}

export interface TaskWithProject extends TaskResponse {
  project?: { name: string; appUrl: string };
  _count?: { assignments: number };
}

export interface FeedbackItem {
  id: string;
  scenarioTitle: string;
  stepNumber: number;
  passFail: boolean;
  severity: string | null;
  category: string | null;
  description: string | null;
  screenshotUrl: string | null;
  reproducibility: string | null;
  testerName: string;
  createdAt: string;
}

export interface ResultsRaw {
  taskId: string;
  status: string;
  totalFeedback: number;
  testers: number;
  items: FeedbackItem[];
}

export interface AIFeedbackIssue {
  scenario: string;
  step: string;
  severity: string;
  category: string;
  description: string;
  reproducibility: string;
  reportedBy: number;
  totalTesters: number;
  screenshotUrl?: string;
}

export interface ResultsAI {
  taskId: string;
  appUrl: string;
  summary: {
    totalScenarios: number;
    passed: number;
    failed: number;
    testers: number;
    consensusScore: number;
  };
  issues: AIFeedbackIssue[];
  aiPrompt: string;
}

export interface RoundStats {
  id: string;
  roundNumber: number;
  status: string;
  retestOnly: boolean;
  testerCount: number;
  assignedCount: number;
  createdAt: string;
  stats: {
    totalFeedback: number;
    passed: number;
    failed: number;
    passRate: number;
  };
}

interface RetestInput {
  scenarioIds?: string[];
  testerCount?: number;
}

export interface RetestResponse {
  roundNumber: number;
  status: string;
  retestOnly: boolean;
  scenarioCount: number;
}

export interface TaskTesterInfo {
  id: string;
  name: string;
  bio: string | null;
  technologies: string[];
  avatarUrl: string | null;
  memberSince: string;
  assignmentStatus: string;
  testerScore: number | null;
  testerLevel: string | null;
  rounds: number[];
  taskStats: {
    feedbackCount: number;
    passed: number;
    failed: number;
    passRate: number;
    detailScore: number;
  };
  globalStats: {
    totalTests: number;
    completedTests: number;
  };
}

export interface TaskTestersResponse {
  taskId: string;
  total: number;
  testers: TaskTesterInfo[];
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public body?: unknown
  ) {
    // Enrich message with server error details
    const bodyMsg =
      body && typeof body === "object" && body !== null
        ? (body as Record<string, unknown>).message ||
          (body as Record<string, unknown>).error ||
          ""
        : "";
    super(bodyMsg ? `${message}: ${bodyMsg}` : message);
    this.name = "ApiError";
  }
}

export class HumanCheckApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text().catch(() => "Unknown error");
      }
      throw new ApiError(
        response.status,
        `API request failed: ${method} ${path} -> ${response.status}`,
        errorBody
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/markdown")) {
      return (await response.text()) as T;
    }

    return (await response.json()) as T;
  }

  // --- Projects ---

  async createProject(input: CreateProjectInput): Promise<ProjectResponse> {
    return this.request<ProjectResponse>("POST", "/api/v1/projects", input);
  }

  async updateProject(id: string, data: { name?: string; appUrl?: string; description?: string; autoAcceptTesters?: boolean }): Promise<ProjectResponse> {
    return this.request<ProjectResponse>("PUT", `/api/v1/projects/${id}`, data);
  }

  async listProjects(includeArchived?: boolean): Promise<ProjectResponse[]> {
    const query = includeArchived ? "?includeArchived=true" : "";
    return this.request<ProjectResponse[]>("GET", `/api/v1/projects${query}`);
  }

  async archiveProject(id: string): Promise<ProjectResponse> {
    return this.request<ProjectResponse>("PUT", `/api/v1/projects/${id}/archive`);
  }

  async unarchiveProject(id: string): Promise<ProjectResponse> {
    return this.request<ProjectResponse>("PUT", `/api/v1/projects/${id}/unarchive`);
  }

  async getProject(id: string): Promise<ProjectResponse> {
    return this.request<ProjectResponse>("GET", `/api/v1/projects/${id}`);
  }

  // --- Scenario Generation ---

  async generateScenarios(
    appUrl: string,
    description: string
  ): Promise<Array<{ title: string; steps: Array<{ instruction: string; expectedResult: string }> }> | null> {
    try {
      const result = await this.request<{
        scenarios: Array<{
          title: string;
          steps: Array<{ instruction: string; expectedResult: string }>;
        }>;
      }>("POST", "/api/v1/scenarios/generate", { appUrl, description });
      return result.scenarios;
    } catch {
      return null; // fallback — server unavailable or AI not configured
    }
  }

  // --- Scenarios ---

  async addScenario(input: CreateScenarioInput): Promise<ScenarioResponse> {
    return this.request<ScenarioResponse>("POST", "/api/v1/scenarios", input);
  }

  async addScenarios(
    inputs: CreateScenarioInput[]
  ): Promise<ScenarioResponse[]> {
    const results: ScenarioResponse[] = [];
    for (const input of inputs) {
      const scenario = await this.addScenario(input);
      results.push(scenario);
    }
    return results;
  }

  async addScenariosBulk(
    projectId: string,
    scenarios: Array<{
      title: string;
      steps: ScenarioStepInput[];
      expectedOutcome?: string;
      screenshotUrl?: string;
    }>
  ): Promise<ScenarioResponse[]> {
    return this.request<ScenarioResponse[]>("POST", "/api/v1/scenarios/bulk", {
      projectId,
      scenarios,
    });
  }

  async listScenarios(projectId: string): Promise<ScenarioResponse[]> {
    return this.request<ScenarioResponse[]>(
      "GET",
      `/api/v1/scenarios?projectId=${encodeURIComponent(projectId)}`
    );
  }

  async updateScenario(
    id: string,
    data: { title?: string; steps?: ScenarioStepInput[]; expectedOutcome?: string; screenshotUrl?: string }
  ): Promise<ScenarioResponse> {
    return this.request<ScenarioResponse>("PUT", `/api/v1/scenarios/${id}`, data);
  }

  async deleteScenario(id: string): Promise<void> {
    return this.request<void>("DELETE", `/api/v1/scenarios/${id}`);
  }

  // --- Tasks ---

  async cancelTask(id: string): Promise<TaskResponse> {
    return this.request<TaskResponse>("POST", `/api/v1/tasks/${id}/cancel`);
  }

  async createTask(input: CreateTaskInput): Promise<TaskResponse> {
    return this.request<TaskResponse>("POST", "/api/v1/tasks", input);
  }

  async listTasks(): Promise<TaskWithProject[]> {
    return this.request<TaskWithProject[]>("GET", "/api/v1/tasks");
  }

  async getTask(id: string): Promise<TaskWithProject> {
    return this.request<TaskWithProject>("GET", `/api/v1/tasks/${id}`);
  }

  async getTaskRounds(taskId: string): Promise<RoundStats[]> {
    return this.request<RoundStats[]>("GET", `/api/v1/tasks/${taskId}/rounds`);
  }

  async getTaskTesters(taskId: string): Promise<TaskTestersResponse> {
    return this.request<TaskTestersResponse>("GET", `/api/v1/tasks/${taskId}/testers`);
  }

  async getTaskProgress(taskId: string): Promise<{
    taskId: string;
    taskStatus: string;
    totalScenarios: number;
    testers: Array<{ name: string; status: string; completedScenarios: number; totalScenarios: number }>;
  }> {
    return this.request("GET", `/api/v1/tasks/${taskId}/progress`);
  }

  async retest(taskId: string, data: RetestInput): Promise<RetestResponse> {
    return this.request<RetestResponse>(
      "POST",
      `/api/v1/tasks/${taskId}/retest`,
      data
    );
  }

  // --- Results ---

  async getResultsRaw(taskId: string): Promise<ResultsRaw> {
    return this.request<ResultsRaw>(
      "GET",
      `/api/v1/feedback/${taskId}/results`
    );
  }

  async getResultsAI(taskId: string): Promise<ResultsAI> {
    return this.request<ResultsAI>(
      "GET",
      `/api/v1/feedback/${taskId}/results?format=ai`
    );
  }

  async getResultsMarkdown(taskId: string): Promise<string> {
    return this.request<string>(
      "GET",
      `/api/v1/feedback/${taskId}/results?format=markdown`
    );
  }
}

/**
 * Creates an API client from environment variables.
 */
export function createApiClient(): HumanCheckApiClient {
  const baseUrl =
    process.env.HUMANCHECK_API_URL || "http://localhost:3010";
  const apiKey = process.env.HUMANCHECK_API_KEY || "";

  if (!apiKey) {
    throw new Error(
      "HUMANCHECK_API_KEY environment variable is required. " +
        "Set it in your MCP server configuration."
    );
  }

  return new HumanCheckApiClient({ baseUrl, apiKey });
}
