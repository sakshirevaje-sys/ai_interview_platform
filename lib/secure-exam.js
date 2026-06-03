import { prisma } from "./prisma.js";
import { buildReportSummary, calculateRiskScore, MAX_VIOLATIONS, normalizeViolationType } from "./secure-exam-core.js";

export { calculateRiskScore, MAX_VIOLATIONS, normalizeViolationType };

export async function registerViolation({ userId, testId, violationType, metadata }) {
  const normalizedType = normalizeViolationType(violationType);

  return prisma.$transaction(async (tx) => {
    const existingSession = await tx.secureExamSession.upsert({
      where: { userId_testId: { userId, testId } },
      create: {
        userId,
        testId,
      },
      update: {},
    });

    const nextCount = existingSession.violationCount + 1;
    const shouldLock = nextCount >= MAX_VIOLATIONS;

    const session = await tx.secureExamSession.update({
      where: { id: existingSession.id },
      data: {
        violationCount: nextCount,
        locked: shouldLock ? true : existingSession.locked,
        autoSubmitted: shouldLock ? true : existingSession.autoSubmitted,
      },
    });

    const violation = await tx.secureExamViolation.create({
      data: {
        sessionId: session.id,
        userId,
        testId,
        violationType: normalizedType,
        metadata: metadata || undefined,
      },
    });

    let report = null;
    if (session.locked) {
      const allViolations = await tx.secureExamViolation.findMany({
        where: { sessionId: session.id },
        select: { violationType: true },
      });
      const allTypes = allViolations.map((entry) => entry.violationType);
      const riskScore = calculateRiskScore(allTypes);
      const summary = buildReportSummary({ userId, testId, violationTypes: allTypes, riskScore });

      report = await tx.cheatingReport.upsert({
        where: { sessionId: session.id },
        create: {
          sessionId: session.id,
          userId,
          testId,
          totalViolations: allTypes.length,
          riskScore,
          summary,
        },
        update: {
          totalViolations: allTypes.length,
          riskScore,
          summary,
          generatedAt: new Date(),
        },
      });
    }

    return {
      session,
      violation,
      report,
      maxViolations: MAX_VIOLATIONS,
    };
  });
}

export async function getAssessmentStatus({ userId, testId }) {
  const session = await prisma.secureExamSession.findUnique({
    where: { userId_testId: { userId, testId } },
  });

  return {
    locked: session?.locked ?? false,
    autoSubmitted: session?.autoSubmitted ?? false,
    violationCount: session?.violationCount ?? 0,
    maxViolations: MAX_VIOLATIONS,
  };
}

export async function getDashboardStats() {
  const violations = await prisma.secureExamViolation.findMany({
    select: {
      userId: true,
      testId: true,
      violationType: true,
      timestamp: true,
    },
    orderBy: {
      timestamp: "desc",
    },
  });

  const userMap = new Map();
  const testMap = new Map();

  for (const violation of violations) {
    const userEntry = userMap.get(violation.userId) || { userId: violation.userId, count: 0, violations: [] };
    userEntry.count += 1;
    userEntry.violations.push(violation.violationType);
    userMap.set(violation.userId, userEntry);

    const testEntry = testMap.get(violation.testId) || { testId: violation.testId, count: 0, violations: [] };
    testEntry.count += 1;
    testEntry.violations.push(violation.violationType);
    testMap.set(violation.testId, testEntry);
  }

  const userWise = [...userMap.values()].map((entry) => ({
    userId: entry.userId,
    totalViolations: entry.count,
    cheatingRiskScore: calculateRiskScore(entry.violations),
  }));

  const testWise = [...testMap.values()].map((entry) => ({
    testId: entry.testId,
    totalViolations: entry.count,
    cheatingRiskScore: calculateRiskScore(entry.violations),
  }));

  return {
    totalViolations: violations.length,
    userWise: userWise.sort((a, b) => b.totalViolations - a.totalViolations),
    testWise: testWise.sort((a, b) => b.totalViolations - a.totalViolations),
  };
}
