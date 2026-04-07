export function SkeletonCard() {
  return (
    <div className="rounded-xl bg-[#1a1f2e] border border-white/5 p-4 space-y-3 animate-pulse">
      {/* title */}
      <div className="h-4 w-3/4 rounded bg-slate-700/60" />
      {/* description */}
      <div className="space-y-1.5">
        <div className="h-3 w-full rounded bg-slate-700/40" />
        <div className="h-3 w-2/3 rounded bg-slate-700/40" />
      </div>
      {/* bottom row */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-1.5">
          <div className="h-5 w-14 rounded-full bg-slate-700/50" />
          <div className="h-5 w-10 rounded-full bg-slate-700/50" />
        </div>
        <div className="h-6 w-6 rounded-full bg-slate-700/50" />
      </div>
    </div>
  );
}
