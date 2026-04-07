"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Check, Tag } from "lucide-react";
import type { AppLabel } from "@/types/app";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#06b6d4",
];

interface LabelPickerProps {
  allLabels:    AppLabel[];
  taskLabels:   AppLabel[];
  onAdd:        (labelId: string) => void;
  onRemove:     (labelId: string) => void;
  onCreateNew:  (name: string, color: string) => Promise<AppLabel | null>;
}

export function LabelPicker({ allLabels, taskLabels, onAdd, onRemove, onCreateNew }: LabelPickerProps) {
  const [open,       setOpen]       = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [newName,    setNewName]    = useState("");
  const [newColor,   setNewColor]   = useState(PRESET_COLORS[0]);
  const [saving,     setSaving]     = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function isAttached(labelId: string) {
    return taskLabels.some((l) => l.id === labelId);
  }

  function toggle(label: AppLabel) {
    if (isAttached(label.id)) onRemove(label.id);
    else                       onAdd(label.id);
  }

  async function handleCreate() {
    if (!newName.trim() || saving) return;
    setSaving(true);
    const label = await onCreateNew(newName.trim(), newColor);
    if (label) {
      onAdd(label.id);
      setNewName("");
      setNewColor(PRESET_COLORS[0]);
      setCreating(false);
    }
    setSaving(false);
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger: existing labels + add button */}
      <div className="flex flex-wrap items-center gap-1.5 cursor-pointer" onClick={() => setOpen(!open)}>
        {taskLabels.length === 0 && (
          <span className="text-sm text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1">
            <Tag size={12} /> Add label
          </span>
        )}
        {taskLabels.map((label) => (
          <span
            key={label.id}
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{
              backgroundColor: label.color + "22",
              color:           label.color,
              border:         `1px solid ${label.color}44`,
            }}
          >
            {label.name}
          </span>
        ))}
        {taskLabels.length > 0 && (
          <span className="text-slate-600 hover:text-slate-400 transition-colors">
            <Plus size={12} />
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 w-56 rounded-xl
                        bg-[#1e2438] border border-white/10 shadow-2xl overflow-hidden">
          {/* Existing labels list */}
          <div className="max-h-44 overflow-y-auto p-1.5 space-y-0.5">
            {allLabels.length === 0 && !creating && (
              <p className="text-xs text-slate-500 text-center py-3">No labels yet</p>
            )}
            {allLabels.map((label) => (
              <button
                key={label.id}
                onClick={() => toggle(label)}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg
                           hover:bg-white/5 transition-colors text-left"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: label.color }}
                />
                <span className="flex-1 text-xs text-slate-300">{label.name}</span>
                {isAttached(label.id) && (
                  <Check size={11} className="text-indigo-400 shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Create new label */}
          <div className="border-t border-white/[0.06] p-2">
            {!creating ? (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg
                           text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5
                           transition-colors"
              >
                <Plus size={12} /> Create label
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Label name…"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                  className="w-full rounded-lg bg-white/[0.05] border border-white/10
                             px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600
                             focus:outline-none focus:border-indigo-500/50"
                />
                {/* Color swatches */}
                <div className="flex flex-wrap gap-1.5 px-0.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={`h-5 w-5 rounded-full transition-transform hover:scale-110
                                  ${newColor === c ? "ring-2 ring-white/50 scale-110" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => { setCreating(false); setNewName(""); }}
                    className="flex-1 py-1 rounded-lg text-xs text-slate-500
                               hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim() || saving}
                    className="flex-1 py-1 rounded-lg text-xs font-medium
                               bg-indigo-600 hover:bg-indigo-500 text-white
                               disabled:opacity-50 transition-colors"
                  >
                    {saving ? "…" : "Create"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
