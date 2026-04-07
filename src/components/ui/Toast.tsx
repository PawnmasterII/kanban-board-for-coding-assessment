"use client";

import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import type { ToastItem } from "@/providers/ToastProvider";

interface ToastProps {
  toast:     ToastItem;
  onDismiss: (id: string) => void;
}

const META = {
  success: {
    icon:    <CheckCircle2 size={15} />,
    classes: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
  },
  error: {
    icon:    <AlertCircle size={15} />,
    classes: "bg-red-500/10 border-red-500/30 text-red-300",
  },
  info: {
    icon:    <Info size={15} />,
    classes: "bg-indigo-500/10 border-indigo-500/30 text-indigo-300",
  },
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const meta = META[toast.type];
  return (
    <div
      className={`
        flex items-start gap-2.5 rounded-xl px-4 py-3
        border backdrop-blur-md shadow-xl
        text-sm font-medium min-w-[260px] max-w-xs
        animate-in slide-in-from-right-4 fade-in duration-200
        ${meta.classes}
      `}
    >
      <span className="mt-0.5 shrink-0">{meta.icon}</span>
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5"
      >
        <X size={13} />
      </button>
    </div>
  );
}
