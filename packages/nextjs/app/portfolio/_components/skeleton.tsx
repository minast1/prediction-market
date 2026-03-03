import React from "react";
import { Skeleton } from "~~/components/ui/skeleton";

const PortfolioPageSkeleton = () => {
  return (
    <div className="container py-8">
      <Skeleton className="h-7 w-32 mb-6" />
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
            {i === 0 && <Skeleton className="h-3 w-40" />}
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-4 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-[200px] w-full rounded" />
        </div>
        <div className="glass-card p-4 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-[200px] w-full rounded" />
        </div>
      </div>
      <Skeleton className="h-5 w-36 mb-4" />
      <div className="glass-card overflow-hidden">
        <div className="space-y-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
              <Skeleton className="h-4 w-48 flex-1" />
              <Skeleton className="h-5 w-10 rounded-full" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioPageSkeleton;
