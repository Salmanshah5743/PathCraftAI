import {
  AlertCircle,
  BookOpen,
  Check,
  Code2,
  Download,
  Dumbbell,
  Flag,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  X,
} from "lucide-react";
import { SAMPLE_GOALS } from "../data/sampleGoals";
import type {
  LearnerProfile,
  ResourceType,
  SampleGoal,
  StudyPlan,
} from "../types/curriculum";
import { getTaskId } from "../utils/pdfExport";

interface PlanWorkspaceProps {
  plan: StudyPlan | null;
  activeProfile: LearnerProfile;
  completedTaskIds: string[];
  selectedWeek: number | "all";
  isGenerating: boolean;
  error: string | null;
  onSelectWeek: (week: number | "all") => void;
  onToggleTask: (taskId: string) => void;
  onResetProgress: () => void;
  onExportPdf: () => void;
  onRetry: () => void;
  onDismissError: () => void;
  onSelectSample: (sample: SampleGoal) => void;
}

const RESOURCE_CONFIG: Record<
  ResourceType,
  { icon: typeof Code2; label: string; style: string }
> = {
  "Hands-on": {
    icon: Code2,
    label: "Hands-on",
    style: "text-indigo-700 bg-indigo-50 border-indigo-200/80",
  },
  Reading: {
    icon: BookOpen,
    label: "Reading",
    style: "text-slate-700 bg-slate-100 border-slate-200",
  },
  Tutorial: {
    icon: PlayCircle,
    label: "Tutorial",
    style: "text-sky-700 bg-sky-50 border-sky-200/80",
  },
  Practice: {
    icon: Dumbbell,
    label: "Practice",
    style: "text-emerald-700 bg-emerald-50 border-emerald-200/80",
  },
};

