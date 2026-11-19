import { jsPDF } from "jspdf";
import type { LearnerProfile, StudyPlan } from "../types/curriculum";

function toPdfSafeText(input: string): string {
  return input
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u2022/g, "-")
    .replace(/\u2192/g, "->")
    .replace(/\u2190/g, "<-")
    .replace(/\u00D7/g, "x")
    .replace(/\u00F7/g, "/")
    .replace(/\u00A0/g, " ")
    // Strip characters outside printable ASCII + Latin-1 supplement that standard Helvetica cannot encode
    .replace(/[^\x20-\x7E\xA1-\xFF\n]/g, "")
    .trim();
}

export function getTaskId(weekNumber: number, taskIndex: number): string {
  return `w${weekNumber}-t${taskIndex}`;
}

export function exportStudyPlanToPdf(
  plan: StudyPlan,
  profile: LearnerProfile,
  completedTaskIds: string[]
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2;
  const completedSet = new Set(completedTaskIds);

  let y = 20;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > 270) {
      doc.addPage();
      y = 20;
    }
  };

  // Top brand kicker
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text("PATHCRAFT AI  -  4-WEEK LEARNING ROADMAP", marginX, y);
  y += 7;

  // Plan Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(15, 23, 42); // slate-900
  const titleLines = doc.splitTextToSize(
    toPdfSafeText(plan.planTitle),
    contentWidth
  );
  doc.text(titleLines, marginX, y);
  y += titleLines.length * 7.5 + 3;

  // Metadata summary bar
  const totalTasks = plan.weeks.reduce((acc, w) => acc + w.tasks.length, 0);
  const completedCount = plan.weeks.reduce(
    (acc, w) =>
      acc +
      w.tasks.filter((_, idx) => completedSet.has(getTaskId(w.weekNumber, idx)))
        .length,
    0
  );

  const metaLine1Lines = doc.splitTextToSize(
    `Goal: ${toPdfSafeText(profile.goal)}`,
    contentWidth - 8
  );
  const metaLine2Text = toPdfSafeText(
    `Level: ${profile.skillLevel}  |  Pace: ${profile.weeklyHours}  |  Style: ${profile.learningStyle}  |  Total: ${plan.totalEstimatedHours} hrs  |  Completed: ${completedCount}/${totalTasks}`
  );
  const metaLine2Lines = doc.splitTextToSize(metaLine2Text, contentWidth - 8);
  const metaBoxHeight =
    8 + metaLine1Lines.length * 4.5 + metaLine2Lines.length * 4.2;

  checkPageBreak(metaBoxHeight + 6);

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(marginX, y, contentWidth, metaBoxHeight, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(metaLine1Lines, marginX + 4, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFontSize(8.5);
  doc.text(metaLine2Lines, marginX + 4, y + 6 + metaLine1Lines.length * 4.5 + 1.5);
  y += metaBoxHeight + 7;

  // Executive Summary
  const summaryLines = doc.splitTextToSize(
    toPdfSafeText(plan.summary),
    contentWidth
  );
  checkPageBreak(12 + summaryLines.length * 4.8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Executive Summary", marginX, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text(summaryLines, marginX, y);
  y += summaryLines.length * 4.8 + 6;

  // Horizontal divider
  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 8;

  // Weeks Loop
  for (const week of plan.weeks) {
    const safeTheme = toPdfSafeText(week.theme);
    const safeObjective = toPdfSafeText(week.objective);
    const objectiveLines = doc.splitTextToSize(
      `Objective: ${safeObjective}`,
      contentWidth
    );
    const themeLines = doc.splitTextToSize(safeTheme, contentWidth);
    const weekHeaderHeight =
      10 + themeLines.length * 5.8 + objectiveLines.length * 4.6;
    checkPageBreak(weekHeaderHeight + 16);

    // Week label & theme
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(79, 70, 229); // indigo-600
    const weekTotalHours =
      Math.round(
        week.tasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0) *
          10
      ) / 10;
    doc.text(`WEEK ${week.weekNumber}  -  ${weekTotalHours} HRS`, marginX, y);
    y += 5.5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(themeLines, marginX, y);
    y += themeLines.length * 5.8 + 1;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(objectiveLines, marginX, y);
    y += objectiveLines.length * 4.6 + 5;

    // Tasks
    for (let idx = 0; idx < week.tasks.length; idx++) {
      const task = week.tasks[idx];
      const isDone = completedSet.has(getTaskId(week.weekNumber, idx));
      const statusMark = isDone ? "[x]" : "[ ]";
      const taskHeader = toPdfSafeText(
        `${statusMark}  ${task.stepLabel} - ${task.topic}`
      );
      const taskMeta = toPdfSafeText(
        `${task.resourceType}  -  ${task.estimatedHours} hrs`
      );
      const safeAction = toPdfSafeText(task.actionItem);

      const headerLines = doc.splitTextToSize(taskHeader, contentWidth - 6);
      const actionLines = doc.splitTextToSize(safeAction, contentWidth - 10);
      const neededHeight =
        headerLines.length * 4.8 + actionLines.length * 4.4 + 9;

      checkPageBreak(neededHeight);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(isDone ? 100 : 15, isDone ? 116 : 23, isDone ? 139 : 42);
      doc.text(headerLines, marginX + 2, y);
      y += headerLines.length * 4.8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(79, 70, 229);
      doc.text(taskMeta, marginX + 8, y + 0.5);
      y += 4.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(actionLines, marginX + 8, y);
      y += actionLines.length * 4.4 + 4;
    }

    // Highlighted Capstone Box
    const capstoneLines = doc.splitTextToSize(
      toPdfSafeText(week.capstoneProject),
      contentWidth - 10
    );
    const boxHeight = 11 + capstoneLines.length * 4.5;
    checkPageBreak(boxHeight + 6);

    doc.setFillColor(238, 242, 255); // indigo-50
    doc.setDrawColor(199, 210, 254); // indigo-200
    doc.roundedRect(marginX, y, contentWidth, boxHeight, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(67, 56, 202); // indigo-700
    doc.text(
      `WEEK ${week.weekNumber} CAPSTONE DELIVERABLE`,
      marginX + 5,
      y + 5.5
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 27, 75); // indigo-950
    doc.text(capstoneLines, marginX + 5, y + 10.5);

    y += boxHeight + 9;
  }

  // Page numbers in footer
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`PathCraft AI  -  Generated Study Plan`, marginX, 287);
    doc.text(`Page ${p} of ${pageCount}`, pageWidth - marginX, 287, {
      align: "right",
    });
  }

  doc.save("PathCraft-4-Week-Study-Plan.pdf");
}
