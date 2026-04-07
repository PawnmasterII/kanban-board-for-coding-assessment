"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import type { AppLabel } from "@/types/app";

export interface Comment {
  id:         string;
  task_id:    string;
  text:       string;
  user_id:    string;
  created_at: string;
}

export interface ActivityEntry {
  id:         string;
  task_id:    string;
  action:     string;
  user_id:    string;
  created_at: string;
}

export function useTaskDetail(taskId: string | null) {
  const supabase        = createClient();
  const { user }        = useAuth();
  const [comments,  setComments]  = useState<Comment[]>([]);
  const [activity,  setActivity]  = useState<ActivityEntry[]>([]);
  const [allLabels, setAllLabels] = useState<AppLabel[]>([]);
  const [loading,   setLoading]   = useState(false);

  // ── Fetch everything for the open task ──────────────────────
  const load = useCallback(async () => {
    if (!taskId || !user) return;
    setLoading(true);

    const [commentsRes, activityRes, labelsRes] = await Promise.all([
      supabase
        .from("comments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true }),
      supabase
        .from("task_activity")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true }),
      supabase
        .from("labels")
        .select("id, name, color")
        .eq("user_id", user.id)
        .order("name"),
    ]);

    if (commentsRes.data) setComments(commentsRes.data as Comment[]);
    if (activityRes.data) setActivity(activityRes.data as ActivityEntry[]);
    if (labelsRes.data)   setAllLabels(labelsRes.data as AppLabel[]);

    setLoading(false);
  }, [taskId, user, supabase]);

  useEffect(() => { load(); }, [load]);

  // ── Realtime comments ───────────────────────────────────────
  useEffect(() => {
    if (!taskId || !user) return;
    const channel = supabase
      .channel(`comments-${taskId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `task_id=eq.${taskId}` },
        (payload) => {
          setComments((prev) => [...prev, payload.new as Comment]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [taskId, user, supabase]);

  // ── Add comment ─────────────────────────────────────────────
  async function addComment(text: string) {
    if (!taskId || !user || !text.trim()) return;
    await supabase.from("comments").insert({
      task_id: taskId,
      text:    text.trim(),
      user_id: user.id,
    });
    // Realtime will push it to the list
  }

  // ── Create label ─────────────────────────────────────────────
  async function createLabel(name: string, color: string): Promise<AppLabel | null> {
    if (!user) return null;
    const { data, error } = await supabase
      .from("labels")
      .insert({ name, color, user_id: user.id })
      .select("id, name, color")
      .single();
    if (error || !data) return null;
    const label = data as AppLabel;
    setAllLabels((prev) => [...prev, label].sort((a, b) => a.name.localeCompare(b.name)));
    return label;
  }

  // ── Toggle label on task ────────────────────────────────────
  async function addLabelToTask(taskId: string, labelId: string) {
    await supabase.from("task_labels").insert({ task_id: taskId, label_id: labelId });
  }

  async function removeLabelFromTask(taskId: string, labelId: string) {
    await supabase
      .from("task_labels")
      .delete()
      .eq("task_id", taskId)
      .eq("label_id", labelId);
  }

  // ── Log activity helper ─────────────────────────────────────
  async function logActivity(tid: string, action: string) {
    if (!user) return;
    const { data } = await supabase
      .from("task_activity")
      .insert({ task_id: tid, action, user_id: user.id })
      .select("*")
      .single();
    if (data) setActivity((prev) => [...prev, data as ActivityEntry]);
  }

  return {
    comments,
    activity,
    allLabels,
    loading,
    addComment,
    createLabel,
    addLabelToTask,
    removeLabelFromTask,
    logActivity,
    reload: load,
  };
}
