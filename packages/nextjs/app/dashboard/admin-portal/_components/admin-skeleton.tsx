import React from "react";
import { Skeleton } from "~~/components/ui/skeleton";

const AdminSkeleton = () => {
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <div className="flex gap-1 mb-6 border-b border-border pb-px">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-32 rounded-t" />
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card p-4 space-y-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-[220px] w-full rounded" />
        </div>
        <div className="glass-card p-4 space-y-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-[220px] w-full rounded" />
        </div>
      </div>
    </div>
  );
};

export default AdminSkeleton;
