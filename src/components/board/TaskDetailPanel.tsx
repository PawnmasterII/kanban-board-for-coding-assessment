"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  X, Trash2, Flag, Calendar, User, Tag,
  Send, MessageSquare, Activity, ChevronDown, Check,
} from "lucide-react";
import type { AppTask, AppMember, TaskStatus, TaskPriority } from "@/types/app";
import { useTaskDetail } from "@/hooks/useTaskDetail";
import { LabelPicker }    from "./LabelPicker";
import { AssigneePicker } from "./AssigneePicker";
import { dueDateTier, fmtDate, timeAgo, priorityMeta } from "@/lib/utils";

const STATUSES:   TaskStatus[]   = ["To Do", "In Progress", "In Review", "Done"];
const PRIORITIES: TaskPriority[] = ["Low", "Normal", "High"];

const STATUS_STYLE: Record<string, string> = {
  "To Do":       "bg-slate-700/60 text-slate-300 border-slate-600/40",
  "In Progress": "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "In Review":   "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  "Done":        "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

interface TaskDetailPanelProps {
  task:         AppTask;
  members:      AppMember[];
  onClose:      () => void;
  onUpdate:     (id: string, patch: Partial<AppTask> & { assignee_id?: string | null }) => Promise<void>;
  onDelete:     (id: string) => Promise<void>;
  onRefetch:    () => Promise<void>;
  onMemberCreated: (member: AppMember) => void;
}

export function TaskDetailPanel({
  task, members, onClose, onUpdate, onDelete, onRefetch, onMemberCreated,
}: TaskDetailPanelProps) {
  const {
    comments, activity, allLabels,
    addComment, createLabel, addLabelToTask, removeLabelFromTask, logActivity,
  } = useTaskDetail(task.id);

  const [title,          setTitle]          = useState(task.title);
  const [description,    setDescription]    = useState(task.description ?? "");
  const [saveState,      setSaveState]      = useState<"idle" | "saving" | "saved">("idle");
  const [commentText,    setCommentText]    = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [showStatusMenu,   setShowStatusMenu]   = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const saveTimer          = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commentEndRef      = useRef<HTMLDivElement>(null);
  const prevCommentCount   = useRef(0);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? "");
  }, [task.id, task.title, task.description]);

  useEffect(() => {
    // Only scroll when a NEW comment is added — not on initial panel open
    if (comments.length > prevCommentCount.current) {
      commentEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    prevCommentCount.current = comments.length;
  }, [comments]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Debounced auto-save ──────────────────────────────────────
  const scheduleSave = useCallback(
    (field: "title" | "description", value: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveState("saving");
      saveTimer.current = setTimeout(async () => {
        await onUpdate(task.id, { [field]: value || null });
        await logActivity(task.id, `Updated ${field}`);
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
        await onRefetch();
      }, 800);
    },
    [task.id, onUpdate, onRefetch, logActivity]
  );

  // ── Property change handlers ─────────────────────────────────
  async function changeStatus(s: TaskStatus) {
    setShowStatusMenu(false);
    if (s === task.status) return;
    await onUpdate(task.id, { status: s });
    await logActivity(task.id, `Moved to ${s}`);
    await onRefetch();
  }

  async function changePriority(p: TaskPriority) {
    setShowPriorityMenu(false);
    if (p === task.priority) return;
    await onUpdate(task.id, { priority: p });
    await logActivity(task.id, `Priority set to ${p}`);
    await onRefetch();
  }

  async function changeDueDate(val: string) {
    await onUpdate(task.id, { due_date: val || null });
    await logActivity(task.id, val ? `Due date set to ${val}` : "Due date removed");
    await onRefetch();
  }

  async function changeAssignee(member: AppMember | null) {
    await onUpdate(task.id, { assignee_id: member?.id ?? null });
    await logActivity(task.id, member ? `Assigned to ${member.name}` : "Assignee removed");
    await onRefetch();
  }

  async function handleAddLabel(labelId: string) {
    await addLabelToTask(task.id, labelId);
    await logActivity(task.id, "Label added");
    await onRefetch();
  }

  async function handleRemoveLabel(labelId: string) {
    await removeLabelFromTask(task.id, labelId);
    await logActivity(task.id, "Label removed");
    await onRefetch();
  }

  async function handleSendComment() {
    if (!commentText.trim() || sendingComment) return;
    setSendingComment(true);
    await addComment(commentText);
    setCommentText("");
    setSendingComment(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    await onDelete(task.id);
    onClose();
  }

  const dateTier = dueDateTier(task.due_date);
  const priority = priorityMeta(task.priority);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-[660px]
                      bg-[#131720] border-l border-white/[0.07] flex flex-col shadow-2xl
                      animate-in slide-in-from-right duration-250">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            {/* Status dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowStatusMenu(!showStatusMenu); setShowPriorityMenu(false); }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1
                            text-xs font-medium border transition-colors cursor-pointer
                            hover:opacity-80 ${STATUS_STYLE[task.status]}`}
              >
                {task.status}
                <ChevronDown size={11} />
              </button>
              {showStatusMenu && (
                <div className="absolute left-0 top-full mt-1.5 z-[70] w-40 rounded-xl
                                bg-[#1e2438] border border-white/10 shadow-xl p-1">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => changeStatus(s)}
                      className="w-full flex items-center justify-between px-3 py-2
                                 text-xs text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      {s}
                      {s === task.status && <Check size={11} className="text-indigo-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {saveState !== "idle" && (
              <span className={`text-xs ${saveState === "saved" ? "text-emerald-400" : "text-slate-500"}`}>
                {saveState === "saving" ? "Saving…" : "Saved ✓"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              className="h-8 w-8 rounded-lg flex items-center justify-center
                         text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center
                         text-slate-500 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          <div className="px-6 py-5 space-y-6">

            {/* Title */}
            <textarea
              value={title}
              onChange={(e) => { setTitle(e.target.value); scheduleSave("title", e.target.value); }}
              rows={2}
              placeholder="Task title…"
              className="w-full bg-transparent text-xl font-semibold text-slate-100
                         placeholder-slate-600 focus:outline-none resize-none leading-snug"
            />

            {/* Properties — NO overflow-hidden so dropdowns can escape */}
            <div className="rounded-xl border border-white/[0.06] divide-y divide-white/[0.04]">

              {/* Priority */}
              <div className="relative flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02]
                              rounded-t-xl transition-colors">
                <Flag size={13} className="text-slate-500 shrink-0" />
                <span className="text-xs text-slate-500 w-24 shrink-0">Priority</span>
                <button
                  onClick={() => { setShowPriorityMenu(!showPriorityMenu); setShowStatusMenu(false); }}
                  className={`inline-flex items-center gap-1.5 text-sm font-medium
                              hover:opacity-70 transition-opacity ${priority.textColor}`}
                >
                  {task.priority} <ChevronDown size={11} />
                </button>
                {showPriorityMenu && (
                  <div className="absolute left-36 top-full mt-0.5 z-[70] w-32 rounded-xl
                                  bg-[#1e2438] border border-white/10 shadow-xl p-1">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p}
                        onClick={() => changePriority(p)}
                        className="w-full flex items-center justify-between px-3 py-2
                                   text-xs text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        {p}
                        {p === task.priority && <Check size={11} className="text-indigo-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Due date */}
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <Calendar size={13} className="text-slate-500 shrink-0" />
                <span className="text-xs text-slate-500 w-24 shrink-0">Due date</span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={task.due_date ?? ""}
                    onChange={(e) => changeDueDate(e.target.value)}
                    className="bg-transparent text-sm text-slate-300 focus:outline-none [color-scheme:dark] cursor-pointer"
                  />
                  {task.due_date && (
                    <span className={`text-[11px] font-medium rounded-full px-2 py-0.5
                      ${dateTier === "overdue" ? "bg-red-500/15 text-red-400"         :
                        dateTier === "soon"    ? "bg-yellow-500/15 text-yellow-400"   :
                                                  "text-slate-500"}`}>
                      {dateTier === "overdue" ? "Overdue" :
                       dateTier === "soon"    ? "Due soon" :
                       fmtDate(task.due_date)}
                    </span>
                  )}
                </div>
              </div>

              {/* Assignee */}
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <User size={13} className="text-slate-500 shrink-0" />
                <span className="text-xs text-slate-500 w-24 shrink-0">Assignee</span>
                <AssigneePicker
                  members={members}
                  value={task.assignee}
                  onChange={changeAssignee}
                  onCreated={onMemberCreated}
                />
              </div>

              {/* Labels */}
              <div className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02]
                              rounded-b-xl transition-colors">
                <Tag size={13} className="text-slate-500 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-500 w-24 shrink-0 mt-0.5">Labels</span>
                <LabelPicker
                  allLabels={allLabels}
                  taskLabels={task.labels}
                  onAdd={handleAddLabel}
                  onRemove={handleRemoveLabel}
                  onCreateNew={createLabel}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Description
              </p>
              <textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); scheduleSave("description", e.target.value); }}
                rows={4}
                placeholder="Add a description…"
                className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06]
                           px-4 py-3 text-sm text-slate-300 placeholder-slate-600
                           focus:outline-none focus:border-indigo-500/40 resize-none
                           transition-colors leading-relaxed"
              />
            </div>

            {/* Comments */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3
                            flex items-center gap-2">
                <MessageSquare size={11} />
                Comments
                {comments.length > 0 && (
                  <span className="text-[10px] bg-slate-700/60 text-slate-400 rounded-full px-1.5 py-0.5">
                    {comments.length}
                  </span>
                )}
              </p>
              <div className="space-y-3 mb-4">
                {comments.length === 0 && (
                  <p className="text-xs text-slate-600 text-center py-4">No comments yet</p>
                )}
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="h-7 w-7 rounded-full bg-indigo-500/30 border border-indigo-500/20
                                    flex items-center justify-center shrink-0 text-[10px] font-bold text-indigo-300">
                      ME
                    </div>
                    <div className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.06] px-3.5 py-2.5">
                      <p className="text-sm text-slate-300 leading-relaxed">{c.text}</p>
                      <p className="text-[10px] text-slate-600 mt-1.5">{timeAgo(c.created_at)}</p>
                    </div>
                  </div>
                ))}
                <div ref={commentEndRef} />
              </div>
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-indigo-500/30 border border-indigo-500/20
                                flex items-center justify-center shrink-0 text-[10px] font-bold text-indigo-300 mt-1">
                  ME
                </div>
                <div className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.06]
                                focus-within:border-indigo-500/40 transition-colors overflow-hidden">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSendComment(); }}
                    rows={2}
                    placeholder="Write a comment… (⌘+Enter to send)"
                    className="w-full bg-transparent px-3.5 pt-2.5 text-sm text-slate-300
                               placeholder-slate-600 focus:outline-none resize-none leading-relaxed"
                  />
                  <div className="flex justify-end px-3 pb-2">
                    <button
                      onClick={handleSendComment}
                      disabled={!commentText.trim() || sendingComment}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                 bg-indigo-600 hover:bg-indigo-500 text-white
                                 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send size={11} /> Send
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="pb-8">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3
                            flex items-center gap-2">
                <Activity size={11} /> Activity
              </p>
              {activity.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-4">No activity yet</p>
              )}
              <div className="relative space-y-0">
                {activity.length > 1 && (
                  <div className="absolute left-[11px] top-3 bottom-3 w-px bg-white/[0.06]" />
                )}
                {[...activity].reverse().map((entry) => (
                  <div key={entry.id} className="flex gap-3 py-2">
                    <div className="h-5 w-5 rounded-full bg-slate-700/80 border border-white/10
                                    flex items-center justify-center shrink-0 z-10 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400 leading-relaxed">{entry.action}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">{timeAgo(entry.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
