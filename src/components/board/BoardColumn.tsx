"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus, LayoutList, Trash2 } from "lucide-react";
import type { AppTask } from "@/types/app";
import { TaskCard }     from "./TaskCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";

interface BoardColumnProps {
  status:        string;
  label:         string;
  color:         string;         // hex — drives dot + drop-ring
  tasks:         AppTask[];
  loading?:      boolean;
  onAddTask?:    (status: string) => void;
  onTaskClick?:  (task: AppTask) => void;
  onDelete?:     (status: string) => void;
}

export function BoardColumn({
  status, label, color, tasks, loading = false,
  onAddTask, onTaskClick, onDelete,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="group/col flex flex-col min-w-[300px] w-full max-w-[320px] flex-shrink-0">

      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <h2
            className="text-sm font-semibold tracking-wide"
            style={{ color }}
          >
            {label}
          </h2>
          <span className="flex items-center justify-center h-5 min-w-5 rounded-full bg-slate-700/60 text-[11px] font-medium text-slate-400 px-1.5">
            {loading ? "–" : tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Delete column — visible on column hover */}
          {onDelete && (
            <button
              onClick={() => {
                if (tasks.length > 0) {
                  if (!confirm(`"${label}" has ${tasks.length} task${tasks.length > 1 ? "s" : ""}. Delete column anyway? Tasks will still exist but won't appear on the board.`)) return;
                }
                onDelete(status);
              }}
              className="h-6 w-6 rounded-md flex items-center justify-center
                         text-slate-600 hover:text-red-400 hover:bg-red-500/10
                         opacity-0 group-hover/col:opacity-100 transition-all"
              title="Delete column"
            >
              <Trash2 size={12} />
            </button>
          )}
          <button
            onClick={() => onAddTask?.(status)}
            className="h-6 w-6 rounded-md flex items-center justify-center text-slate-500
                       hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Droppable zone */}
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2.5 min-h-[120px] rounded-xl p-1.5 transition-all duration-150"
        style={isOver ? {
          backgroundColor: color + "08",
          boxShadow:       `0 0 0 1px ${color}40`,
        } : {}}
      >
        {loading && <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>}

        {!loading && tasks.length === 0 && (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-xl
                       border border-dashed py-10 px-4 text-center cursor-pointer group
                       transition-all duration-200 border-white/8 bg-white/[0.02]
                       hover:bg-white/[0.04]"
            style={isOver ? { borderColor: color + "60", backgroundColor: color + "08" } : {}}
            onClick={() => onAddTask?.(status)}
          >
            <div className="h-9 w-9 rounded-xl bg-slate-700/50 flex items-center justify-center
                            group-hover:bg-slate-600/50 transition-colors">
              <LayoutList size={16} className="text-slate-500 group-hover:text-slate-400 transition-colors" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 group-hover:text-slate-400 transition-colors">
                No tasks yet
              </p>
              <p className="text-xs text-slate-600 mt-0.5">Click to add one</p>
            </div>
          </div>
        )}

        {!loading && tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
        ))}
      </div>

      {!loading && tasks.length > 0 && (
        <button
          onClick={() => onAddTask?.(status)}
          className="mt-2 flex items-center gap-2 w-full rounded-lg px-3 py-2
                     text-xs text-slate-500 hover:text-slate-300
                     hover:bg-slate-700/40 transition-colors text-left"
        >
          <Plus size={13} /> Add task
        </button>
      )}
    </div>
  );
}
