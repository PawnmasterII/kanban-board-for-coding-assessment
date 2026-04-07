# Kanban Board

A Linear/Asana-inspired task management board built with Next.js, Supabase, and Tailwind CSS. No login required — the app creates an anonymous session automatically on first load.

## Features

- **4-column Kanban board** — To Do, In Progress, In Review, Done
- **Custom columns** — add and delete columns with a colour picker
- **Drag and drop** — move tasks between columns with optimistic UI updates
- **Task detail panel** — click any task to open a right slide-over with inline editing
- **Comments** — real-time via Supabase Realtime
- **Activity log** — append-only audit trail for every change
- **Labels** — create colour-coded labels and attach them to tasks
- **Assignees** — create team members and assign them to tasks
- **Due date indicators** — yellow (due within 24h), red (overdue)
- **Search** — live filter across all columns
- **Anonymous auth** — zero friction, no sign-up needed

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database & Auth | Supabase (PostgreSQL + anonymous auth + Realtime) |
| Styling | Tailwind CSS v4 |
| Drag & Drop | @dnd-kit/core |
| Icons | lucide-react |
| Language | TypeScript |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env.local` and fill in your project URL and anon key:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key
```

### 3. Run the database schema

In **Supabase Dashboard → SQL Editor**, run the full schema from [`SUBMISSION.md`](./SUBMISSION.md#4-database-schema), then run:

```sql
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
```

### 4. Enable anonymous sign-ins

In **Supabase Dashboard → Authentication → Configuration → Sign In / Up**, toggle **Enable anonymous sign-ins** ON.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Deploy to Vercel in one click — it auto-detects Next.js with zero configuration.

Add the two `NEXT_PUBLIC_*` environment variables in your Vercel project settings before deploying.

## Project Structure

```
src/
├── app/              # Next.js App Router entry points
├── components/
│   ├── board/        # Board, columns, cards, modals, pickers
│   ├── header/       # Top navigation bar
│   └── ui/           # Shared UI primitives (Toast, SkeletonCard)
├── hooks/            # useTasks, useTaskDetail, useColumns
├── lib/              # Supabase client, utility functions
├── providers/        # AuthProvider, ToastProvider
└── types/            # TypeScript types for DB and app layer
```

## Architecture & Design Decisions

See [`SUBMISSION.md`](./SUBMISSION.md) for the full technical write-up covering architecture, database schema, RLS policies, tradeoffs, and implementation notes.
