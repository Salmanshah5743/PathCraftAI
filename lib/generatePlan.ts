import { GoogleGenAI, Type, Schema } from "@google/genai";

export interface GeneratePlanRequestBody {
  goal?: string;
  skillLevel?: string;
  weeklyHours?: string;
  focusStyle?: string;
}

export interface StudyTask {
  dayOrStep: string;
  topic: string;
  actionItem: string;
  estimatedHours: number;
}

export interface StudyWeek {
  weekNumber: number;
  theme: string;
  objective: string;
  tasks: StudyTask[];
  weeklyProject: string;
}

export interface StudyPlan {
  title: string;
  summary: string;
  goal: string;
  skillLevel: string;
  weeklyHours: string;
  focusStyle: string;
  weeks: StudyWeek[];
}

export interface GeneratePlanResult {
  status: number;
  body: StudyPlan | { error: string };
}

// Ordered by highest free-tier quota & lowest latency on your account
const FALLBACK_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
];

const STUDY_PLAN_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Concise, motivating title for the 4-week study plan.",
    },
    summary: {
      type: Type.STRING,
      description: "1-2 sentence overview of the learning progression.",
    },
    weeks: {
      type: Type.ARRAY,
      description: "Exactly 4 sequential weeks of study.",
      items: {
        type: Type.OBJECT,
        properties: {
          weekNumber: {
            type: Type.INTEGER,
            description: "Week number from 1 to 4.",
          },
          theme: {
            type: Type.STRING,
            description: "Short theme title for this week.",
          },
          objective: {
            type: Type.STRING,
            description: "1 sentence core learning outcome for this week.",
          },
          tasks: {
            type: Type.ARRAY,
            description: "3 to 4 actionable study modules or daily tasks.",
            items: {
              type: Type.OBJECT,
              properties: {
                dayOrStep: {
                  type: Type.STRING,
                  description: "e.g., 'Days 1–2' or 'Module 1'",
                },
                topic: {
                  type: Type.STRING,
                  description: "Specific sub-topic or concept.",
                },
                actionItem: {
                  type: Type.STRING,
                  description: "Concrete 1-sentence action or exercise.",
                },
                estimatedHours: {
                  type: Type.NUMBER,
                  description: "Estimated hours for this task.",
                },
              },
              required: ["dayOrStep", "topic", "actionItem", "estimatedHours"],
            },
          },
          weeklyProject: {
            type: Type.STRING,
            description: "1-2 sentence practical mini-project to solidify the week.",
          },
        },
        required: [
          "weekNumber",
          "theme",
          "objective",
          "tasks",
          "weeklyProject",
        ],
      },
    },
  },
  required: ["title", "summary", "weeks"],
};

export async function generateStudyPlanResult(
  input: GeneratePlanRequestBody
): Promise<GeneratePlanResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      status: 500,
      body: { error: "Server configuration error: GEMINI_API_KEY is missing." },
    };
  }

  const goal = (input.goal ?? "").trim();
  if (!goal || goal.length < 3) {
    return {
      status: 400,
      body: { error: "Please enter a valid learning goal (at least 3 characters)." },
    };
  }

  const skillLevel = (input.skillLevel ?? "Beginner").trim();
  const weeklyHours = (input.weeklyHours ?? "5–10 hrs/week").trim();
  const focusStyle = (input.focusStyle ?? "Hands-on Projects").trim();

  const prompt = `Create a structured, realistic 4-week study plan for the following learner profile:
- Target Learning Goal: ${goal}
- Current Skill Level: ${skillLevel}
- Weekly Time Commitment: ${weeklyHours}
- Preferred Learning Style: ${focusStyle}

Rules:
1. Return exactly 4 weeks (weekNumber 1 to 4) with progressive difficulty tailored to a ${skillLevel} learner.
2. Include 3 to 4 tasks per week whose estimatedHours sum to match ${weeklyHours}.
3. Tailor tasks and weeklyProject toward ${focusStyle}.
4. Keep every description concise (1 sentence max per task) for fast, scannable reading.`;

  const ai = new GoogleGenAI({ apiKey });
  let lastErrorMessage = "Unable to generate curriculum right now.";

  for (const model of FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction:
            "You are an expert technical curriculum designer. Output strictly valid JSON matching the requested schema.",
          responseMimeType: "application/json",
          responseSchema: STUDY_PLAN_SCHEMA,
          temperature: 0.4,
          maxOutputTokens: 1600,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      });

      const rawText = response.text?.trim();
      if (!rawText) {
        lastErrorMessage = `Empty response from ${model}.`;
        continue;
      }

      const parsed = JSON.parse(rawText) as Omit<
        StudyPlan,
        "goal" | "skillLevel" | "weeklyHours" | "focusStyle"
      >;

      if (!Array.isArray(parsed.weeks) || parsed.weeks.length === 0) {
        lastErrorMessage = `Incomplete curriculum returned by ${model}.`;
        continue;
      }

      return {
        status: 200,
        body: {
          ...parsed,
          goal,
          skillLevel,
          weeklyHours,
          focusStyle,
        },
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown AI generation error";
      lastErrorMessage = message;
      // Continue loop to try the next fallback model
    }
  }

  return {
    status: 502,
    body: {
      error: `AI service temporarily busy (${lastErrorMessage}). Please try again or load a sample goal.`,
    },
  };
}