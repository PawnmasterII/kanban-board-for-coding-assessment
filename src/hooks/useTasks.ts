"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import type { AppTask, AppMember, AppLabel, TaskStatus, CreateTaskInput } from "@/types/app";

// Shape Supabase returns from the joined query
interface RawTask {
  id:          string;
  title:       string;
  description: string | null;
  status:      string;
  priority:    string;
  due_date:    string | null;
  user_id:     string;
  assignee_id: string | null;
  created_at:  string;
  // joined
  assignee:    { id: string; name: string; color: string; avatar_url: string | null } | null;
  task_labels: { labels: { id: string; name: string; color: string } | null }[];
}

function toAppTask(raw: RawTask): AppTask {
  return {
    id:          raw.id,
    title:       raw.title,
    description: raw.description,
    status:      raw.status      as AppTask["status"],
    priority:    raw.priority    as AppTask["priority"],
    due_date:    raw.due_date,
    user_id:     raw.user_id,
    created_at:  raw.created_at,
    assignee:    raw.assignee ?? null,
    labels:      (raw.task_labels ?? [])
                   .map((tl) => tl.labels)
                   .filter((l): l is NonNullable<typeof l> => l !== null),
  };
}

const TASKS_QUERY = `
  id, title, description, status, priority, due_date, user_id, assignee_id, created_at,
  assignee:team_members!assignee_id(id, name, color, avatar_url),
  task_labels(labels(id, name, color))
` as const;

export function useTasks() {
  const supabase         = createClient();
  const { user, loading: authLoading } = useAuth();
  const [tasks,   setTasks]   = useState<AppTask[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select(TASKS_QUERY)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setTasks((data as unknown as RawTask[]).map(toAppTask));
    }
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    if (!authLoading) fetchTasks();
  }, [authLoading, fetchTasks]);

  // ── Realtime ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${user.id}` },
        () => { fetchTasks(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, supabase, fetchTasks]);

  // ── Create ──────────────────────────────────────────────────
  async function createTask(input: CreateTaskInput): Promise<AppTask> {
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title:       input.title,
        description: input.description,
        status:      input.status,
        priority:    input.priority,
        due_date:    input.due_date,
        assignee_id: input.assignee_id,
        user_id:     user.id,
      })
      .select(TASKS_QUERY)
      .single();

    if (error) throw error;
    let task = toAppTask(data as unknown as RawTask);

    // Insert labels if provided
    if (input.label_ids && input.label_ids.length > 0) {
      await supabase.from("task_labels").insert(
        input.label_ids.map((lid) => ({ task_id: task.id, label_id: lid }))
      );
      // Re-fetch so the returned task includes the labels
      const { data: refreshed } = await supabase
        .from("tasks")
        .select(TASKS_QUERY)
        .eq("id", task.id)
        .single();
      if (refreshed) task = toAppTask(refreshed as unknown as RawTask);
    }

    // Log activity
    await supabase.from("task_activity").insert({
      task_id: task.id,
      action:  "Task created",
      user_id: user.id,
    });

    return task;
  }

  // ── Update status (called AFTER optimistic update) ──────────
  async function updateTaskStatus(id: string, newStatus: string, oldStatus: string) {
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    await supabase.from("task_activity").insert({
      task_id: id,
      action:  `Moved from ${oldStatus} to ${newStatus}`,
      user_id: user.id,
    });
  }

  // ── Update task fields ──────────────────────────────────────
  async function updateTask(
    id: string,
    patch: Partial<Pick<AppTask, "title" | "description" | "priority" | "due_date" | "status">> & { assignee_id?: string | null }
  ) {
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("tasks")
      .update(patch)
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    await fetchTasks();
  }

  // ── Delete ──────────────────────────────────────────────────
  async function deleteTask(id: string) {
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
  }

  // ── Team members ────────────────────────────────────────────
  const fetchMembers = useCallback(async (): Promise<AppMember[]> => {
    if (!user) return [];
    const { data } = await supabase
      .from("team_members")
      .select("id, name, color, avatar_url")
      .order("name");
    return (data as AppMember[]) ?? [];
  }, [user, supabase]);

  // ── Labels ───────────────────────────────────────────────────
  const fetchLabels = useCallback(async (): Promise<AppLabel[]> => {
    if (!user) return [];
    const { data } = await supabase
      .from("labels")
      .select("id, name, color")
      .eq("user_id", user.id)
      .order("name");
    return (data as AppLabel[]) ?? [];
  }, [user, supabase]);

  async function createLabel(name: string, color: string): Promise<AppLabel | null> {
    if (!user) return null;
    const { data, error } = await supabase
      .from("labels")
      .insert({ name, color, user_id: user.id })
      .select("id, name, color")
      .single();
    if (error || !data) return null;
    return data as AppLabel;
  }

  return {
    tasks,
    setTasks,
    loading,
    createTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
    fetchMembers,
    fetchLabels,
    createLabel,
    refetch: fetchTasks,
  };
}
