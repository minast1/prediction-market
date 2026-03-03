import React from "react";
import { Skeleton } from "~~/components/ui/skeleton";

const MarketDetailSkeleton = () => {
  return (
    <div className="container py-6">
      <Skeleton className="h-4 w-32 mb-4" />
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-5 w-16 rounded" />
        </div>
        <Skeleton className="h-7 w-2/3" />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-3 text-center space-y-2">
                <Skeleton className="h-4 w-4 mx-auto" />
                <Skeleton className="h-5 w-16 mx-auto" />
                <Skeleton className="h-3 w-12 mx-auto" />
              </div>
            ))}
          </div>
          <div className="glass-card p-4 space-y-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-[240px] w-full rounded" />
          </div>
          <div className="glass-card p-4 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="glass-card p-4 space-y-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-9 w-full rounded" />
            <Skeleton className="h-9 w-full rounded" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDetailSkeleton;
