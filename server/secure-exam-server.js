import http from "node:http";
import express from "express";
import { clerkClient, verifyToken } from "@clerk/nextjs/server";
import { attachSecureExamWSServer, publishSecureExamEvent } from "../lib/secure-exam-ws.js";
import { getAssessmentStatus, getDashboardStats, registerViolation } from "../lib/secure-exam.js";

async function getAuthenticatedUser(req) {
  const authorization = String(req.headers.authorization || "");
  const token = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";

  if (!token || !process.env.CLERK_SECRET_KEY) {
    return null;
  }

  const claims = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  if (!claims?.sub) {
    return null;
  }

  const client = await clerkClient();
  return client.users.getUser(claims.sub);
}

export function createSecureExamServer() {
  const app = express();
  app.use(express.json());

  app.post("/api/secure-exam/violations", async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      const userId = String(user?.id || "").trim();
      const testId = String(req.body.testId || "").trim();
      const violationType = String(req.body.violationType || "").trim();

      if (!userId || !testId || !violationType) {
        return res.status(401).json({ error: "Unauthorized or invalid payload" });
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
      console.error("secure_exam_violation_error", error);
      return res.status(500).json({ error: "Failed to register violation" });
    }
  });

  app.get("/api/secure-exam/dashboard", async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      const role = String(user?.publicMetadata?.role || user?.privateMetadata?.role || "").toLowerCase();

      if (!user || role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const dashboard = await getDashboardStats();
      return res.json(dashboard);
    } catch (error) {
      console.error("secure_exam_dashboard_error", error);
      return res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  app.get("/api/secure-exam/assessment/:testId/status", async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      const userId = String(user?.id || "").trim();
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const status = await getAssessmentStatus({ userId, testId: req.params.testId });
      return res.json(status);
    } catch (error) {
      console.error("secure_exam_status_error", error);
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
