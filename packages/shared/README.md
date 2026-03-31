# @humancheck/shared

Shared TypeScript types, interfaces, and constants for the [HumanCheck](https://humancheckme.com) platform.

## Install

```bash
npm install @humancheck/shared
```

## Usage

```typescript
import {
  TaskStatus,
  TaskDifficulty,
  type ApiTask,
  type ApiFeedbackItem,
  type CreateTaskDTO,
  MAX_TESTERS_PER_TASK,
  FEEDBACK_CHANNELS,
} from "@humancheck/shared";

// Enums
const status = TaskStatus.ACTIVE;
const difficulty = TaskDifficulty.MEDIUM;

// Constants
console.log(MAX_TESTERS_PER_TASK); // 20
console.log(FEEDBACK_CHANNELS);    // ["WEB", "TELEGRAM", "WHATSAPP"]
```

## Exports

### Enums
- `TaskStatus` — DRAFT, ACTIVE, IN_PROGRESS, COMPLETED, CANCELLED
- `TaskDifficulty` — EASY, MEDIUM, HARD
- `AssignmentStatus` — PENDING, ACCEPTED, IN_PROGRESS, COMPLETED
- `UserRole` — CUSTOMER, TESTER, ADMIN
- `Severity` — LOW, MEDIUM, HIGH, CRITICAL
- `FeedbackCategory` — UI, FUNCTIONALITY, PERFORMANCE, SECURITY, OTHER
- `Reproducibility` — ALWAYS, SOMETIMES, RARELY, ONCE

### Interfaces
- `ApiProject`, `ApiScenario`, `ApiTask`, `ApiAssignment`
- `ApiFeedbackItem`, `ApiResultsRaw`, `ApiResultsAI`
- `CreateTaskDTO`, `TaskResponse`, `AuthResult`

### Constants
- `MAX_TESTERS_PER_TASK`, `MIN_TESTERS_PER_TASK`
- `MAX_SCENARIOS_PER_PROJECT`, `MAX_STEPS_PER_SCENARIO`
- `FEEDBACK_CHANNELS`

## License

[MIT](../../LICENSE)
