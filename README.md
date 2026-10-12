# ShiftSync

Scheduling app for three venues (TLC, Nicky's, Farmhouse). Employees set their availability, managers build and publish weekly schedules, and the owner sees every venue in one place.

## Features

- **Role-based login.** Employees log in with a 4-digit PIN. Managers and owners use a username and password. Each role gets different tabs.
- **Availability.** Employees mark each day as unavailable, open, or a set time window.
- **Schedule building.** Managers place shifts on a weekly calendar grid by position (bartender, barback, server, kitchen, etc.).
- **Shift templates and presets.** Define how many people each day and position needs, and save common shift times for quick reuse.
- **Compliance checks.** Flags overtime, short rest between shifts, long shifts, and minor scheduling violations before you publish.
- **Labor summary.** Shows scheduled hours and estimated labor cost.
- **Publish and swaps.** Publish a schedule per venue. Employees can request shift swaps.

| Role     | Tabs |
|----------|------|
| Employee | My Schedule, Team Schedule, My Availability |
| Manager  | Schedule, Team Availability, Shift Template, Shift Presets, Manage Staff |
| Owner    | Overview, Build Schedule, All Schedules, Team Availability, Shift Template, Shift Presets, All Staff |

## Tech Stack

- **Next.js 15** (App Router) with **React 19** and **TypeScript**
- **Tailwind CSS** for styling
- **Prisma 5** ORM
- **PostgreSQL** database
- **npm** package manager

## Getting Started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (local or hosted, e.g. Neon or Supabase)

### Setup

```bash
git clone https://github.com/TylerZolk/TLCSchedule.git
cd TLCSchedule/shiftsync
npm install
```

`npm install` also runs `prisma generate` through the `postinstall` script.

Create a `.env` file in `shiftsync/`:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME"
```

Apply the database migrations:

```bash
npx prisma migrate dev
```

Start the dev server:

```bash
npm run dev
```

Open http://localhost:3000.

### Scripts

| Command         | What it does |
|-----------------|--------------|
| `npm run dev`   | Start the dev server |
| `npm run build` | Run migrations (`prisma migrate deploy`) and build for production |
| `npm start`     | Run the production build |
| `npm run lint`  | Lint the code |

## Project Structure

```
shiftsync/
  app/
    api/            REST routes (shifts, availability, users, swaps, publish, presets)
    page.tsx        Entry point
  components/
    tabs/           One component per tab
    CalendarGrid.tsx
    CompliancePanel.tsx
    LoginScreen.tsx
  lib/
    db.ts           Prisma client
    store.tsx       Client-side state
    constants.ts    Venues, positions, time helpers, labor math
  prisma/
    schema.prisma   Data models
    migrations/
  types/            Shared TypeScript types
```

## Data Model

- **User**: identified by PIN, with role, venue, position, wage, and minor flag
- **Availability**: one row per user per day
- **Shift**: an assigned shift for a user on a given week and day
- **ShiftSlot**: staffing requirement per venue, day, and position
- **ShiftPreset**: saved shift times per venue
- **SwapRequest**: shift swap between two employees
- **PublishedAt**: last publish time per venue

## Tech Choices

**Next.js:** Frontend and API routes live in one project, so there's no separate backend server to run or deploy. It deploys to Vercel with almost no setup.

**Alternatives considered:**
- **React + Express:** more flexible, but two projects to manage and deploy.
- **Django:** strong built-in admin and ORM, but a Python backend would split the stack from the React frontend.

**Prisma + PostgreSQL:** Prisma gives a typed client generated from the schema, and migrations track every schema change in version control. Postgres is free on most hosting providers and handles relational data like users, shifts, and swaps well.

**npm notes:**
- `package.json` lists dependencies with version ranges. `package-lock.json` pins exact versions so every machine installs the same thing. Commit both.
- `node_modules/` and `.env` are gitignored.
- If the app builds for a teammate but not for you, delete `node_modules` and run `npm ci` to install exactly what the lockfile says.
