import type { FormEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import type {
  LearnerProfile,
  LearningStyle,
  SkillLevel,
  WeeklyHours,
} from "../types/curriculum";

interface LearnerProfileFormProps {
  profile: LearnerProfile;
  onChange: (updated: LearnerProfile) => void;
  onSubmit: () => void;
  isGenerating: boolean;
}

const SKILL_LEVELS: SkillLevel[] = ["Beginner", "Intermediate", "Advanced"];
const WEEKLY_HOURS: WeeklyHours[] = [
  "3–5 hrs/week",
  "5–10 hrs/week",
  "10+ hrs/week",
];
const LEARNING_STYLES: LearningStyle[] = [
  "Hands-on Projects",
  "Balanced",
  "Theory & Docs",
];

export function LearnerProfileForm({
  profile,
  onChange,
  onSubmit,
  isGenerating,
}: LearnerProfileFormProps) {
  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!profile.goal.trim() || isGenerating) return;
    onSubmit();
  };

  const isGoalEmpty = profile.goal.trim().length === 0;

  return (
    <section
      aria-labelledby="learner-profile-heading"
      className="rounded-xl border border-slate-200 bg-white p-6"
    >
      <div className="mb-6">
        <h1
          id="learner-profile-heading"
          className="text-lg font-semibold tracking-tight text-slate-900"
        >
          Learner Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Set your target skill, weekly bandwidth, and preferred format to shape your 4-week roadmap.
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Target Learning Goal */}
        <div>
          <label
            htmlFor="learning-goal-input"
            className="block text-sm font-medium text-slate-800"
          >
            Target Learning Goal <span className="text-indigo-600">*</span>
          </label>
          <input
            id="learning-goal-input"
            type="text"
            required
            maxLength={300}
            value={profile.goal}
            disabled={isGenerating}
            onChange={(e) => onChange({ ...profile, goal: e.target.value })}
            placeholder="e.g., Master React Hooks and TypeScript"
            className="mt-2 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>

        {/* Current Skill Level */}
        <div>
          <span
            id="skill-level-label"
            className="block text-sm font-medium text-slate-800"
          >
            Current Skill Level
          </span>
          <div
            role="radiogroup"
            aria-labelledby="skill-level-label"
            className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg bg-slate-100 p-1"
          >
            {SKILL_LEVELS.map((level) => {
              const active = profile.skillLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={isGenerating}
                  onClick={() => onChange({ ...profile, skillLevel: level })}
                  className={`min-h-[38px] rounded-md px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 whitespace-nowrap ${
                    active
                      ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/80"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        {/* Weekly Time Commitment */}
        <div>
          <span
            id="weekly-hours-label"
            className="block text-sm font-medium text-slate-800"
          >
            Weekly Time Commitment
          </span>
          <div
            role="radiogroup"
            aria-labelledby="weekly-hours-label"
            className="mt-2 flex flex-wrap gap-1.5"
          >
            {WEEKLY_HOURS.map((hours) => {
              const active = profile.weeklyHours === hours;
              return (
                <button
                  key={hours}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={isGenerating}
                  onClick={() => onChange({ ...profile, weeklyHours: hours })}
                  className={`min-h-[40px] flex-1 min-w-[100px] rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 whitespace-nowrap ${
                    active
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {hours}
                </button>
              );
            })}
          </div>
        </div>

        {/* Learning Style */}
        <div>
          <span
            id="learning-style-label"
            className="block text-sm font-medium text-slate-800"
          >
            Learning Style
          </span>
          <div
            role="radiogroup"
            aria-labelledby="learning-style-label"
            className="mt-2 flex flex-wrap gap-2"
          >
            {LEARNING_STYLES.map((style) => {
              const active = profile.learningStyle === style;
              return (
                <button
                  key={style}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={isGenerating}
                  onClick={() => onChange({ ...profile, learningStyle: style })}
                  className={`min-h-[40px] flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 whitespace-nowrap ${
                    active
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {style}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit CTA */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={isGoalEmpty || isGenerating}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Designing your curriculum...</span>
              </>
            ) : (
              <>
                <span>Generate 4-Week Study Plan</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
