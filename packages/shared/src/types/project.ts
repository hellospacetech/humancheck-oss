export interface ScenarioStep {
  order: number;
  instruction: string;
  expectedResult: string;
}

export interface CreateProjectDTO {
  name: string;
  appUrl: string;
  description?: string;
}

export interface CreateScenarioDTO {
  title: string;
  steps: ScenarioStep[];
  expectedOutcome: string;
}

export interface ProjectResponse {
  id: string;
  name: string;
  appUrl: string;
  description: string | null;
  createdAt: string;
  scenarioCount: number;
  taskCount: number;
}

export interface ScenarioResponse {
  id: string;
  projectId: string;
  title: string;
  steps: ScenarioStep[];
  expectedOutcome: string;
  createdAt: string;
}
