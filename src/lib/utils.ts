import type { TaskPriority } from "@/types/database";

/** Returns { label, classes } for a priority badge */
export function priorityMeta(priority: TaskPriority) {
  switch (priority) {
    case "High":
      return { label: "High",   dotColor: "bg-red-500",    textColor: "text-red-400"   };
    case "Normal":
      return { label: "Normal", dotColor: "bg-blue-500",   textColor: "text-blue-400"  };
    case "Low":
      return { label: "Low",    dotColor: "bg-slate-500",  textColor: "text-slate-400" };
  }
}

/** Returns due-date urgency tier: 'overdue' | 'soon' | 'ok' | null */
export function dueDateTier(due_date: string | null): "overdue" | "soon" | "ok" | null {
  if (!due_date) return null;
  const now  = new Date();
  const due  = new Date(due_date);
  const diff = due.getTime() - now.getTime();
  if (diff < 0)                       return "overdue";
  if (diff < 24 * 60 * 60 * 1000)    return "soon";
  return "ok";
}

/** Formats a date string as "Apr 7" */
export function fmtDate(due_date: string) {
  return new Date(due_date).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
  });
}

/** Returns a relative time string like "2h ago", "just now" */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/** Returns initials from a full name */
export function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
