"use client";

import { useState, useMemo, useEffect } from "react";
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import { Header }            from "@/components/header/Header";
import { BoardColumn }       from "./BoardColumn";
import { TaskCard }          from "./TaskCard";
import { CreateTaskModal }   from "./CreateTaskModal";
import { TaskDetailPanel }   from "./TaskDetailPanel";
import { AddColumnButton }   from "./AddColumnButton";
import { useTasks }          from "@/hooks/useTasks";
import { useColumns }        from "@/hooks/useColumns";
import { useToast }          from "@/providers/ToastProvider";
import type { AppTask, AppMember, CreateTaskInput } from "@/types/app";

export function BoardLayout() {
  const { tasks, setTasks, loading, createTask, updateTaskStatus, updateTask, deleteTask, fetchMembers, fetchLabels, createLabel, refetch } = useTasks();
  const { columns, addColumn, deleteColumn } = useColumns();
  const { showToast } = useToast();

  const [searchQuery,    setSearchQuery]    = useState("");
  const [activeTask,     setActiveTask]     = useState<AppTask | null>(null);
  const [modalStatus,    setModalStatus]    = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [members,        setMembers]        = useState<AppMember[]>([]);

  useEffect(() => { fetchMembers().then(setMembers); }, [fetchMembers]);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter(
      (t) => t.title.toLowerCase().includes(q) ||
             t.description?.toLowerCase().includes(q)
    );
  }, [tasks, searchQuery]);

  function getColumnTasks(status: string) {
    return filteredTasks.filter((t) => t.status === status);
  }

  function handleDragStart({ active }: DragStartEvent) {
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null);
    if (!over) return;
    const task      = tasks.find((t) => t.id === active.id);
    const newStatus = over.id as string;
    if (!task || task.status === newStatus) return;
    const oldStatus = task.status;

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );
    try {
      await updateTaskStatus(task.id, newStatus, oldStatus);
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: oldStatus } : t))
      );
      showToast("Failed to move task — changes reverted.", "error");
    }
  }

  async function handleCreateTask(input: CreateTaskInput) {
    try {
      const task = await createTask(input);
      setTasks((prev) => [...prev, task]);
      showToast("Task created.", "success");
      setModalStatus(null);
    } catch {
      showToast("Failed to create task.", "error");
    }
  }

  async function handleUpdateTask(
    id: string,
    patch: Partial<AppTask> & { assignee_id?: string | null }
  ) {
    await updateTask(id, patch);
  }

  async function handleDeleteTask(id: string) {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      showToast("Task deleted.", "info");
    } catch {
      showToast("Failed to delete task.", "error");
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header tasks={tasks} searchQuery={searchQuery} onSearch={setSearchQuery} />

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <main className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-5 h-full px-6 py-5 min-w-max">
            {columns.map((col) => (
              <div key={col.id} className="flex flex-col h-full">
                <div className="flex flex-col h-full overflow-y-auto pb-2" style={{ scrollbarWidth: "thin" }}>
                  <BoardColumn
                    status={col.id}
                    label={col.label}
                    color={col.color}
                    tasks={getColumnTasks(col.id)}
                    loading={loading}
                    onAddTask={(status) => setModalStatus(status)}
                    onTaskClick={(task) => setSelectedTaskId(task.id)}
                    onDelete={deleteColumn}
                  />
                </div>
              </div>
            ))}

            {/* Add column button */}
            <AddColumnButton onAdd={addColumn} />
          </div>
        </main>

        <DragOverlay dropAnimation={null}>
          {activeTask && <TaskCard task={activeTask} overlay />}
        </DragOverlay>
      </DndContext>

      {modalStatus && (
        <CreateTaskModal
          defaultStatus={modalStatus}
          fetchMembers={fetchMembers}
          fetchLabels={fetchLabels}
          createLabel={createLabel}
          onConfirm={handleCreateTask}
          onClose={() => setModalStatus(null)}
        />
      )}

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          members={members}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          onRefetch={refetch}
          onMemberCreated={(m) => setMembers((prev) => [...prev, m])}
        />
      )}
    </div>
  );
}
