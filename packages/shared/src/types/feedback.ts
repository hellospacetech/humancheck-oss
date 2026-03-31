export enum Severity {
  CRITICAL = "CRITICAL",
  MAJOR = "MAJOR",
  MINOR = "MINOR",
  COSMETIC = "COSMETIC",
}

export enum FeedbackCategory {
  UX = "UX",
  FUNCTIONAL = "FUNCTIONAL",
  VISUAL = "VISUAL",
  PERFORMANCE = "PERFORMANCE",
  ACCESSIBILITY = "ACCESSIBILITY",
}

export enum Reproducibility {
  ALWAYS = "ALWAYS",
  SOMETIMES = "SOMETIMES",
  ONCE = "ONCE",
}

export interface CreateFeedbackDTO {
  scenarioId: string;
  stepNumber: number;
  passFail: boolean;
  severity?: Severity;
  category?: FeedbackCategory;
  description?: string;
  screenshotUrl?: string;
  reproducibility?: Reproducibility;
}

export interface FeedbackItemResponse {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  stepNumber: number;
  passFail: boolean;
  severity: Severity | null;
  category: FeedbackCategory | null;
  description: string | null;
  screenshotUrl: string | null;
  reproducibility: Reproducibility | null;
  testerName: string;
}

export interface AIFeedbackIssue {
  scenario: string;
  step: string;
  severity: Severity;
  category: FeedbackCategory;
  description: string;
  reproducibility: Reproducibility;
  reportedBy: number;
  totalTesters: number;
  screenshotUrl?: string;
}

export interface AIFeedbackResponse {
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
