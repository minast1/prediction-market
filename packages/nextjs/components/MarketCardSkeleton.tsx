import React from "react";
import { Skeleton } from "./ui/skeleton";

const MarketCardSkeleton = () => {
  return (
    <div className="glass-card p-4 h-full flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="h-3 w-1/2" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-5 w-16 rounded" />
      </div>
      <div className="mt-auto pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-center space-y-1">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-8 mx-auto" />
            </div>
            <div className="text-center space-y-1">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-8 mx-auto" />
            </div>
          </div>
          <Skeleton className="h-4 w-10" />
        </div>
      </div>
    </div>
  );
};

export default MarketCardSkeleton;