function PlanSkeleton() {
  return (
    <div className="space-y-6" aria-label="Generating study plan" aria-busy="true">
      {/* Header Summary Skeleton */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2.5 flex-1">
            <div className="h-6 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-10 w-32 shrink-0 animate-pulse rounded-lg bg-indigo-100" />
        </div>
        <div className="mt-5 flex items-center gap-3">
          <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-slate-100" />
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-9 w-24 animate-pulse rounded-lg bg-slate-200/70"
          />
        ))}
      </div>

      {/* 4 Weekly Cards Skeleton */}
      <div className="space-y-5">
        {[1, 2, 3, 4].map((week) => (
          <div
            key={week}
            className="rounded-xl border border-slate-200 bg-white p-6 space-y-4"
          >
            <div className="space-y-2">
              <div className="h-3.5 w-20 animate-pulse rounded bg-indigo-100" />
              <div className="h-5 w-1/2 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="divide-y divide-slate-100 border-t border-slate-100 pt-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-start gap-3 py-3.5">
                  <div className="mt-0.5 h-5 w-5 shrink-0 animate-pulse rounded bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
                    <div className="h-3.5 w-5/6 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
            <div className="h-16 w-full animate-pulse rounded-lg bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyWorkspace({
  onSelectSample,
}: {
  onSelectSample: (sample: SampleGoal) => void;
}) {
  const steps = [
    {
      num: "01",
      title: "Define your target goal",
      body: "Specify the technology, framework, or skill you want to master over the next four weeks.",
    },
    {
      num: "02",
      title: "Calibrate pace and style",
      body: "Match the syllabus depth to your current level, weekly hour budget, and hands-on or docs preference.",
    },
    {
      num: "03",
      title: "Execute and export",
      body: "Check off daily modules as you progress and download a structured multi-page PDF study roadmap.",
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold tracking-wide text-indigo-600">
          How PathCraft AI Works
        </p>
        <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
          Turn any learning goal into a paced 4-week curriculum
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Complete your learner profile on the left to generate a structured roadmap with daily modules, realistic time estimates, and weekly capstone projects.
        </p>
      </div>

      <div className="mt-8 grid gap-6 border-t border-slate-100 pt-7 sm:grid-cols-3">
        {steps.map((step) => (
          <div key={step.num} className="space-y-1.5">
            <span className="font-mono text-xs font-semibold tabular-nums text-indigo-600">
              {step.num}
            </span>
            <h3 className="text-sm font-semibold text-slate-900">
              {step.title}
            </h3>
            <p className="text-xs leading-relaxed text-slate-500">
              {step.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t border-slate-100 pt-6">
        <p className="text-xs font-medium text-slate-500">
          Or test immediately with a sample goal preset:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SAMPLE_GOALS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSelectSample(sample)}
              className="inline-flex min-h-[38px] items-center rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 whitespace-nowrap"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PlanWorkspace({
  plan,
  activeProfile,
  completedTaskIds,
  selectedWeek,
  isGenerating,
  error,
  onSelectWeek,
  onToggleTask,
  onResetProgress,
  onExportPdf,
  onRetry,
  onDismissError,
  onSelectSample,
}: PlanWorkspaceProps) {
  const completedSet = new Set(completedTaskIds);

  const errorBanner = error ? (
    <div
      role="alert"
      className="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
          aria-hidden="true"
        />
        <div className="text-sm leading-relaxed">
          <span className="font-semibold">Unable to generate curriculum. </span>
          <span className="text-red-800">{error}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <button
          type="button"
          onClick={onRetry}
          disabled={isGenerating}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 whitespace-nowrap"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Retry</span>
        </button>
        <button
          type="button"
          onClick={onDismissError}
          aria-label="Dismiss error"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  ) : null;

  if (isGenerating) {
    return (
      <div>
        {errorBanner}
        <PlanSkeleton />
      </div>
    );
  }

  if (!plan) {
    return (
      <div>
        {errorBanner}
        <EmptyWorkspace onSelectSample={onSelectSample} />
      </div>
    );
  }

  const totalTasks = plan.weeks.reduce(
    (sum, week) => sum + week.tasks.length,
    0
  );
  const completedCount = plan.weeks.reduce(
    (sum, week) =>
      sum +
      week.tasks.filter((_, idx) =>
        completedSet.has(getTaskId(week.weekNumber, idx))
      ).length,
    0
  );
  const progressPercent =
    totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const visibleWeeks =
    selectedWeek === "all"
      ? plan.weeks
      : plan.weeks.filter((w) => w.weekNumber === selectedWeek);

  return (
    <div className="space-y-6">
      {errorBanner}

      {/* Header Summary Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-slate-500">
              <span className="text-indigo-700 font-semibold">
                {activeProfile.skillLevel}
              </span>
              <span aria-hidden="true">·</span>
              <span>{activeProfile.weeklyHours}</span>
              <span aria-hidden="true">·</span>
              <span>{activeProfile.learningStyle}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {plan.totalEstimatedHours} hrs total
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {plan.planTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {plan.summary}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onExportPdf}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 font-medium text-slate-700">
              <span className="font-mono tabular-nums text-slate-900 font-semibold">
                {completedCount} of {totalTasks}
              </span>
              <span>tasks completed</span>
              <span className="text-slate-400" aria-hidden="true">
                ·
              </span>
              <span className="font-mono tabular-nums text-indigo-600 font-semibold">
                {progressPercent}%
              </span>
            </div>
            {completedCount > 0 && (
              <button
                type="button"
                onClick={onResetProgress}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:underline whitespace-nowrap"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>Reset progress</span>
              </button>
            )}
          </div>
          <div
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Overall study plan completion"
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100"
          >
            <div
              className="h-full rounded-full bg-indigo-600 transition-[width] duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Week Filter Tabs */}
      <div
        role="tablist"
        aria-label="Filter roadmap by week"
        className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedWeek === "all"}
          onClick={() => onSelectWeek("all")}
          className={`min-h-[36px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 whitespace-nowrap shrink-0 ${
            selectedWeek === "all"
              ? "bg-indigo-600 text-white"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          All Weeks
        </button>
        {plan.weeks.map((week) => {
          const active = selectedWeek === week.weekNumber;
          return (
            <button
              key={week.weekNumber}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectWeek(week.weekNumber)}
              className={`min-h-[36px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 whitespace-nowrap shrink-0 ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              Week {week.weekNumber}
            </button>
          );
        })}
      </div>

      {/* Weekly Roadmap Cards */}
      <div className="space-y-5">
        {visibleWeeks.map((week) => {
          const weekDone = week.tasks.filter((_, idx) =>
            completedSet.has(getTaskId(week.weekNumber, idx))
          ).length;
          const weekHours = week.tasks.reduce(
            (sum, t) => sum + (Number(t.estimatedHours) || 0),
            0
          );

          return (
            <article
              key={week.weekNumber}
              className="rounded-xl border border-slate-200 bg-white p-6"
            >
              {/* Week Header */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
                    <span className="font-mono tabular-nums">
                      Week {String(week.weekNumber).padStart(2, "0")}
                    </span>
                    <span className="text-slate-300" aria-hidden="true">
                      /
                    </span>
                    <span className="font-mono tabular-nums text-slate-500">
                      {weekHours} hrs
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                    {week.theme}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {week.objective}
                  </p>
                </div>

                <div className="shrink-0 font-mono text-xs font-medium tabular-nums text-slate-500">
                  {weekDone}/{week.tasks.length} done
                </div>
              </div>

              {/* Actionable Study Modules */}
              <ul className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
                {week.tasks.map((task, idx) => {
                  const taskId = getTaskId(week.weekNumber, idx);
                  const isCompleted = completedSet.has(taskId);
                  const resMeta =
                    RESOURCE_CONFIG[task.resourceType] ??
                    RESOURCE_CONFIG.Reading;
                  const ResIcon = resMeta.icon;

                  return (
                    <li key={taskId} className="py-4 first:pt-4 last:pb-4">
                      <div className="flex items-start gap-3.5">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={isCompleted}
                          aria-label={`Mark "${task.topic}" as ${
                            isCompleted ? "incomplete" : "complete"
                          }`}
                          onClick={() => onToggleTask(taskId)}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                            isCompleted
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-slate-300 bg-white text-transparent hover:border-indigo-500"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              <span className="font-mono text-xs font-medium text-slate-500 tabular-nums">
                                {task.stepLabel}
                              </span>
                              <span className="text-slate-300" aria-hidden="true">
                                ·
                              </span>
                              <span
                                className={`text-sm font-semibold transition-colors ${
                                  isCompleted
                                    ? "text-slate-400 line-through"
                                    : "text-slate-900"
                                }`}
                              >
                                {task.topic}
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${resMeta.style}`}
                              >
                                <ResIcon
                                  className="h-3 w-3"
                                  aria-hidden="true"
                                />
                                <span>{resMeta.label}</span>
                              </span>
                              <span className="font-mono text-xs font-medium tabular-nums text-slate-500 whitespace-nowrap">
                                {task.estimatedHours} hrs
                              </span>
                            </div>
                          </div>

                          <p
                            className={`mt-1.5 text-sm leading-relaxed transition-colors ${
                              isCompleted ? "text-slate-400" : "text-slate-600"
                            }`}
                          >
                            {task.actionItem}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Weekly Capstone Mini-Project Callout */}
              <div className="mt-2 rounded-lg border border-indigo-200/80 bg-indigo-50/60 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-600/10 text-indigo-700">
                    <Flag className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-indigo-800">
                      Week {week.weekNumber} Capstone Deliverable
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-800">
                      {week.capstoneProject}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
