# 🧸 Baby's Daily Hub

A full-stack toddler daily management app built with **Next.js 14**, **Prisma**, and **Vercel Postgres**.

## Features

- 📅 **Routine** — Fully editable daily schedule with categories, add/edit/delete items
- 📊 **Tracker** — Sleep, nap, water, diaper, health log, and mood tracking per day
- 🍽️ **Meals** — Daily meal log (breakfast, lunch, dinner, snacks) + vitamin tracker
- ⭐ **Growth** — Milestone tracker with status management, add custom milestones
- 📝 **Notes** — Daily notes, parent reminders, upcoming appointments, baby profile

All data persists in Vercel Postgres via Prisma ORM.

---

## Deploy to Vercel (step by step)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create baby-hub --public --push
# or manually create repo on github.com and push
```

### 2. Create a Vercel project

1. Go to [vercel.com](https://vercel.com) and click **Add New Project**
2. Import your GitHub repo
3. Leave all build settings as default — Vercel auto-detects Next.js

### 3. Add Vercel Postgres

1. In your Vercel project dashboard, go to **Storage** tab
2. Click **Create Database** → choose **Postgres**
3. Name it `baby-hub-db` and click **Create**
4. Once created, click **Connect to Project** — this automatically adds the env vars:
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`

### 4. Deploy

Click **Deploy** in Vercel. The build script runs `prisma generate && next build` automatically.

### 5. Seed the database (first time only)

After first deploy, run the seed locally:

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local and paste your Vercel Postgres URLs from the dashboard
cp .env.example .env.local
# Edit .env.local with your actual URLs

# 3. Push schema and seed
npm run db:push
node prisma/seed.js
```

That's it! Your app is live with default routine and milestones pre-loaded.

---

## Local development

```bash
# Install
npm install

# Set up env (copy from Vercel dashboard → Storage → your DB → .env.local tab)
cp .env.example .env.local

# Push Prisma schema
npm run db:push

# Seed default data
node prisma/seed.js

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project structure

```
src/
  app/
    api/
      routine/         → GET, POST + [id] PATCH, DELETE
      tracker/         → GET, PUT (upsert by date)
      meals/           → GET, PUT (upsert by date)
      milestones/      → GET, POST + [id] PATCH, DELETE
      notes/           → GET, PUT (upsert by date)
      appointments/    → GET, POST + [id] PATCH, DELETE
      profile/         → GET, PUT
    page.tsx           → Main app with tab navigation
    layout.tsx         → Root layout
    providers.tsx      → React Query + Toast
  components/
    ui/index.tsx       → Reusable UI components
    RoutineSection.tsx
    TrackerSection.tsx
    MealsSection.tsx
    MilestonesSection.tsx
    NotesSection.tsx
  lib/
    prisma.ts          → Prisma singleton
    utils.ts           → Helpers
  types/index.ts       → Shared TypeScript types
prisma/
  schema.prisma        → Database schema
  seed.js              → Default data seed
```

---

## Tech stack

| Layer      | Technology             |
|------------|------------------------|
| Framework  | Next.js 14 (App Router)|
| Database   | Vercel Postgres        |
| ORM        | Prisma 5               |
| Styling    | Tailwind CSS           |
| State      | TanStack React Query   |
| Animation  | Framer Motion          |
| Deployment | Vercel                 |
