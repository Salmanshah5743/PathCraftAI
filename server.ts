import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  generateStudyPlanResult,
  type GeneratePlanRequestBody,
} from "./lib/generatePlan.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";

async function createServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  // Ensure malformed JSON bodies return clean JSON rather than HTML error pages
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (
        err instanceof SyntaxError &&
        "status" in err &&
        (err as { status?: number }).status === 400
      ) {
        return res.status(400).json({
          error: "Invalid JSON request body.",
        });
      }
      return next(err);
    }
  );

  app.post("/api/generate-plan", async (req, res) => {
    const result = await generateStudyPlanResult(
      (req.body || {}) as GeneratePlanRequestBody
    );
    return res.status(result.status).json(result.body);
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      const indexPath = path.join(distDir, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Build output not found. Run npm run build first.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PathCraft AI server running at http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
