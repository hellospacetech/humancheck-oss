import { UserRole } from "./auth.js";
import { ScenarioStep } from "./project.js";
import { TaskStatus, TaskDifficulty, AssignmentStatus } from "./task.js";
import { Severity, FeedbackCategory, Reproducibility, AIFeedbackResponse } from "./feedback.js";

// --- Common ---
export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthResult {
  token: string;
  user: ApiUser;
}

// --- Projects ---
export interface ApiProject {
  id: string;
  name: string;
  appUrl: string;
  description: string | null;
  status?: "ACTIVE" | "ARCHIVED";
  autoAcceptTesters?: boolean;
  createdAt: string;
  scenarioCount?: number;
  taskCount?: number;
  scenarios?: ApiScenario[];
  tasks?: ApiTask[];
}

// --- Scenarios ---
export interface ApiScenario {
  id: string;
  projectId: string;
  title: string;
  steps: ScenarioStep[];
  expectedOutcome: string;
  createdAt: string;
}

// --- Tasks ---
export interface ApiTask {
  id: string;
  projectId: string;
  status: TaskStatus;
  testerCount: number;
  difficulty: TaskDifficulty;
  deadline: string | null;
  price: number | null;
  createdAt: string;
  project?: { name: string; appUrl: string; description?: string | null };
  assignments?: ApiAssignment[];
  _count?: { assignments: number };
}

export interface ApiAssignment {
  id: string;
  taskId: string;
  testerId: string;
  status: AssignmentStatus;
  tester?: { id: string; name: string };
  startedAt: string | null;
  completedAt: string | null;
}

// --- Feedback ---
export interface ApiFeedbackItem {
  id: string;
  scenarioTitle: string;
  stepNumber: number;
  passFail: boolean;
  severity: Severity | null;
  category: FeedbackCategory | null;
  description: string | null;
  screenshotUrl: string | null;
  reproducibility: Reproducibility | null;
  testerName: string;
  createdAt: string;
}

export interface ApiResultsRaw {
  taskId: string;
  status: string;
  totalFeedback: number;
  testers: number;
  items: ApiFeedbackItem[];
}

export type { AIFeedbackResponse as ApiResultsAI };
