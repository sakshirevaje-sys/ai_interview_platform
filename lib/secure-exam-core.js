export const MAX_VIOLATIONS = 3;
const MAX_VOLUME_SCORE = 60;
const MAX_SEVERITY_SCORE = 40;

const VIOLATION_WEIGHTS = {
  TAB_SWITCH: 5,
  WINDOW_MINIMIZED: 5,
  WINDOW_FOCUS_LOST: 4,
  FULLSCREEN_EXIT: 5,
  PAGE_CLOSE_ATTEMPT: 5,
  UNKNOWN: 3,
};

export function normalizeViolationType(type) {
  const normalized = String(type || "UNKNOWN").toUpperCase().trim();
  return VIOLATION_WEIGHTS[normalized] ? normalized : "UNKNOWN";
}

export function calculateRiskScore(violationTypes) {
  if (!Array.isArray(violationTypes) || violationTypes.length === 0) {
    return 0;
  }

  const totalWeight = violationTypes.reduce(
    (sum, type) => sum + (VIOLATION_WEIGHTS[normalizeViolationType(type)] || VIOLATION_WEIGHTS.UNKNOWN),
    0
  );

  const volumeScore = Math.min(MAX_VOLUME_SCORE, Math.round((violationTypes.length / MAX_VIOLATIONS) * MAX_VOLUME_SCORE));
  const severityScore = Math.min(
    MAX_SEVERITY_SCORE,
    Math.round((totalWeight / (violationTypes.length * 5)) * MAX_SEVERITY_SCORE)
  );
  return Math.min(100, volumeScore + severityScore);
}

export function buildReportSummary({ userId, testId, violationTypes, riskScore }) {
  const grouped = violationTypes.reduce((acc, violationType) => {
    acc[violationType] = (acc[violationType] || 0) + 1;
    return acc;
  }, {});

  const topViolations = Object.entries(grouped)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  return `Cheating risk detected for user ${userId} on test ${testId}. Risk score ${riskScore}/100. Violation pattern: ${topViolations || "none"}.`;
}
