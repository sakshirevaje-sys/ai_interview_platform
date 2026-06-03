# NEXTHIRE-AI

## Secure Exam Mode implementation

Added secure exam mode modules and where they live:

- Frontend monitor: `/tmp/workspace/sakshirevaje-sys/ai_interview_platform/components/secure-exam-monitor.jsx`
- Assessment integration: `/tmp/workspace/sakshirevaje-sys/ai_interview_platform/components/exam-session-shell.jsx`
- Admin dashboard UI: `/tmp/workspace/sakshirevaje-sys/ai_interview_platform/components/admin/secure-exam-dashboard.jsx`
- API routes:
  - `/tmp/workspace/sakshirevaje-sys/ai_interview_platform/app/api/secure-exam/violations/route.js`
  - `/tmp/workspace/sakshirevaje-sys/ai_interview_platform/app/api/secure-exam/dashboard/route.js`
  - `/tmp/workspace/sakshirevaje-sys/ai_interview_platform/app/api/secure-exam/assessment/[testId]/status/route.js`
- Prisma schema: `/tmp/workspace/sakshirevaje-sys/ai_interview_platform/prisma/schema.prisma`
- Real-time WebSocket hub: `/tmp/workspace/sakshirevaje-sys/ai_interview_platform/lib/secure-exam-ws.js`
- Standalone Node/Express server (optional): `/tmp/workspace/sakshirevaje-sys/ai_interview_platform/server/secure-exam-server.js`

### Run

1. `npm install`
2. `npx prisma migrate dev --name secure_exam_mode`
3. `npm run dev`
4. Visit:
   - `http://localhost:3000/assessment/<test-id>`
   - `http://localhost:3000/admin/secure-exam`
