"use client";

import { useEffect, useState } from "react";

function riskColor(score) {
  if (score >= 80) return "#b91c1c";
  if (score >= 50) return "#b45309";
  return "#166534";
}

export default function SecureExamDashboard() {
  const [data, setData] = useState({ totalViolations: 0, userWise: [], testWise: [] });

  useEffect(() => {
    let active = true;

    const load = async () => {
      const response = await fetch("/api/secure-exam/dashboard");
      if (!response.ok || !active) return;
      const payload = await response.json();
      if (active) setData(payload);
    };

    load();
    const interval = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <main style={{ maxWidth: 1100, margin: "24px auto", padding: 20 }}>
      <h1>Secure Exam Admin Dashboard</h1>
      <div style={{ background: "#111827", color: "white", padding: 16, borderRadius: 10, marginBottom: 20 }}>
        Total Violations: <strong>{data.totalViolations}</strong>
      </div>

      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <div style={{ background: "white", borderRadius: 8, padding: 16 }}>
          <h2>User-wise violations</h2>
          <ul>
            {data.userWise.map((row) => (
              <li key={row.userId} style={{ marginBottom: 8 }}>
                <strong>{row.userId}</strong>: {row.totalViolations} violations —{" "}
                <span style={{ color: riskColor(row.cheatingRiskScore) }}>{row.cheatingRiskScore}% risk</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ background: "white", borderRadius: 8, padding: 16 }}>
          <h2>Test-wise violations</h2>
          <ul>
            {data.testWise.map((row) => (
              <li key={row.testId} style={{ marginBottom: 8 }}>
                <strong>{row.testId}</strong>: {row.totalViolations} violations —{" "}
                <span style={{ color: riskColor(row.cheatingRiskScore) }}>{row.cheatingRiskScore}% risk</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
