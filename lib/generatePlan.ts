import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

export interface GeneratePlanRequestBody {
  goal?: unknown;
  skillLevel?: unknown;
  weeklyHours?: unknown;
  learningStyle?: unknown;
}

export interface GeneratePlanResponsePayload {
  status: number;
  body: Record<string, unknown>;
}

const SYSTEM_INSTRUCTION =
  "You are an expert technical curriculum designer. Create realistic, paced, practical 4-week study plans tailored strictly to the user's skill level and weekly hour budget. Keep task descriptions crisp, actionable, and tool-specific.";

const FALLBACK_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
];

const STUDY_PLAN_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    planTitle: {
      type: Type.STRING,
      description: "Concise, motivating title for the 4-week learning plan.",
    },
    summary: {
      type: Type.STRING,
      description:
        "2-3 sentence executive summary describing the progression and expected outcome.",
    },
    totalEstimatedHours: {
      type: Type.NUMBER,
      description:
        "Total estimated study hours across all 4 weeks, matching the weekly hour budget.",
    },
    weeks: {
      type: Type.ARRAY,
      description: "Exactly 4 weekly roadmap modules ordered from Week 1 to Week 4.",
      items: {
        type: Type.OBJECT,
        properties: {
          weekNumber: {
            type: Type.INTEGER,
            description: "Week number from 1 to 4.",
          },
          theme: {
            type: Type.STRING,
            description: "Short, clear theme title for the week.",
          },
          objective: {
            type: Type.STRING,
            description: "Core learning objective for the week.",
          },
          tasks: {
            type: Type.ARRAY,
            description: "3 to 4 actionable study modules for this week.",
            items: {
              type: Type.OBJECT,
              properties: {
                stepLabel: {
                  type: Type.STRING,
                  description: "Day or step label, e.g. 'Days 1–2' or 'Days 3–4'.",
                },
                topic: {
                  type: Type.STRING,
                  description: "Specific topic title for this study module.",
                },
                actionItem: {
                  type: Type.STRING,
                  description:
                    "Crisp, actionable, tool-specific task instructions.",
                },
                resourceType: {
                  type: Type.STRING,
                  enum: ["Hands-on", "Reading", "Tutorial", "Practice"],
                  description:
                    "Category of learning activity: Hands-on, Reading, Tutorial, or Practice.",
                },
                estimatedHours: {
                  type: Type.NUMBER,
                  description: "Estimated hours to complete this task (e.g. 1.5 or 2).",
                },
              },
              required: [
                "stepLabel",
                "topic",
                "actionItem",
                "resourceType",
                "estimatedHours",
              ],
            },
          },
          capstoneProject: {
            type: Type.STRING,
            description:
              "Concrete hands-on mini-project deliverable proving mastery for this week.",
          },
        },
        required: [
          "weekNumber",
          "theme",
          "objective",
          "tasks",
          "capstoneProject",
        ],
      },
    },
  },
  required: ["planTitle", "summary", "totalEstimatedHours", "weeks"],
};

const ALLOWED_SKILL_LEVELS = new Set(["Beginner", "Intermediate", "Advanced"]);
const ALLOWED_WEEKLY_HOURS = new Set([
  "3–5 hrs/week",
  "5–10 hrs/week",
  "10+ hrs/week",
]);
const ALLOWED_LEARNING_STYLES = new Set([
  "Hands-on Projects",
  "Balanced",
  "Theory & Docs",
]);
const ALLOWED_RESOURCE_TYPES = new Set([
  "Hands-on",
  "Reading",
  "Tutorial",
  "Practice",
]);

interface RawTask {
  stepLabel?: unknown;
  topic?: unknown;
  actionItem?: unknown;
  resourceType?: unknown;
  estimatedHours?: unknown;
}

interface RawWeek {
  weekNumber?: unknown;
  theme?: unknown;
  objective?: unknown;
  tasks?: unknown;
  capstoneProject?: unknown;
}

