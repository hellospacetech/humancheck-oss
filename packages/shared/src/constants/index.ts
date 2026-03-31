export const MAX_TESTERS_PER_TASK = 20;
export const MIN_TESTERS_PER_TASK = 1;
export const MAX_SCENARIOS_PER_PROJECT = 50;
export const MAX_STEPS_PER_SCENARIO = 30;
export const JWT_EXPIRY = "7d";
export const FEEDBACK_CHANNELS = ["WEB", "TELEGRAM", "WHATSAPP"] as const;
export type FeedbackChannel = (typeof FEEDBACK_CHANNELS)[number];
