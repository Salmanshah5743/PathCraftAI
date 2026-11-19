# PathCraft AI — Prompt & Error Resolution Log

This file records the initial build specifications, runtime/API errors encountered during development, and the verified fixes applied.

---

## Build Log

### 2026-11-18 — Initial Application Build
- **Goal**: Build **PathCraft AI — AI Learning Path Builder** using React, TypeScript, Tailwind CSS, Lucide React, `@google/genai`, Express, and `jspdf`.
- **Implemented**:
  - `server.ts`: Express server on port `3000` with Vite middleware in development, static `dist/` serving in production, and `POST /api/generate-plan` using `responseMimeType: "application/json"` + strict `responseSchema`.
  - `src/components/TopNav.tsx`: Header branding and **Load Sample Goal** dropdown with 3 one-click presets.
  - `src/components/LearnerProfileForm.tsx`: Learner profile inputs (Target Learning Goal, Skill Level, Weekly Time Commitment, Learning Style).
  - `src/components/PlanWorkspace.tsx`: Empty 3-step onboarding state, 4-week skeleton loader, dismissible error banner with Retry, summary header with progress bar, week filter tabs, interactive `localStorage`-persisted task checklist, and weekly Capstone Deliverable callouts.
  - `src/utils/pdfExport.ts`: Programmatic multi-page PDF exporter (`PathCraft-4-Week-Study-Plan.pdf`) using `jspdf` with automatic page-break detection (`y + neededHeight > 270`).

---

## Error & Fix Log

### Error 01 — Gemini Model `404 NOT_FOUND` on `gemini-2.5-flash`
- **Timestamp**: 2026-11-18T03:21:44-08:00
- **Symptom / Error Message**:
  ```json
  {
    "error": {
      "code": 404,
      "message": "This model models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.8-flash for the latest features and improvements.",
      "status": "NOT_FOUND"
    }
  }
  ```
- **Root Cause**: `models/gemini-2.5-flash` returned `404 NOT_FOUND` for the project's API access.
- **Fix Applied**:
  - Updated `server.ts` (`POST /api/generate-plan`) to use the active **`gemini-4-hydrogen`** model with `ThinkingLevel.LOW` inside `thinkingConfig`.
- **Verification**:
  - Ran `npm run lint` (`tsc --noEmit`) and `vite build` — both passed with zero errors.
  - Restarted the Express + Vite server.

---

### Error 02 — Transient Gemini `503 UNAVAILABLE` During Live Generation Test
- **Timestamp**: 2026-11-18T03:22:07-08:00
- **Symptom / Error Message**:
  ```json
  {
    "error": {
      "code": 503,
      "message": "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.",
      "status": "UNAVAILABLE"
    }
  }
  ```
- **Root Cause**: Temporary upstream model capacity spike (`503 UNAVAILABLE`) with single-shot `ai.models.generateContent` invocation.
- **Fix Applied**:
  - Wrapped `ai.models.generateContent` in `server.ts` with an automatic exponential-backoff retry loop (up to 3 attempts, waiting `attempt * 1000ms` between transient `503`, `UNAVAILABLE`, or `DEADLINE_EXCEEDED` responses).
- **Verification**:
  - Re-ran `tsc --noEmit` and `vite build` — passed with zero errors.
  - Restarted the server and verified `POST /api/generate-plan` returned a complete, schema-valid 4-week JSON curriculum (`"Mastering TypeScript Generics: A 4-Week Hands-On Roadmap"`).

---

### Error 03 — Malformed JSON Request Body Returned HTML Stack Trace
- **Timestamp**: 2026-11-18T03:40:31-08:00
- **Symptom / Error Message**:
  - Sending malformed JSON to `POST /api/generate-plan` returned an Express HTML `SyntaxError` stack trace instead of structured JSON.
- **Root Cause**: `express.json()` parse errors fell through to Express's default HTML error handler.
- **Fix Applied**:
  - Added an Express JSON syntax error-handling middleware in `server.ts` returning HTTP `400` `{ "error": "Invalid JSON request body." }`.
  - Added input length cap (`<= 300` chars), allowlist normalization for profile fields, and deep `normalizeStudyPlan` validation for Gemini outputs.