interface RawPlan {
  planTitle?: unknown;
  summary?: unknown;
  totalEstimatedHours?: unknown;
  weeks?: unknown;
}

function normalizeStudyPlan(raw: RawPlan) {
  if (!raw || typeof raw.planTitle !== "string" || !Array.isArray(raw.weeks)) {
    return null;
  }

  const normalizedWeeks = (raw.weeks as RawWeek[])
    .filter(
      (w) =>
        w && typeof w === "object" && Array.isArray(w.tasks) && w.tasks.length > 0
    )
    .map((w, idx) => {
      const weekNum =
        typeof w.weekNumber === "number" && Number.isFinite(w.weekNumber)
          ? Math.max(1, Math.min(4, Math.round(w.weekNumber)))
          : idx + 1;

      const tasks = (w.tasks as RawTask[])
        .filter((t) => t && typeof t === "object" && typeof t.topic === "string")
        .map((t, tIdx) => {
          const hours =
            typeof t.estimatedHours === "number" &&
            Number.isFinite(t.estimatedHours) &&
            t.estimatedHours > 0
              ? Math.round(t.estimatedHours * 10) / 10
              : 1.5;

          const resType =
            typeof t.resourceType === "string" &&
            ALLOWED_RESOURCE_TYPES.has(t.resourceType)
              ? t.resourceType
              : "Reading";

          return {
            stepLabel:
              typeof t.stepLabel === "string" && t.stepLabel.trim()
                ? t.stepLabel.trim()
                : `Step ${tIdx + 1}`,
            topic: (t.topic as string).trim(),
            actionItem:
              typeof t.actionItem === "string" && t.actionItem.trim()
                ? t.actionItem.trim()
                : "Complete this study module and summarize key takeaways.",
            resourceType: resType,
            estimatedHours: hours,
          };
        });

      return {
        weekNumber: weekNum,
        theme:
          typeof w.theme === "string" && w.theme.trim()
            ? w.theme.trim()
            : `Week ${weekNum} Focus`,
        objective:
          typeof w.objective === "string" && w.objective.trim()
            ? w.objective.trim()
            : "Build core competency in this week's focus area.",
        tasks,
        capstoneProject:
          typeof w.capstoneProject === "string" && w.capstoneProject.trim()
            ? w.capstoneProject.trim()
            : "Build a mini-project applying the concepts covered this week.",
      };
    })
    .filter((w) => w.tasks.length > 0)
    .sort((a, b) => a.weekNumber - b.weekNumber);

  if (normalizedWeeks.length === 0) {
    return null;
  }

  const computedTotalHours =
    Math.round(
      normalizedWeeks.reduce(
        (sum, week) =>
          sum + week.tasks.reduce((wSum, t) => wSum + t.estimatedHours, 0),
        0
      ) * 10
    ) / 10;

  const totalEstimatedHours =
    typeof raw.totalEstimatedHours === "number" &&
    Number.isFinite(raw.totalEstimatedHours) &&
    raw.totalEstimatedHours > 0
      ? Math.round(raw.totalEstimatedHours * 10) / 10
      : computedTotalHours;

  return {
    planTitle: raw.planTitle.trim(),
    summary:
      typeof raw.summary === "string" && raw.summary.trim()
        ? raw.summary.trim()
        : "A structured 4-week study plan tailored to your goals and weekly schedule.",
    totalEstimatedHours,
    weeks: normalizedWeeks,
  };
}

