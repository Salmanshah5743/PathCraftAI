import {
  generateStudyPlanResult,
  type GeneratePlanRequestBody,
} from "../../lib/generatePlan.ts";

interface NetlifyEvent {
  httpMethod?: string;
  body?: string | null;
  isBase64Encoded?: boolean;
}

interface NetlifyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

export async function handler(event: NetlifyEvent): Promise<NetlifyResponse> {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: JSON_HEADERS,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: "Method not allowed. Use POST." }),
    };
  }

  let parsedBody: GeneratePlanRequestBody = {};
  if (event.body) {
    try {
      const rawBody = event.isBase64Encoded
        ? Buffer.from(event.body, "base64").toString("utf8")
        : event.body;
      parsedBody = JSON.parse(rawBody) as GeneratePlanRequestBody;
    } catch {
      return {
        statusCode: 400,
        headers: JSON_HEADERS,
        body: JSON.stringify({ error: "Invalid JSON request body." }),
      };
    }
  }

  const result = await generateStudyPlanResult(parsedBody);
  return {
    statusCode: result.status,
    headers: JSON_HEADERS,
    body: JSON.stringify(result.body),
  };
}
