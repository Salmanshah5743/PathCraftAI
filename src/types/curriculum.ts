export type SkillLevel = "Beginner" | "Intermediate" | "Advanced";

export type WeeklyHours = "3–5 hrs/week" | "5–10 hrs/week" | "10+ hrs/week";

export type LearningStyle =
  | "Hands-on Projects"
  | "Balanced"
  | "Theory & Docs";

export type ResourceType = "Hands-on" | "Reading" | "Tutorial" | "Practice";

export interface LearnerProfile {
  goal: string;
  skillLevel: SkillLevel;
  weeklyHours: WeeklyHours;
  learningStyle: LearningStyle;
}

export interface StudyTask {
  stepLabel: string;
  topic: string;
  actionItem: string;
  resourceType: ResourceType;
  estimatedHours: number;
}

export interface StudyWeek {
  weekNumber: number;
  theme: string;
  objective: string;
  tasks: StudyTask[];
  capstoneProject: string;
}

export interface StudyPlan {
  planTitle: string;
  summary: string;
  totalEstimatedHours: number;
  weeks: StudyWeek[];
}

export interface SampleGoal extends LearnerProfile {
  id: string;
  label: string;
  shortMeta: string;
}
