"use client";

import { Search, CheckCircle2, AlertCircle, LayoutDashboard } from "lucide-react";
import type { AppTask } from "@/types/app";
import { dueDateTier } from "@/lib/utils";

interface HeaderProps {
  tasks:       AppTask[];
  searchQuery: string;
  onSearch:    (q: string) => void;
}

export function Header({ tasks, searchQuery, onSearch }: HeaderProps) {
  const total     = tasks.length;
  const completed = tasks.filter((t) => t.status === "Done").length;
  const overdue   = tasks.filter((t) => dueDateTier(t.due_date) === "overdue").length;

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 px-6 h-14
                        bg-[#0f1117]/80 backdrop-blur-md border-b border-white/[0.06]">
      {/* Brand */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="h-7 w-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30
                        flex items-center justify-center">
          <LayoutDashboard size={14} className="text-indigo-400" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-slate-100">Kanban</span>
      </div>

      <div className="h-5 w-px bg-white/10 shrink-0" />

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search tasks…"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          className="
            w-full h-8 pl-8 pr-3 rounded-lg text-sm
            bg-white/[0.05] border border-white/[0.08]
            text-slate-200 placeholder-slate-600
            focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07]
            transition-all
          "
        />
      </div>

      <div className="flex-1" />

      {/* Stats chips */}
      <div className="flex items-center gap-2 shrink-0">
        <Chip
          icon={<LayoutDashboard size={11} />}
          label={`${total} total`}
          className="bg-slate-700/50 text-slate-400 border-slate-600/40"
        />
        <Chip
          icon={<CheckCircle2 size={11} />}
          label={`${completed} done`}
          className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        />
        {overdue > 0 && (
          <Chip
            icon={<AlertCircle size={11} />}
            label={`${overdue} overdue`}
            className="bg-red-500/10 text-red-400 border-red-500/20"
          />
        )}
      </div>
    </header>
  );
}

function Chip({ icon, label, className }: { icon: React.ReactNode; label: string; className: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border ${className}`}>
      {icon}
      {label}
    </span>
  );
}
