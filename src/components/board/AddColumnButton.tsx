"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

const PRESET_COLORS = [
  "#6b7280", "#6366f1", "#8b5cf6", "#ec4899",
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6",
];

interface AddColumnButtonProps {
  onAdd: (label: string, color: string) => void;
}

export function AddColumnButton({ onAdd }: AddColumnButtonProps) {
  const [open,  setOpen]  = useState(false);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    onAdd(label.trim(), color);
    setLabel("");
    setColor(PRESET_COLORS[0]);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="
          flex flex-col items-center justify-center gap-2
          min-w-[260px] w-[260px] h-24 self-start mt-8 shrink-0
          rounded-xl border border-dashed border-white/10
          text-slate-600 hover:text-slate-400 hover:border-slate-600
          transition-all duration-150 group
        "
      >
        <Plus size={18} className="group-hover:scale-110 transition-transform" />
        <span className="text-xs font-medium">Add column</span>
      </button>
    );
  }

  return (
    <div className="min-w-[280px] w-[280px] shrink-0 self-start mt-8">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl bg-[#1a1f2e] border border-white/10 p-4 space-y-3"
      >
        <p className="text-xs font-semibold text-slate-400">New column</p>
        <input
          autoFocus
          type="text"
          placeholder="Column name…"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full rounded-lg bg-white/[0.05] border border-white/[0.08]
                     px-3 py-2 text-sm text-slate-200 placeholder-slate-600
                     focus:outline-none focus:border-indigo-500/50 transition-colors"
        />
        {/* Color swatches */}
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-5 w-5 rounded-full transition-transform hover:scale-110
                          ${color === c ? "ring-2 ring-white/50 scale-110" : ""}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        {/* Preview dot */}
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs text-slate-400">{label || "Column name"}</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setOpen(false); setLabel(""); }}
            className="flex-1 py-1.5 rounded-lg text-xs text-slate-500
                       hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!label.trim()}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium
                       bg-indigo-600 hover:bg-indigo-500 text-white
                       disabled:opacity-40 transition-colors"
          >
            Add column
          </button>
        </div>
      </form>
    </div>
  );
}
