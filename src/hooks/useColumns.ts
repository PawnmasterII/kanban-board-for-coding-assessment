"use client";

import { useEffect, useState } from "react";
import type { Column } from "@/types/app";

const STORAGE_KEY = "kanban-columns";

export const DEFAULT_COLUMNS: Column[] = [
  { id: "To Do",       label: "To Do",       color: "#6b7280" },
  { id: "In Progress", label: "In Progress", color: "#3b82f6" },
  { id: "In Review",   label: "In Review",   color: "#eab308" },
  { id: "Done",        label: "Done",        color: "#22c55e" },
];

function persist(cols: Column[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cols));
}

export function useColumns() {
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS);

  // Load from localStorage after hydration
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setColumns(JSON.parse(raw));
    } catch {
      // ignore parse errors
    }
  }, []);

  function addColumn(label: string, color: string) {
    const trimmed = label.trim();
    if (!trimmed) return;
    const newCol: Column = { id: trimmed, label: trimmed, color };
    setColumns((prev) => {
      const updated = [...prev, newCol];
      persist(updated);
      return updated;
    });
  }

  function deleteColumn(id: string) {
    setColumns((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      persist(updated);
      return updated;
    });
  }

  function renameColumn(id: string, newLabel: string) {
    setColumns((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, label: newLabel } : c
      );
      persist(updated);
      return updated;
    });
  }

  return { columns, addColumn, deleteColumn, renameColumn };
}
