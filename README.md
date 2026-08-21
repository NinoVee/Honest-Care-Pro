# Honest Care — Physician & Scheduling Web App (Vertical Slice)

A Next.js web application for physicians and schedulers: create patients,
write treatment plans, and schedule nurse visits. Runs on Windows, macOS,
and any modern browser (it's a web app, not a native desktop app).

> This is a working vertical slice, not the full platform described in
> the master spec. It is not HIPAA-compliant on its own, not connected
> to the iOS nurse app yet, and uses no real authentication — see
> "What's stubbed" below before showing this to anyone outside your team.

## What's real in this slice

- Real PostgreSQL database via Prisma — patients, treatment plans, and
  visits you create actually persist.
- Server Actions (Next.js) that write to the database, not mock data.
- Treatment plan versioning: editing a plan after it's signed creates a
  new version rather than overwriting the signed one, per the spec's
  "never overwrite a signed treatment plan" requirement.
- An audit_logs table that records every patient/plan/visit mutation.

## What's stubbed (intentionally, for this first slice)

- **Auth**: there's a role switcher in the header instead of real login/MFA.
  Nothing here checks a real session yet — treat every page as
  unauthenticated until real auth is built.
- **iOS connection**: the SwiftUI nurse app from earlier in this project
  is not wired to this API. Its data (visits, vitals, alerts) lives only
  in-memory on the phone. Connecting them is the next real chunk of work.
- **FHIR / C-CDA**: not implemented in this slice. The Prisma schema uses
  FHIR-friendly field names and identifiers so a mapping layer can be
  added later without a data model rewrite, but there's no FHIR API or
  C-CDA import/export yet.
- **RBAC enforcement**: roles exist in the schema, but pages don't yet
  hide data based on role — a scheduler can currently see clinical
  fields they shouldn't. Flagged with TODOs in the code.

## Running it locally

```bash
cd infrastructure-not-included   # see docker-compose.yml below instead
docker compose up -d             # Postgres
cp .env.example .env
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev                      # http://localhost:3000
```

## Stack

Next.js (App Router) + TypeScript + Tailwind + Prisma + PostgreSQL,
per the spec's preferred stack. Redis is not yet wired in — this slice
doesn't need queues/sessions yet, but the schema and structure leave
room for it (see `docs` notes in the code).
