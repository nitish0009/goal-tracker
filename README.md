# AtomQuest Goals — In-House Goal Setting & Tracking Portal

[![Repository](https://img.shields.io/badge/GitHub-goal--tracker-blue)](https://github.com/nitish0009/goal-tracker)

Hackathon submission for **ATOMQUEST HACKATHON 1.0**: a web portal for employee goal creation, manager approval, quarterly check-ins, shared KPIs, reporting, and audit trails.

**Repository:** https://github.com/nitish0009/goal-tracker

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Employee | `employee@atomquest.demo` | `demo123` |
| Manager (L1) | `manager@atomquest.demo` | `demo123` |
| Admin / HR | `admin@atomquest.demo` | `demo123` |

Use **Quick demo login** buttons on the sign-in page, or sign in manually.

**Tip:** Use the header **Demo cycle** dropdown to simulate Goal Setting (May) or Q1–Q4 check-in windows without waiting for calendar dates.

## Quick start

1. Copy `.env.example` to `.env` and set `DATABASE_URL` (PostgreSQL) and `JWT_SECRET`.
2. Use a free [Neon](https://neon.tech) database or local Postgres.

```bash
cp .env.example .env
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```mermaid
flowchart TB
  subgraph client [Browser]
    UI[Next.js App Router + React]
  end
  subgraph server [Node.js Server]
    API[Route Handlers /api]
    Auth[JWT Session Cookies]
  end
  subgraph data [Data Layer]
    Prisma[Prisma ORM 7]
    Postgres[(PostgreSQL / Neon)]
  end
  UI --> API
  API --> Auth
  API --> Prisma
  Prisma --> Postgres
```

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 | Single codebase, SSR, fast hackathon delivery |
| Backend | Next.js Route Handlers | No separate API server; low hosting cost |
| Database | PostgreSQL + Prisma | Required for Vercel serverless; use Neon free tier |
| Auth | JWT in httpOnly cookies | Simple role-based access (Employee / Manager / Admin) |

**Cost optimisation:** Single Next.js deployment on Vercel free tier + Neon PostgreSQL free tier. No paid auth SaaS required for the demo.

## Deploy on Vercel

1. Push this repo to GitHub: [goal-tracker](https://github.com/nitish0009/goal-tracker)
2. Import the project in [Vercel](https://vercel.com/new)
3. Add **Environment Variables** (Production + Preview):

   | Variable | Value |
   |----------|--------|
   | `DATABASE_URL` | PostgreSQL connection string from [Neon](https://neon.tech) (use **pooled** URL for serverless) |
   | `JWT_SECRET` | Long random string (e.g. `openssl rand -base64 32`) |

4. Deploy — build runs `prisma migrate deploy` then `next build` via `vercel-build`.
5. After first deploy, seed demo data from your machine:

   ```bash
   DATABASE_URL="your-neon-url" npm run db:seed
   ```

**Note:** SQLite is not supported on Vercel (read-only/ephemeral filesystem). Use PostgreSQL only.

## Features implemented

### Phase 1 — Goal creation & approval
- Goal sheet with Thrust Area, title, description, UoM, target, weightage
- Validation: total weightage = 100%, min 10% per goal, max 8 goals
- Submit → Manager approve (inline edit) or return for rework
- Locked goals after approval; Admin unlock
- Shared goals: Admin/Manager push KPI; recipients adjust weightage only; primary owner syncs achievement

### Phase 2 — Achievement & check-ins
- Quarterly actuals, status (Not Started / On Track / Completed)
- Manager check-in comments
- Progress scores: Min/Max numeric & %, Timeline, Zero-based formulas

### Governance
- CSV achievement export
- Completion dashboard (Admin)
- Audit log for post-lock changes

### Cycle windows (enforced + demo override)
| Period | Window |
|--------|--------|
| Goal Setting | 1 May – 30 Jun |
| Q1 | July |
| Q2 | October |
| Q3 | January |
| Q4 / Annual | March – April |

## Demo journey

1. **Employee:** Demo cycle → Goal Setting → edit goals → Submit.
2. **Manager:** Approvals → review/edit → Approve & lock.
3. **Employee:** Demo cycle → Q1 → enter actuals → Save check-in.
4. **Manager:** Check-ins → add comment → complete.
5. **Admin:** Dashboard, Reports (CSV), Audit, Shared Goals.

## Scripts

- `npm run dev` — development server
- `npm run build` — local production build
- `npm run vercel-build` — Vercel build (migrate + Next.js)
- `npm run db:deploy` — apply migrations to production DB
- `npm run db:seed` — reset demo users and sample data
- `npm run db:reset` — migrate reset + seed