export async function generateStudyPlanResult(
  input: GeneratePlanRequestBody
): Promise<GeneratePlanResponsePayload> {
  try {
    const body = input || {};
    const goal = typeof body.goal === "string" ? body.goal.trim() : "";
    const rawSkill =
      typeof body.skillLevel === "string" ? body.skillLevel.trim() : "";
    const rawHours =
      typeof body.weeklyHours === "string" ? body.weeklyHours.trim() : "";
    const rawStyle =
      typeof body.learningStyle === "string" ? body.learningStyle.trim() : "";

    if (!goal) {
      return {
        status: 400,
        body: {
          error: "Please enter a target learning goal before generating a plan.",
        },
      };
    }

    if (goal.length > 300) {
      return {
        status: 400,
        body: {
          error: "Target learning goal must be 300 characters or fewer.",
        },
      };
    }

    const skillLevel = ALLOWED_SKILL_LEVELS.has(rawSkill)
      ? rawSkill
      : "Beginner";
    const weeklyHours = ALLOWED_WEEKLY_HOURS.has(rawHours)
      ? rawHours
      : "5–10 hrs/week";
    const learningStyle = ALLOWED_LEARNING_STYLES.has(rawStyle)
      ? rawStyle
      : "Balanced";

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        status: 500,
        body: {
          error:
            "GEMINI_API_KEY is not configured. Please add GEMINI_API_KEY in your environment variables (Netlify Site configuration > Environment variables or Settings > Secrets).",
        },
      };
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const userPrompt = [
      `Design a tailored 4-week study plan for the following learner profile:`,
      `- Target Learning Goal: ${goal}`,
      `- Current Skill Level: ${skillLevel}`,
      `- Weekly Time Commitment: ${weeklyHours}`,
      `- Preferred Learning Style: ${learningStyle}`,
      ``,
      `Requirements:`,
      `1. Produce exactly 4 weeks (weekNumber 1, 2, 3, 4) with progressive difficulty appropriate for the ${skillLevel} level.`,
      `2. Each week must contain 3 to 4 actionable tasks whose estimatedHours sum close to the ${weeklyHours} budget.`,
      `3. Reflect the "${learningStyle}" style in the task mix and resourceType distribution ("Hands-on", "Reading", "Tutorial", "Practice").`,
      `4. Every week must end with a concrete, practical capstoneProject deliverable.`,
    ].join("\n");

    let responseText: string | undefined;
    let lastError: unknown;

    for (const model of FALLBACK_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: STUDY_PLAN_SCHEMA,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });
        responseText = response.text?.trim();
        if (responseText) break;
      } catch (err: unknown) {
        lastError = err;
        // Automatically try the next model in FALLBACK_MODELS
      }
    }

    const rawText = responseText;
    if (!rawText) {
      if (lastError) throw lastError;
      return {
        status: 502,
        body: {
          error:
            "The curriculum generator returned an empty response. Please retry.",
        },
      };
    }

    const parsed = JSON.parse(rawText) as RawPlan;
    const plan = normalizeStudyPlan(parsed);
    if (!plan) {
      return {
        status: 502,
        body: {
          error: "Received an incomplete curriculum structure. Please retry.",
        },
      };
    }

    return { status: 200, body: { plan } };
  } catch (err: unknown) {
    console.error("Error generating study plan:", err);
    const message =
      err instanceof Error
        ? err.message
        : "An unexpected error occurred while generating the study plan.";

    if (
      message.includes("PERMISSION_DENIED") ||
      message.includes("API_KEY_INVALID") ||
      message.includes("403")
    ) {
      return {
        status: 403,
        body: {
          error:
            "API key error: Please verify your GEMINI_API_KEY in your environment variables.",
        },
      };
    }

    if (message.includes("RESOURCE_EXHAUSTED") || message.includes("429")) {
      return {
        status: 429,
        body: {
          error:
            "Rate limit reached on the Gemini API. Please wait a moment and try again.",
        },
      };
    }

    if (message.includes("503") || message.includes("UNAVAILABLE")) {
      return {
        status: 503,
        body: {
          error:
            "The AI model is temporarily experiencing high demand. Please click Retry in a moment.",
        },
      };
    }

    return {
      status: 500,
      body: {
        error: `Failed to generate study plan: ${message}`,
      },
    };
  }
}