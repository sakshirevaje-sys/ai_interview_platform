import test from "node:test";
import assert from "node:assert/strict";
import { calculateRiskScore, MAX_VIOLATIONS, normalizeViolationType } from "./secure-exam-core.js";

test("normalizeViolationType falls back to UNKNOWN", () => {
  assert.equal(normalizeViolationType("tab_switch"), "TAB_SWITCH");
  assert.equal(normalizeViolationType("does_not_exist"), "UNKNOWN");
});

test("calculateRiskScore returns zero with no violations", () => {
  assert.equal(calculateRiskScore([]), 0);
});

test("calculateRiskScore increases for repeated severe violations", () => {
  const score = calculateRiskScore(["TAB_SWITCH", "FULLSCREEN_EXIT", "PAGE_CLOSE_ATTEMPT", "TAB_SWITCH"]);
  assert.ok(score >= 80);
});

test("max violations lock threshold is fixed at 3", () => {
  assert.equal(MAX_VIOLATIONS, 3);
});
