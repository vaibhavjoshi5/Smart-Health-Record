# Smart Health Record

Compact full-stack application for managing appointments, medical records, file uploads, and an AI chat assistant.

## Tech stack
- Frontend: React
- Backend: Node.js, Express
- Database: MongoDB (Mongoose)
- Auth: JWT / session-based routes

## Key features
- User authentication with patient/doctor roles
- Appointment scheduling and doctor panel
- Medical record CRUD and secure file uploads
- AI-powered chat assistant (prototype route)
- Unit/integration tests for server routes

## Quick setup (local)
1. Install server dependencies

```bash
cd smart-health-record/server
npm install
npm run dev
```

2. Install and run client

```bash
cd smart-health-record/client
npm install
npm start
```

Or run the included `start-app.bat` from the project root on Windows.

## Production build (client)

```bash
cd smart-health-record/client
npm run build
# serve the `build` folder or configure your static host
```

## Resume-ready bullets
- Built a full-stack Smart Health Record app (React, Node.js/Express, MongoDB) implementing authentication, role-based doctor/patient views, appointment scheduling, and secure medical-record CRUD.
- Integrated file upload pipeline and an AI chat assistant endpoint; designed RESTful APIs and reusable React components to improve developer productivity and UX.
- Wrote unit and integration tests for critical server routes, added production build scripts and startup automation for local demos.

Suggested single-line resume entry:

"Developed a full‑stack Smart Health Record application (React, Node.js, MongoDB) with authentication, appointment scheduling, medical-record management, secure file uploads, and an AI chat prototype."

## Demo / next steps
- Deploy the backend to Heroku/Azure and frontend to Vercel for a live demo link.
- Add CI (GitHub Actions) to run tests and lint on PRs.
- Replace placeholders with metrics (users onboarded, test coverage, performance gains) for stronger impact.

---
If you want, I can: deploy a live demo, add CI, or expand tests next.
