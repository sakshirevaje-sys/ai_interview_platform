import http from "node:http";
import express from "express";
import { attachSecureExamWSServer, publishSecureExamEvent } from "../lib/secure-exam-ws.js";
import { getAssessmentStatus, getDashboardStats, registerViolation } from "../lib/secure-exam.js";

export function createSecureExamServer() {
  const app = express();
  app.use(express.json());

  app.post("/api/secure-exam/violations", async (req, res) => {
    try {
      const userId = String(req.headers["x-clerk-user-id"] || req.body.userId || "").trim();
      const testId = String(req.body.testId || "").trim();
      const violationType = String(req.body.violationType || "").trim();

      if (!userId || !testId || !violationType) {
        return res.status(400).json({ error: "userId, testId and violationType are required" });
      }

      const result = await registerViolation({
        userId,
        testId,
        violationType,
        metadata: req.body.metadata,
      });

      publishSecureExamEvent({
        type: "VIOLATION_RECORDED",
        payload: {
          userId,
          testId,
          violationType: result.violation.violationType,
          violationCount: result.session.violationCount,
          maxViolations: result.maxViolations,
          locked: result.session.locked,
          autoSubmitted: result.session.autoSubmitted,
          timestamp: result.violation.timestamp,
        },
      });

      return res.json({
        success: true,
        violationCount: result.session.violationCount,
        maxViolations: result.maxViolations,
        locked: result.session.locked,
        autoSubmitted: result.session.autoSubmitted,
        report: result.report,
      });
    } catch (error) {
      return res.status(500).json({ error: "Failed to register violation" });
    }
  });

  app.get("/api/secure-exam/dashboard", async (_req, res) => {
    try {
      const dashboard = await getDashboardStats();
      return res.json(dashboard);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  app.get("/api/secure-exam/assessment/:testId/status", async (req, res) => {
    try {
      const userId = String(req.headers["x-clerk-user-id"] || req.query.userId || "").trim();
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const status = await getAssessmentStatus({ userId, testId: req.params.testId });
      return res.json(status);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch assessment status" });
    }
  });

  const server = http.createServer(app);
  attachSecureExamWSServer(server);
  return server;
}

if (process.argv[1] && process.argv[1].endsWith("secure-exam-server.js")) {
  const port = Number(process.env.SECURE_EXAM_PORT || 4010);
  const server = createSecureExamServer();
  server.listen(port, () => {
    process.stdout.write(`Secure exam server listening on ${port}\n`);
  });
}
