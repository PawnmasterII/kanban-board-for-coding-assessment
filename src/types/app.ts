import type { TaskStatus, TaskPriority } from "./database";

export type { TaskStatus, TaskPriority };

export interface AppMember {
  id:         string;
  name:       string;
  color:      string;
  avatar_url: string | null;
}

export interface AppLabel {
  id:    string;
  name:  string;
  color: string;
}

export interface AppTask {
  id:          string;
  title:       string;
  description: string | null;
  status:      string;           // string to support custom columns
  priority:    TaskPriority;
  due_date:    string | null;
  assignee:    AppMember | null;
  labels:      AppLabel[];
  user_id:     string;
  created_at:  string;
}

export interface CreateTaskInput {
  title:       string;
  description: string | null;
  priority:    TaskPriority;
  due_date:    string | null;
  status:      string;
  assignee_id: string | null;
  label_ids?:  string[];
}

export interface Column {
  id:    string;   // equals the task status value stored in DB
  label: string;
  color: string;   // hex
}
