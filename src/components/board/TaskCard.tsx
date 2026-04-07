"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { AppTask } from "@/types/app";
import { priorityMeta, dueDateTier, fmtDate, initials } from "@/lib/utils";
import { AlertCircle, Clock, Flag, GripVertical } from "lucide-react";

interface TaskCardProps {
  task:      AppTask;
  onClick?:  () => void;
  /** When true renders a static ghost (used in DragOverlay) */
  overlay?:  boolean;
}

export function TaskCard({ task, onClick, overlay = false }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id:   task.id,
    data: { status: task.status },
  });

  const style = overlay
    ? undefined
    : { transform: CSS.Translate.toString(transform) };

  const priority = priorityMeta(task.priority);
  const dateTier = dueDateTier(task.due_date);

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      onClick={!isDragging ? onClick : undefined}
      className={`
        group relative rounded-xl bg-[#1a1f2e] border border-white/5
        p-4 space-y-2.5 cursor-pointer select-none
        hover:border-indigo-500/40 hover:bg-[#1e2438]
        transition-all duration-150 ease-out
        active:scale-[0.99]
        ${isDragging  ? "opacity-40" : ""}
        ${overlay     ? "shadow-2xl ring-1 ring-indigo-500/40 rotate-[1.5deg] scale-105" : ""}
      `}
    >
      {/* Drag handle */}
      {!overlay && (
        <div
          {...listeners}
          {...attributes}
          className="absolute right-2 top-3 p-1 rounded opacity-0 group-hover:opacity-40
                     hover:!opacity-80 text-slate-400 cursor-grab active:cursor-grabbing
                     transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={13} />
        </div>
      )}

      {/* Priority stripe */}
      <div
        className={`absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full opacity-70
          ${task.priority === "High"   ? "bg-red-500"   :
            task.priority === "Normal" ? "bg-blue-500"  :
                                         "bg-slate-600" }`}
      />

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pl-1">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide"
              style={{
                backgroundColor: label.color + "22",
                color:           label.color,
                border:         `1px solid ${label.color}44`,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-medium text-slate-100 leading-snug pl-1 line-clamp-2 pr-5">
        {task.title}
      </p>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-slate-500 leading-relaxed pl-1 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between pt-1 pl-1">
        <div className="flex items-center gap-2">
          {/* Priority badge */}
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${priority.textColor}`}>
            <Flag size={10} className="shrink-0" />
            {priority.label}
          </span>

          {/* Due date pill */}
          {task.due_date && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium
                ${dateTier === "overdue" ? "bg-red-500/15 text-red-400 border border-red-500/30"        :
                  dateTier === "soon"    ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30" :
                                          "bg-slate-700/50 text-slate-400"}`}
            >
              {dateTier === "overdue"
                ? <AlertCircle size={10} className="shrink-0" />
                : <Clock       size={10} className="shrink-0" />}
              {fmtDate(task.due_date)}
            </span>
          )}
        </div>

        {/* Assignee avatar */}
        {task.assignee && (
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center
                       text-[10px] font-bold text-white shrink-0 ring-2 ring-[#1a1f2e]"
            style={{ backgroundColor: task.assignee.color }}
            title={task.assignee.name}
          >
            {initials(task.assignee.name)}
          </div>
        )}
      </div>
    </div>
  );
}