- **Verification**:
  - Verified `curl -X POST -d '{bad json'` returns HTTP `400` `{"error":"Invalid JSON request body."}` and oversized goals return HTTP `400`.

---

### Error 04 — Unvalidated `localStorage` State & Retry Edge Cases
- **Timestamp**: 2026-11-18T03:41:20-08:00
- **Symptom / Error Message**:
  - Corrupted or partial `StudyPlan` / `LearnerProfile` objects in `localStorage` could pass `JSON.parse` and trigger runtime `TypeError` crashes when rendering `PlanWorkspace`.
  - Clicking `Retry` after clearing the input field would no-op if `formProfile.goal` was empty.
- **Root Cause**: `readStoredJson` checked JSON syntax without validating object shape, and `onRetry` read live form state instead of the last failed payload.
- **Fix Applied**:
  - Added `isValidStudyPlan`, `isValidProfile`, and `isStringArray` runtime type guards in `src/App.tsx`.
  - Added `lastAttemptedProfileRef` for reliable `Retry` and `requestSeqRef` to ignore stale overlapping responses.
- **Verification**:
  - Verified via Playwright reload test with corrupted JSON and partial objects in `localStorage`.

---

### Error 05 — jsPDF Non-WinAnsi Unicode Encoding & Narrow Mobile Button Overflow
- **Timestamp**: 2026-11-18T03:41:26-08:00
- **Symptom / Error Message**:
  - Standard Type1 `helvetica` in `jsPDF` cannot encode characters outside WinAnsi/Latin-1 (e.g., arrows, bullets, emojis), and `metaLine2` lacked wrapping.
  - The 3-column `Weekly Time Commitment` grid in `LearnerProfileForm.tsx` risked horizontal clipping on `375px` mobile viewports with `whitespace-nowrap`.
- **Root Cause**: Unsanitized Unicode strings passed to `doc.text(...)` and fixed `grid-cols-3` width constraints on narrow screens.
- **Fix Applied**:
  - Added `toPdfSafeText()` normalization, `splitTextToSize` wrapping on metadata lines, and pre-summary page break checks in `src/utils/pdfExport.ts`.
  - Switched `WEEKLY_HOURS` selector container in `src/components/LearnerProfileForm.tsx` to responsive `flex flex-wrap gap-1.5` with `flex-1 min-w-[100px]`.
- **Verification**:
  - Checked mobile `375x812` and desktop `1440x900` layouts and validated downloaded PDF output (`PathCraft-4-Week-Study-Plan.pdf`).

---

### Error 06 — Mobile Header Overlap Between Logo and Load Sample Goal Button
- **Timestamp**: 2026-11-19T00:49:45-08:00
- **Symptom / Error Message**:
  - On narrow mobile viewports, the `PathCraft AI` logo/title and the `Load Sample Goal` button crowded and merged together in the top navigation bar.
- **Root Cause**: Fixed desktop sizing (`h-10 px-4 text-sm`, `gap-6`, `h-9 w-9`, `text-lg`) exceeded narrow mobile screen widths.
- **Fix Applied**:
  - Updated `src/components/TopNav.tsx` with compact mobile sizing: smaller brand icon (`h-8 w-8 sm:h-9 sm:w-9`) and title (`text-base sm:text-lg`), compact button (`h-8 px-2.5 text-xs gap-1` showing `"Sample Goal"` on mobile and `"Load Sample Goal"` on `sm:`+), responsive container spacing (`gap-2 px-3.5 sm:gap-6 sm:px-6`), and viewport-clamped dropdown width (`w-[min(20rem,calc(100vw-1.75rem))] sm:w-80`).
- **Verification**:
  - Ran `compile_applet` (`vite build`) and `lint_applet` (`tsc --noEmit`) — both passed with zero errors.

---

## Future Error Entry Template

```markdown
### Error XX — <Short Title>
- **Timestamp**: <ISO-8601>
- **Symptom / Error Message**: <Exact error text>
- **Root Cause**: <Why it happened>
- **Fix Applied**: <Files changed and what was updated>
- **Verification**: <Build, lint, and runtime checks run>
```
