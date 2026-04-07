"use client";

import { useAuth } from "@/providers/AuthProvider";
import { BoardLayout } from "@/components/board/BoardLayout";

export default function HomePage() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-500" />
          <p className="text-sm text-slate-500">Initialising session…</p>
        </div>
      </div>
    );
  }

  return <BoardLayout />;
}
