import { useEffect, useRef, useState } from "react";
import { LearnerProfileForm } from "./components/LearnerProfileForm";
import { PlanWorkspace } from "./components/PlanWorkspace";
import { TopNav } from "./components/TopNav";
import type {
  LearnerProfile,
  SampleGoal,
  StudyPlan,
} from "./types/curriculum";
import { exportStudyPlanToPdf } from "./utils/pdfExport";

const STORAGE_KEYS = {
  PLAN: "pathcraft_active_plan_v1",
  PROFILE: "pathcraft_active_profile_v1",
  COMPLETED: "pathcraft_completed_tasks_v1",
};

const DEFAULT_PROFILE: LearnerProfile = {
  goal: "",
  skillLevel: "Intermediate",
  weeklyHours: "5–10 hrs/week",
  learningStyle: "Hands-on Projects",
};

function isValidStudyPlan(value: unknown): value is StudyPlan {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StudyPlan>;
  if (
    typeof candidate.planTitle !== "string" ||
    typeof candidate.summary !== "string" ||
    typeof candidate.totalEstimatedHours !== "number" ||
    !Array.isArray(candidate.weeks) ||
    candidate.weeks.length === 0
  ) {
    return false;
  }
  return candidate.weeks.every(
    (w) =>
      w &&
      typeof w === "object" &&
      typeof w.weekNumber === "number" &&
      typeof w.theme === "string" &&
      typeof w.objective === "string" &&
      typeof w.capstoneProject === "string" &&
      Array.isArray(w.tasks) &&
      w.tasks.every(
        (t) =>
          t &&
          typeof t === "object" &&
          typeof t.stepLabel === "string" &&
          typeof t.topic === "string" &&
          typeof t.actionItem === "string" &&
          typeof t.estimatedHours === "number"
      )
  );
}

function isValidProfile(value: unknown): value is LearnerProfile {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<LearnerProfile>;
  return (
    typeof p.goal === "string" &&
    (p.skillLevel === "Beginner" ||
      p.skillLevel === "Intermediate" ||
      p.skillLevel === "Advanced") &&
    (p.weeklyHours === "3–5 hrs/week" ||
      p.weeklyHours === "5–10 hrs/week" ||
      p.weeklyHours === "10+ hrs/week") &&
    (p.learningStyle === "Hands-on Projects" ||
      p.learningStyle === "Balanced" ||
      p.learningStyle === "Theory & Docs")
  );
}

function readStoredJson<T>(
  key: string,
  fallback: T,
  validator: (value: unknown) => value is T
): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return validator(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export default function App() {
  const [formProfile, setFormProfile] = useState<LearnerProfile>(() =>
    readStoredJson<LearnerProfile>(
      STORAGE_KEYS.PROFILE,
      DEFAULT_PROFILE,
      isValidProfile
    )
  );
  const [activeProfile, setActiveProfile] = useState<LearnerProfile>(() =>
    readStoredJson<LearnerProfile>(
      STORAGE_KEYS.PROFILE,
      DEFAULT_PROFILE,
      isValidProfile
    )
  );
  const [plan, setPlan] = useState<StudyPlan | null>(() =>
    readStoredJson<StudyPlan | null>(
      STORAGE_KEYS.PLAN,
      null,
      (v): v is StudyPlan | null => v === null || isValidStudyPlan(v)
    )
  );
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>(() =>
    readStoredJson<string[]>(STORAGE_KEYS.COMPLETED, [], isStringArray)
  );
  const [selectedWeek, setSelectedWeek] = useState<number | "all">("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastAttemptedProfileRef = useRef<LearnerProfile | null>(null);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    try {
      if (plan) {
        window.localStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(plan));
      } else {
        window.localStorage.removeItem(STORAGE_KEYS.PLAN);
      }
    } catch {
      // Ignore storage quota errors
    }
  }, [plan]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.PROFILE,
        JSON.stringify(activeProfile)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [activeProfile]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.COMPLETED,
        JSON.stringify(completedTaskIds)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [completedTaskIds]);

  const generateCurriculum = async (targetProfile: LearnerProfile) => {
    const trimmedGoal = targetProfile.goal.trim();
    if (!trimmedGoal) return;

    const normalizedProfile: LearnerProfile = {
      ...targetProfile,
      goal: trimmedGoal,
    };

    lastAttemptedProfileRef.current = normalizedProfile;
    const seq = ++requestSeqRef.current;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedProfile),
      });

      const payload = await response.json().catch(() => ({}));
      if (seq !== requestSeqRef.current) return;

      if (!response.ok) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : `Request failed with status ${response.status}`
        );
      }

      if (!isValidStudyPlan(payload.plan)) {
        throw new Error("Invalid curriculum response received from server.");
      }

      setPlan(payload.plan);
      setActiveProfile(normalizedProfile);
      setCompletedTaskIds([]);
      setSelectedWeek("all");
    } catch (err: unknown) {
      if (seq !== requestSeqRef.current) return;
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while generating your curriculum.";
      setError(message);
    } finally {
      if (seq === requestSeqRef.current) {
        setIsGenerating(false);
      }
    }
  };

  const handleSelectSample = (sample: SampleGoal) => {
    const nextProfile: LearnerProfile = {
      goal: sample.goal,
      skillLevel: sample.skillLevel,
      weeklyHours: sample.weeklyHours,
      learningStyle: sample.learningStyle,
    };
    setFormProfile(nextProfile);
    void generateCurriculum(nextProfile);
  };

  const handleToggleTask = (taskId: string) => {
    setCompletedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleResetProgress = () => {
    setCompletedTaskIds([]);
  };

  const handleExportPdf = () => {
    if (!plan) return;
    exportStudyPlanToPdf(plan, activeProfile, completedTaskIds);
  };

  const handleRetry = () => {
    const target = formProfile.goal.trim()
      ? formProfile
      : lastAttemptedProfileRef.current;
    if (target) {
      void generateCurriculum(target);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopNav
        onSelectSample={handleSelectSample}
        isGenerating={isGenerating}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left Column (4 cols) — Learner Profile Form Card */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <LearnerProfileForm
              profile={formProfile}
              onChange={setFormProfile}
              onSubmit={() => void generateCurriculum(formProfile)}
              isGenerating={isGenerating}
            />
          </div>

          {/* Right Column (8 cols) — Weekly Plan Workspace */}
          <div className="lg:col-span-8">
            <PlanWorkspace
              plan={plan}
              activeProfile={activeProfile}
              completedTaskIds={completedTaskIds}
              selectedWeek={selectedWeek}
              isGenerating={isGenerating}
              error={error}
              onSelectWeek={setSelectedWeek}
              onToggleTask={handleToggleTask}
              onResetProgress={handleResetProgress}
              onExportPdf={handleExportPdf}
              onRetry={handleRetry}
              onDismissError={() => setError(null)}
              onSelectSample={handleSelectSample}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
