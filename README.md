# NEXTHIRE-AI

## Secure Exam Mode implementation

Added secure exam mode modules and where they live:

- Frontend monitor: `components/secure-exam-monitor.jsx`
- Assessment integration: `components/exam-session-shell.jsx`
- Admin dashboard UI: `components/admin/secure-exam-dashboard.jsx`
- API routes:
  - `app/api/secure-exam/violations/route.js`
  - `app/api/secure-exam/violations/beacon/route.js`
  - `app/api/secure-exam/dashboard/route.js`
  - `app/api/secure-exam/assessment/[testId]/status/route.js`
- Prisma schema: `prisma/schema.prisma`
- Real-time WebSocket hub: `lib/secure-exam-ws.js`
- Standalone Node/Express server (optional): `server/secure-exam-server.js`

### Run

1. `npm install`
2. `npx prisma migrate dev --name secure_exam_mode`
3. `npm run dev`
4. Visit:
   - `http://localhost:3000/assessment/<test-id>`
   - `http://localhost:3000/admin/secure-exam`
