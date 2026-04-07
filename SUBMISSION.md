# Kanban Board — Technical Submission

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Live Setup Instructions](#2-live-setup-instructions)
3. [Architecture Overview](#3-architecture-overview)
4. [Database Schema](#4-database-schema)
5. [Row Level Security (RLS) Policies](#5-row-level-security-rls-policies)
6. [Authentication Strategy](#6-authentication-strategy)
7. [Component Architecture](#7-component-architecture)
8. [State Management & Data Flow](#8-state-management--data-flow)
9. [Drag-and-Drop Implementation](#9-drag-and-drop-implementation)
10. [Key Features & UX Details](#10-key-features--ux-details)
11. [Technical Tradeoffs & Decisions](#11-technical-tradeoffs--decisions)
12. [Tech Stack](#12-tech-stack)

---

## 1. Project Overview

A full-featured, Linear/Asana-inspired Kanban task management board built with **Next.js 16**, **Supabase**, and **Tailwind CSS**. The application supports anonymous authentication, real-time data sync, drag-and-drop task management, a rich task detail panel, comments, an activity log, labels, assignees, and fully customisable columns.

### Core Features

| Feature | Detail |
|---|---|
| Anonymous auth | Auto sign-in on first load via `supabase.auth.signInAnonymously()` |
| 4-column Kanban board | To Do → In Progress → In Review → Done |
| Custom columns | Add / delete columns with colour picker, persisted to `localStorage` |
| Drag & drop | `@dnd-kit/core` with optimistic UI updates and error revert |
| Task creation | Modal with title, description, priority, due date + advanced (assignee, labels) |
| Task detail panel | Linear-style right slide-over — inline edits auto-save with 800ms debounce |
| Comments | Real-time via Supabase `postgres_changes` subscription |
| Activity log | Append-only audit trail for every status change, edit, and label change |
| Labels | User-scoped labels with colour swatches, many-to-many via junction table |
| Assignees | Inline team member creation with colour avatar |
| Due date visuals | Yellow pill (< 24 h), red pill + alert icon (overdue) |
| Search | Live title + description filter across all columns |
| Board summary | Header chips: total tasks, completed count, overdue count |
| Skeleton loaders | Pulse animation placeholders during initial data fetch |
| Toast notifications | Success / error / info toasts with auto-dismiss after 4 seconds |

---

## 2. Live Setup Instructions

### Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) account

### Steps

**1. Clone and install**

```bash
cd kanban-board
npm install
```

**2. Create Supabase project**

Go to [supabase.com](https://supabase.com), create a new project, then navigate to:
`Project Settings → API`

Copy both values into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key
```

**3. Run the database schema**

In `Supabase Dashboard → SQL Editor → New query`, paste and run the full schema from [Section 4](#4-database-schema).

Then run this second query to allow custom column names:

```sql
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
```

**4. Enable Anonymous Sign-ins**

`Authentication → Configuration → Sign In / Up → Enable anonymous sign-ins → ON`

**5. Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app will automatically create an anonymous user session on first load.

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                                                             │
│  Next.js 16 (App Router) — all UI is "use client"          │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │ AuthProvider │   │ToastProvider │   │  BoardLayout   │  │
│  │  (context)   │   │  (context)   │   │  (root board)  │  │
│  └──────┬───────┘   └──────────────┘   └───────┬────────┘  │
│         │                                       │           │
│         │ session / user_id               ┌─────┴──────┐   │
│         │                                 │  useTasks  │   │
│         │                                 │ useColumns │   │
│         └─────────────────────────────────┤useTaskDetail   │
│                                           └─────┬──────┘   │
└─────────────────────────────────────────────────┼───────────┘
                                                  │ @supabase/ssr
                                                  │ (browser client)
                                    ┌─────────────┴────────────┐
                                    │        Supabase           │
                                    │                           │
                                    │  PostgreSQL + RLS         │
                                    │  Auth (anonymous JWT)     │
                                    │  Realtime (pg_changes)    │
                                    └───────────────────────────┘
```

### Directory structure

```
src/
├── app/
│   ├── layout.tsx          Root layout — mounts AuthProvider + ToastProvider
│   ├── page.tsx            Entry point — shows spinner while session loads
│   └── globals.css         Dark base styles, custom scrollbar
│
├── components/
│   ├── board/
│   │   ├── BoardLayout.tsx       Orchestrates DnD context, columns, modals
│   │   ├── BoardColumn.tsx       Droppable column with dynamic colour
│   │   ├── TaskCard.tsx          Draggable card — priority stripe, labels, due date
│   │   ├── TaskDetailPanel.tsx   Right slide-over — editable fields, comments, activity
│   │   ├── CreateTaskModal.tsx   Create modal with advanced options
│   │   ├── AssigneePicker.tsx    Inline assignee dropdown with member creation
│   │   ├── LabelPicker.tsx       Label dropdown with inline label creation
│   │   └── AddColumnButton.tsx   "Add column" UI with colour picker
│   ├── header/
│   │   └── Header.tsx            Sticky nav — search, stats chips
│   └── ui/
│       ├── SkeletonCard.tsx      Animated loading placeholder
│       └── Toast.tsx             Toast notification pill
│
├── hooks/
│   ├── useTasks.ts         Supabase CRUD + realtime subscription for tasks
│   ├── useTaskDetail.ts    Comments, activity, label ops per task
│   └── useColumns.ts       Column management with localStorage persistence
│
├── lib/
│   ├── supabase.ts         Browser client factory (singleton via @supabase/ssr)
│   ├── utils.ts            priorityMeta, dueDateTier, fmtDate, timeAgo, initials
│   └── mockData.ts         Static column definitions and type exports
│
├── providers/
│   ├── AuthProvider.tsx    Anonymous session bootstrap + context
│   └── ToastProvider.tsx   Toast queue with 4s auto-dismiss
│
└── types/
    ├── app.ts              AppTask, AppMember, AppLabel, Column, CreateTaskInput
    └── database.ts         Supabase Database type (v2 format with Relationships)
```

---

## 4. Database Schema

Run this entire block in **Supabase SQL Editor → New query**:

```sql
-- ============================================================
-- KANBAN BOARD — Full Schema + RLS
-- ============================================================

create extension if not exists "uuid-ossp";

-- 1. TEAM MEMBERS
create table if not exists public.team_members (
  id          uuid primary key default uuid_generate_v4(),
  name        text        not null,
  color       text        not null default '#6366f1',
  avatar_url  text,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);
alter table public.team_members enable row level security;

-- 2. TASKS
create table if not exists public.tasks (
  id          uuid primary key default uuid_generate_v4(),
  title       text        not null,
  description text,
  status      text        not null default 'To Do',
  priority    text        not null default 'Normal'
                check (priority in ('Low', 'Normal', 'High')),
  due_date    date,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  assignee_id uuid        references public.team_members(id) on delete set null,
  created_at  timestamptz not null default now()
);
alter table public.tasks enable row level security;

-- 3. LABELS
create table if not exists public.labels (
  id         uuid primary key default uuid_generate_v4(),
  name       text        not null,
  color      text        not null default '#6366f1',
  user_id    uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.labels enable row level security;

-- 4. TASK_LABELS (junction)
create table if not exists public.task_labels (
  task_id   uuid not null references public.tasks(id)  on delete cascade,
  label_id  uuid not null references public.labels(id) on delete cascade,
  primary key (task_id, label_id)
);
alter table public.task_labels enable row level security;

-- 5. COMMENTS
create table if not exists public.comments (
  id         uuid primary key default uuid_generate_v4(),
  task_id    uuid        not null references public.tasks(id) on delete cascade,
  text       text        not null,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.comments enable row level security;

-- 6. TASK_ACTIVITY (append-only audit log)
create table if not exists public.task_activity (
  id         uuid primary key default uuid_generate_v4(),
  task_id    uuid        not null references public.tasks(id) on delete cascade,
  action     text        not null,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.task_activity enable row level security;

-- Indexes
create index if not exists tasks_user_id_idx         on public.tasks(user_id);
create index if not exists tasks_status_idx          on public.tasks(status);
create index if not exists tasks_assignee_id_idx     on public.tasks(assignee_id);
create index if not exists comments_task_id_idx      on public.comments(task_id);
create index if not exists task_activity_task_id_idx on public.task_activity(task_id);
create index if not exists task_labels_task_id_idx   on public.task_labels(task_id);
create index if not exists task_labels_label_id_idx  on public.task_labels(label_id);
```

### Remove status CHECK constraint (required for custom columns)

```sql
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
```

### Entity Relationship Diagram

```
auth.users (Supabase managed)
    │
    ├── team_members (user_id FK)
    │       │
    │       └── tasks.assignee_id FK ──────────────────┐
    │                                                    │
    ├── tasks (user_id FK) ◄──────────────────────────── ┘
    │       │
    │       ├── task_labels ──── labels (user_id FK)
    │       │
    │       ├── comments (task_id FK, user_id FK)
    │       │
    │       └── task_activity (task_id FK, user_id FK)
    │
    ├── labels (user_id FK)
    ├── comments (user_id FK)
    └── task_activity (user_id FK)
```

---

## 5. Row Level Security (RLS) Policies

Every table uses the same principle: **`user_id = auth.uid()`**. All four operations — SELECT, INSERT, UPDATE, DELETE — are covered. No row is ever visible to another session.

```sql
-- Pattern applied to: tasks, team_members, labels, comments, task_activity

-- SELECT
create policy "<table>: select own" on public.<table>
  for select using (user_id = auth.uid());

-- INSERT
create policy "<table>: insert own" on public.<table>
  for insert with check (user_id = auth.uid());

-- UPDATE
create policy "<table>: update own" on public.<table>
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- DELETE
create policy "<table>: delete own" on public.<table>
  for delete using (user_id = auth.uid());
```

### task_labels (junction table)

Because `task_labels` has no `user_id` column, ownership is derived through its parent task:

```sql
create policy "task_labels: select own" on public.task_labels
  for select using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_labels.task_id
        and tasks.user_id = auth.uid()
    )
  );
-- Same pattern for INSERT and DELETE
```

### task_activity (append-only)

Activity is intentionally **write-once**. No UPDATE or DELETE policies exist — this is a deliberate design decision to ensure the audit trail cannot be modified after the fact.

---

## 6. Authentication Strategy

### Why Anonymous Auth?

The brief required no login screen. Supabase anonymous sign-in issues a real JWT with a stable `user.id` (UUID), which:

- Satisfies all RLS policies (`auth.uid()` returns the anonymous user's ID)
- Persists across page reloads via `localStorage` (handled by `@supabase/ssr`)
- Can later be linked to a real account (email/OAuth) without losing data

### Flow

```
App load
   │
   ├─ AuthProvider mounts
   │       │
   │       ├── supabase.auth.getSession()
   │       │       │
   │       │       ├── Session found ──► restore, setUser, setLoading(false)
   │       │       │
   │       │       └── No session ──► signInAnonymously()
   │       │                               │
   │       │                               └── JWT issued ──► setUser, setLoading(false)
   │       │
   │       └── onAuthStateChange() ──► keeps session live across
   │                                    token refreshes & browser tabs
   │
   └─ Board renders (loading spinner shown until setLoading(false))
```

### Session Persistence

`@supabase/ssr`'s `createBrowserClient` stores the JWT in `localStorage` automatically. On every subsequent page load, `getSession()` returns the existing token — no new anonymous user is created.

---

## 7. Component Architecture

### Data flow diagram

```
BoardLayout (orchestrator)
│
│ useTasks()          ← all Supabase task CRUD + realtime
│ useColumns()        ← localStorage column config
│ useToast()          ← error / success feedback
│
├── Header
│   └── Props: tasks[], searchQuery, onSearch
│
├── DndContext (@dnd-kit)
│   ├── BoardColumn × N        ← useDroppable per column
│   │   └── TaskCard × M       ← useDraggable per card
│   └── DragOverlay            ← ghost card during drag
│
├── CreateTaskModal (conditional)
│   ├── AssigneePicker
│   └── LabelPicker
│
└── TaskDetailPanel (conditional)
    │  useTaskDetail(taskId)   ← comments, activity, labels
    ├── AssigneePicker
    └── LabelPicker
```

### Key component responsibilities

| Component | Responsibility |
|---|---|
| `BoardLayout` | Owns task + column state, DnD context, optimistic update logic, modal visibility |
| `BoardColumn` | Droppable zone, per-column task list, empty state, delete column |
| `TaskCard` | Draggable, renders priority stripe, labels, due date pill, assignee avatar |
| `TaskDetailPanel` | All task editing (debounced auto-save), comments (realtime), activity timeline |
| `CreateTaskModal` | Controlled form with basic + advanced (assignee, labels) sections |
| `AssigneePicker` | Dropdown with inline `team_members` creation |
| `LabelPicker` | Dropdown with inline `labels` creation + colour swatches |
| `AuthProvider` | Bootstraps anonymous session, exposes `{ session, user, loading }` |
| `ToastProvider` | Queue-based toast system, auto-dismiss after 4 s |

---

## 8. State Management & Data Flow

No external state library (Redux, Zustand, Jotai) was used. The application relies on:

### React hooks + prop drilling (intentional for this scope)

- **`useTasks`** — single source of truth for the task list. Owns `tasks[]` state, exposes `setTasks` so `BoardLayout` can apply optimistic updates directly before the async Supabase call settles.
- **`useTaskDetail`** — task-scoped hook: comments, activity, and label operations. Mounted inside `TaskDetailPanel` and unmounted when the panel closes, cleaning up the Realtime channel automatically.
- **`useColumns`** — thin wrapper over `localStorage`. Columns are UI-only configuration; they don't need to live in the database.

### Why no global state library?

The data access pattern here is simple: one list of tasks, one open task at a time, one column config. Adding Zustand or Redux would introduce boilerplate with no architectural benefit at this scale. React's built-in `useState` + `useCallback` + context is sufficient and keeps the bundle small.

---

## 9. Drag-and-Drop Implementation

Built with **`@dnd-kit/core`** — chosen over `react-beautiful-dnd` (unmaintained) and HTML5 DnD API (poor touch support, no custom overlays).

### Mechanics

```
User grabs card (PointerSensor, activationConstraint: distance 5px)
        │
        ▼
onDragStart → find task by active.id → setActiveTask → render DragOverlay
        │
        ▼ (card moves across columns)
BoardColumn (useDroppable) → isOver = true → column highlights with status colour ring
        │
        ▼
onDragEnd
  ├── over === null → no-op (dropped outside)
  ├── same column → no-op
  └── different column:
        1. Optimistic update: setTasks(prev => prev.map status change)
        2. await updateTaskStatus(id, newStatus) — Supabase UPDATE
        3. await insert task_activity row ("Moved from X to Y")
        4. On error:
           - Revert: setTasks(prev => prev.map status back)
           - showToast("Failed to move task — changes reverted.", "error")
```

### Activation constraint

A `distance: 5` pixel threshold prevents accidental drags when the user clicks to open the detail panel. Cards only enter drag mode after 5px of pointer movement.

### DragOverlay

A separate `<DragOverlay>` renders the "lifted" card at the root DnD context level (not inside the column scroll container). This avoids clipping and z-index issues. The overlay card is rendered with `overlay={true}` which applies a `rotate(1.5deg) scale(1.05)` transform and an indigo ring to visually communicate "lifted" state.

---

## 10. Key Features & UX Details

### Due Date Visual System

| State | Condition | Visual |
|---|---|---|
| Normal | Due date > 24 h away | Slate pill, clock icon |
| Warning | Due date ≤ 24 h away | Yellow pill, clock icon |
| Overdue | Due date in the past | Red pill, alert-circle icon |

The `dueDateTier()` utility in `src/lib/utils.ts` computes this at render time on the client.

### Auto-Save in Task Detail Panel

Editing the title or description triggers a **debounced save**:

```
keystroke → clear existing timer → setSaveState("saving") → start 800ms timer
                                                                    │
                                                              (800ms of silence)
                                                                    │
                                                         ┌──────────▼─────────┐
                                                         │ supabase UPDATE     │
                                                         │ logActivity()       │
                                                         │ setSaveState("saved")│
                                                         └─────────────────────┘
                                                         "Saved ✓" shown → fades after 2s
```

### Focus Bug Fix (CreateTaskModal)

The original `useEffect(() => { titleRef.current?.focus(); fetchMembers().then(setMembers); }, [fetchMembers])` caused the cursor to jump back to the title input every time the parent re-rendered (triggered by any keystroke). The root cause: `fetchMembers` was not `useCallback`-wrapped, so it received a new reference on every render, re-triggering the effect.

**Fix**: `fetchMembers` and `fetchLabels` are now `useCallback` in `useTasks`. The modal additionally captures both via `useRef` so the `useEffect` can use an empty `[]` dependency array — running exactly once on mount.

### Realtime Comments

```
useTaskDetail mounts with taskId
        │
        └── Supabase channel: postgres_changes on comments WHERE task_id = taskId
                │
                └── INSERT event → setComments(prev => [...prev, payload.new])
                        │
                        └── prevCommentCount ref check → scroll to bottom only
                            if count increased (prevents scroll-on-open bug)
```

### Custom Columns

Columns are stored as JSON in `localStorage` under key `"kanban-columns"`. The column `id` field doubles as the task `status` value stored in PostgreSQL. The `tasks_status_check` constraint is dropped so any string is valid.

```typescript
interface Column {
  id:    string;   // = task.status value in DB
  label: string;   // display name (can differ from id)
  color: string;   // hex — drives dot, column accent, drop highlight
}
```

---

## 11. Technical Tradeoffs & Decisions

### Anonymous Auth vs. Email/OAuth

**Chosen**: Anonymous auth with `signInAnonymously()`
**Tradeoff**: Data is tied to the device/browser session. Clearing `localStorage` loses the session and the user's data becomes inaccessible (though it remains in the DB). For a production app, providing an "upgrade account" flow (link anonymous → email) would solve this.

### localStorage for Columns vs. Supabase Table

**Chosen**: `localStorage`
**Why**: Columns are UI configuration, not business data. Storing them in the DB would require a new `board_columns` table, RLS policies, and an extra network round-trip on every load.
**Tradeoff**: Column config doesn't sync across devices/browsers. Acceptable for a single-user anonymous board.

### No External State Library

**Chosen**: `useState` + `useCallback` + React context
**Why**: The data graph is shallow — one list of tasks, one open panel. The overhead of Zustand or Redux would be disproportionate.
**Tradeoff**: `setTasks` is passed down from `useTasks` to `BoardLayout` for optimistic updates. In a larger app with many subscribers, a global store would be cleaner.

### Optimistic UI for Drag-and-Drop

**Chosen**: Immediate state update → background DB write → revert on error
**Why**: Perceived performance. A 200–400ms latency on drag makes the board feel sluggish. Optimistic updates make it feel instant.
**Tradeoff**: In a multi-user scenario, two users could drag the same card simultaneously and see conflicting state. Supabase Realtime would reconcile this, but the brief is single-user.

### `@dnd-kit` vs. `react-beautiful-dnd`

**Chosen**: `@dnd-kit/core`
**Why**: `react-beautiful-dnd` is unmaintained (last release 2022, React 18 issues). `@dnd-kit` is actively maintained, has first-class support for custom sensors and overlays, and works correctly with React 19.
**Tradeoff**: More verbose setup (manual `useDraggable`/`useDroppable` wiring vs. RBD's `<Draggable>`/`<Droppable>` components), but far more flexible.

### Append-Only Activity Log

**Chosen**: No UPDATE/DELETE policies on `task_activity`
**Why**: An audit log that can be edited defeats its purpose. Making it write-once at the database level (no policies = no access) enforces integrity regardless of application code.
**Tradeoff**: Activity rows accumulate indefinitely. A production system would add a retention policy or archival job.

### Supabase `@supabase/ssr` over `@supabase/supabase-js` directly

**Chosen**: `@supabase/ssr`'s `createBrowserClient`
**Why**: Handles cookie/localStorage token management, PKCE flows, and automatic token refresh correctly in Next.js App Router's hybrid server/client environment.

---

## 12. Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Next.js | 16.2.2 | App Router, SSR-ready, file-based routing |
| UI | React | 19.2.4 | Component model |
| Styling | Tailwind CSS | v4 | Utility-first dark theme |
| Backend / DB | Supabase (PostgreSQL) | 2.102.1 | Database, Auth, Realtime |
| Auth client | @supabase/ssr | 0.10.0 | Token management in App Router |
| Drag & Drop | @dnd-kit/core | 6.3.1 | Pointer-based DnD with custom overlay |
| Icons | lucide-react | 1.7.0 | Consistent icon set |
| Language | TypeScript | 5 | End-to-end type safety |

---

*Submission prepared for NextPlay Games coding assessment.*
