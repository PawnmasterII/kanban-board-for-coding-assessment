"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { TaskPriority, CreateTaskInput, AppMember, AppLabel } from "@/types/app";
import { AssigneePicker } from "./AssigneePicker";
import { LabelPicker }    from "./LabelPicker";

interface CreateTaskModalProps {
  defaultStatus:  string;
  fetchMembers:   () => Promise<AppMember[]>;
  fetchLabels:    () => Promise<AppLabel[]>;
  createLabel:    (name: string, color: string) => Promise<AppLabel | null>;
  onConfirm:      (input: CreateTaskInput) => Promise<void>;
  onClose:        () => void;
}

const PRIORITIES: TaskPriority[] = ["Low", "Normal", "High"];

export function CreateTaskModal({
  defaultStatus, fetchMembers, fetchLabels, createLabel, onConfirm, onClose,
}: CreateTaskModalProps) {
  const [title,        setTitle]        = useState("");
  const [description,  setDescription]  = useState("");
  const [priority,     setPriority]     = useState<TaskPriority>("Normal");
  const [dueDate,      setDueDate]      = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced-only state
  const [assignee,  setAssignee]  = useState<AppMember | null>(null);
  const [members,   setMembers]   = useState<AppMember[]>([]);
  const [labels,    setLabels]    = useState<AppLabel[]>([]);      // all user labels
  const [selLabels, setSelLabels] = useState<AppLabel[]>([]);      // selected for this task

  const titleRef = useRef<HTMLInputElement>(null);

  // ── Capture stable refs so effects only run on mount ─────────
  const fetchMembersRef = useRef(fetchMembers);
  const fetchLabelsRef  = useRef(fetchLabels);

  // Mount: focus title + pre-fetch data once (stable refs, no re-run on re-render)
  useEffect(() => {
    titleRef.current?.focus();
    fetchMembersRef.current().then(setMembers);
    fetchLabelsRef.current().then(setLabels);
  }, []); // intentionally empty — refs are stable

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    await onConfirm({
      title:       title.trim(),
      description: description.trim() || null,
      priority,
      due_date:    dueDate || null,
      status:      defaultStatus,
      assignee_id: assignee?.id ?? null,
      label_ids:   selLabels.map((l) => l.id),
    });
    setSubmitting(false);
  }

  // Label toggle helpers (no task ID needed — we pass selected list directly)
  function handleAddLabel(labelId: string) {
    const label = labels.find((l) => l.id === labelId);
    if (label) setSelLabels((prev) => [...prev, label]);
  }
  function handleRemoveLabel(labelId: string) {
    setSelLabels((prev) => prev.filter((l) => l.id !== labelId));
  }
  async function handleCreateLabel(name: string, color: string) {
    const label = await createLabel(name, color);
    if (label) {
      setLabels((prev) => [...prev, label].sort((a, b) => a.name.localeCompare(b.name)));
      setSelLabels((prev) => [...prev, label]);
    }
    return label;
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md mx-4 rounded-2xl bg-[#161b27] border border-white/10 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-slate-100">New task</h2>
          <button
            onClick={onClose}
            className="h-6 w-6 rounded-md flex items-center justify-center
                       text-slate-500 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Title — ref-focused once on mount, never re-stolen */}
          <input
            ref={titleRef}
            type="text"
            placeholder="Task title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full bg-transparent text-base font-medium text-slate-100
                       placeholder-slate-600 focus:outline-none
                       border-b border-white/10 pb-2"
          />

          {/* Description */}
          <textarea
            placeholder="Add a description…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08]
                       px-3 py-2.5 text-sm text-slate-300 placeholder-slate-600
                       focus:outline-none focus:border-indigo-500/50 resize-none transition-colors"
          />

          {/* Priority + Due date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08]
                           px-3 py-2 text-sm text-slate-300
                           focus:outline-none focus:border-indigo-500/50 transition-colors"
              >
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08]
                           px-3 py-2 text-sm text-slate-300
                           focus:outline-none focus:border-indigo-500/50 transition-colors
                           [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Advanced options toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-500
                       hover:text-slate-300 transition-colors"
          >
            {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showAdvanced ? "Hide advanced" : "Advanced options"}
          </button>

          {/* Advanced section */}
          {showAdvanced && (
            <div className="rounded-xl border border-white/[0.07] divide-y divide-white/[0.05]">

              {/* Assignee */}
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-xs text-slate-500 w-20 shrink-0">Assignee</span>
                <AssigneePicker
                  members={members}
                  value={assignee}
                  onChange={setAssignee}
                  onCreated={(m) => setMembers((prev) => [...prev, m])}
                />
              </div>

              {/* Labels */}
              <div className="flex items-start gap-3 px-4 py-3">
                <span className="text-xs text-slate-500 w-20 shrink-0 mt-0.5">Labels</span>
                <LabelPicker
                  allLabels={labels}
                  taskLabels={selLabels}
                  onAdd={handleAddLabel}
                  onRemove={handleRemoveLabel}
                  onCreateNew={handleCreateLabel}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-slate-600">
              Adding to{" "}
              <span className="text-slate-400 font-medium">{defaultStatus}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-slate-400
                           hover:bg-slate-700/50 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || submitting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                           bg-indigo-600 hover:bg-indigo-500 text-white
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting && <Loader2 size={13} className="animate-spin" />}
                Create task
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
