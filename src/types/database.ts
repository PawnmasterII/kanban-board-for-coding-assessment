export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TaskStatus   = "To Do" | "In Progress" | "In Review" | "Done";
export type TaskPriority = "Low" | "Normal" | "High";

export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: {
          id:          string;
          title:       string;
          description: string | null;
          status:      string;
          priority:    string;
          due_date:    string | null;
          user_id:     string;
          assignee_id: string | null;
          created_at:  string;
        };
        Insert: {
          id?:         string;
          title:       string;
          description?: string | null;
          status?:     string;
          priority?:   string;
          due_date?:   string | null;
          user_id:     string;
          assignee_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?:         string;
          title?:      string;
          description?: string | null;
          status?:     string;
          priority?:   string;
          due_date?:   string | null;
          user_id?:    string;
          assignee_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey";
            columns: ["assignee_id"];
            isOneToOne: false;
            referencedRelation: "team_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      team_members: {
        Row: {
          id:         string;
          name:       string;
          color:      string;
          avatar_url: string | null;
          user_id:    string;
          created_at: string;
        };
        Insert: {
          id?:         string;
          name:        string;
          color?:      string;
          avatar_url?: string | null;
          user_id:     string;
          created_at?: string;
        };
        Update: {
          id?:         string;
          name?:       string;
          color?:      string;
          avatar_url?: string | null;
          user_id?:    string;
          created_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id:         string;
          task_id:    string;
          text:       string;
          user_id:    string;
          created_at: string;
        };
        Insert: {
          id?:         string;
          task_id:     string;
          text:        string;
          user_id:     string;
          created_at?: string;
        };
        Update: {
          id?:         string;
          task_id?:    string;
          text?:       string;
          user_id?:    string;
          created_at?: string;
        };
        Relationships: [];
      };
      task_activity: {
        Row: {
          id:         string;
          task_id:    string;
          action:     string;
          user_id:    string;
          created_at: string;
        };
        Insert: {
          id?:         string;
          task_id:     string;
          action:      string;
          user_id:     string;
          created_at?: string;
        };
        Update: {
          id?:         string;
          task_id?:    string;
          action?:     string;
          user_id?:    string;
          created_at?: string;
        };
        Relationships: [];
      };
      labels: {
        Row: {
          id:         string;
          name:       string;
          color:      string;
          user_id:    string;
          created_at: string;
        };
        Insert: {
          id?:         string;
          name:        string;
          color?:      string;
          user_id:     string;
          created_at?: string;
        };
        Update: {
          id?:         string;
          name?:       string;
          color?:      string;
          user_id?:    string;
          created_at?: string;
        };
        Relationships: [];
      };
      task_labels: {
        Row: {
          task_id:  string;
          label_id: string;
        };
        Insert: {
          task_id:  string;
          label_id: string;
        };
        Update: {
          task_id?:  string;
          label_id?: string;
        };
        Relationships: [];
      };
    };
    Views:          { [_ in never]: never };
    Functions:      { [_ in never]: never };
    Enums:          { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
