import React from "react";

export const CategoryBentoSkeleton: React.FC = () => {
  return (
    <div
      aria-label="Cargando categorías"
      role="status"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6 auto-rows-auto sm:auto-rows-[240px] animate-pulse"
    >
      {/* 1. Large Hero Bento Skeleton (7 cols, 2 rows) */}
      <div className="min-h-[260px] sm:min-h-0 sm:col-span-2 lg:col-span-7 lg:row-span-2 relative rounded-3xl bg-gradient-to-br from-emerald-950/80 to-[#12352C] border border-white/20 p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-sm">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

        {/* Top Header Placeholder */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="h-6 w-36 rounded-full bg-white/15 backdrop-blur-md" />
          <div className="size-9 rounded-full bg-white/20 backdrop-blur-md" />
        </div>

        {/* Bottom Content Placeholder */}
        <div className="relative z-10 space-y-3">
          <div className="h-3 w-28 rounded-full bg-emerald-400/30" />
          <div className="h-8 w-56 sm:w-64 rounded-xl bg-white/25" />
          <div className="space-y-1.5 pt-1">
            <div className="h-3.5 w-full max-w-sm rounded bg-white/15" />
            <div className="h-3.5 w-3/4 max-w-xs rounded bg-white/15" />
          </div>
        </div>
      </div>

      {/* 2. Medium Bento Skeleton (5 cols, 1 row) */}
      <div className="min-h-[160px] sm:min-h-0 sm:col-span-1 lg:col-span-5 lg:row-span-1 rounded-3xl bg-white/80 border border-[#E5EAE6] p-6 flex flex-col justify-between relative overflow-hidden shadow-xs">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-24 rounded-full bg-emerald-700/15" />
          <div className="size-8 rounded-full bg-[#F0F4F1]" />
        </div>
        <div className="space-y-2">
          <div className="h-6 w-40 rounded-lg bg-black/10" />
          <div className="h-3 w-4/5 rounded bg-black/5" />
        </div>
      </div>

      {/* 3. Medium Bento Skeleton (5 cols, 1 row) */}
      <div className="min-h-[160px] sm:min-h-0 sm:col-span-1 lg:col-span-5 lg:row-span-1 rounded-3xl bg-white/80 border border-[#E5EAE6] p-6 flex flex-col justify-between relative overflow-hidden shadow-xs">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-24 rounded-full bg-amber-700/15" />
          <div className="size-8 rounded-full bg-[#F0F4F1]" />
        </div>
        <div className="space-y-2">
          <div className="h-6 w-44 rounded-lg bg-black/10" />
          <div className="h-3 w-3/4 rounded bg-black/5" />
        </div>
      </div>

      {/* 4. Compact Bento Skeleton (4 cols, 1 row) */}
      <div className="min-h-[160px] sm:min-h-0 sm:col-span-1 lg:col-span-4 lg:row-span-1 rounded-3xl bg-white/80 border border-[#E5EAE6] p-6 flex flex-col justify-between relative overflow-hidden shadow-xs">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-20 rounded-full bg-black/10" />
          <div className="size-8 rounded-full bg-[#F0F4F1]" />
        </div>
        <div className="space-y-2">
          <div className="h-5 w-36 rounded-lg bg-black/10" />
          <div className="h-3 w-2/3 rounded bg-black/5" />
        </div>
      </div>

      {/* 5. Compact Bento Skeleton (4 cols, 1 row) */}
      <div className="min-h-[160px] sm:min-h-0 sm:col-span-1 lg:col-span-4 lg:row-span-1 rounded-3xl bg-white/80 border border-[#E5EAE6] p-6 flex flex-col justify-between relative overflow-hidden shadow-xs">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-24 rounded-full bg-black/10" />
          <div className="size-8 rounded-full bg-[#F0F4F1]" />
        </div>
        <div className="space-y-2">
          <div className="h-5 w-32 rounded-lg bg-black/10" />
          <div className="h-3 w-4/5 rounded bg-black/5" />
        </div>
      </div>

      {/* 6. Dark / Accent Bento Skeleton (4 cols, 1 row) */}
      <div className="min-h-[160px] sm:min-h-0 sm:col-span-2 lg:col-span-4 lg:row-span-1 rounded-3xl bg-[#12352C]/90 border border-white/10 p-6 flex flex-col justify-between relative overflow-hidden shadow-sm">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-28 rounded-full bg-emerald-400/25" />
          <div className="size-8 rounded-full bg-white/10" />
        </div>
        <div className="space-y-2">
          <div className="h-5 w-40 rounded-lg bg-white/20" />
          <div className="h-3 w-3/4 rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
};
