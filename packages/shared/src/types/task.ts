export enum TaskStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum TaskDifficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

export enum AssignmentStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export interface CreateTaskDTO {
  projectId: string;
  testerCount: number;
  difficulty: TaskDifficulty;
  deadline?: string;
  price?: number;
}

export interface TaskResponse {
  id: string;
  projectId: string;
  status: TaskStatus;
  testerCount: number;
  difficulty: TaskDifficulty;
  deadline: string | null;
  price: number | null;
  createdAt: string;
  assignedCount: number;
  completedCount: number;
}

export interface TaskAssignmentResponse {
  id: string;
  taskId: string;
  testerId: string;
  testerName: string;
  status: AssignmentStatus;
  startedAt: string | null;
  completedAt: string | null;
}
