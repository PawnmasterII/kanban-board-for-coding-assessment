"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Check, UserCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import type { AppMember } from "@/types/app";
import { initials } from "@/lib/utils";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#06b6d4",
];

interface AssigneePickerProps {
  members:   AppMember[];
  value:     AppMember | null;
  onChange:  (member: AppMember | null) => void;
  onCreated: (member: AppMember) => void;   // notify parent to refresh global list
}

export function AssigneePicker({ members, value, onChange, onCreated }: AssigneePickerProps) {
  const supabase        = createClient();
  const { user }        = useAuth();
  const [open,     setOpen]     = useState(false);
  const [creating, setCreating] = useState(false);
  const [name,     setName]     = useState("");
  const [color,    setColor]    = useState(PRESET_COLORS[0]);
  const [saving,   setSaving]   = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  async function handleCreate() {
    if (!name.trim() || saving || !user) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("team_members")
      .insert({ name: name.trim(), color, user_id: user.id })
      .select("id, name, color, avatar_url")
      .single();

    if (!error && data) {
      const member = data as AppMember;
      onCreated(member);
      onChange(member);
      setName("");
      setColor(PRESET_COLORS[0]);
      setCreating(false);
      setOpen(false);
    }
    setSaving(false);
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:opacity-75 transition-opacity"
      >
        {value ? (
          <>
            <div
              className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
              style={{ backgroundColor: value.color }}
            >
              {initials(value.name)}
            </div>
            <span className="text-sm text-slate-300">{value.name}</span>
          </>
        ) : (
          <span className="text-sm text-slate-500 flex items-center gap-1.5">
            <UserCircle2 size={14} /> Unassigned
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-2 z-[60] w-52 rounded-xl
                        bg-[#1e2438] border border-white/10 shadow-2xl overflow-hidden">
          <div className="max-h-44 overflow-y-auto p-1.5 space-y-0.5">
            {/* Unassigned option */}
            <button
              onClick={() => { onChange(null); setOpen(false); }}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg
                         hover:bg-white/5 transition-colors text-left"
            >
              <span className="text-xs text-slate-400 flex items-center gap-2">
                <UserCircle2 size={13} className="text-slate-600" />
                Unassigned
              </span>
              {!value && <Check size={11} className="text-indigo-400 shrink-0" />}
            </button>

            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => { onChange(m); setOpen(false); }}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg
                           hover:bg-white/5 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <div
                    className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ backgroundColor: m.color }}
                  >
                    {initials(m.name)}
                  </div>
                  <span className="text-xs text-slate-300">{m.name}</span>
                </span>
                {value?.id === m.id && <Check size={11} className="text-indigo-400 shrink-0" />}
              </button>
            ))}
          </div>

          {/* Create member */}
          <div className="border-t border-white/[0.06] p-2">
            {!creating ? (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg
                           text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
              >
                <Plus size={12} /> Add member
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Member name…"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                  className="w-full rounded-lg bg-white/[0.05] border border-white/10
                             px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600
                             focus:outline-none focus:border-indigo-500/50"
                />
                <div className="flex flex-wrap gap-1.5 px-0.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`h-5 w-5 rounded-full transition-transform hover:scale-110
                                  ${color === c ? "ring-2 ring-white/50 scale-110" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => { setCreating(false); setName(""); }}
                    className="flex-1 py-1 rounded-lg text-xs text-slate-500 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!name.trim() || saving}
                    className="flex-1 py-1 rounded-lg text-xs font-medium
                               bg-indigo-600 hover:bg-indigo-500 text-white
                               disabled:opacity-50 transition-colors"
                  >
                    {saving ? "…" : "Add"}
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
