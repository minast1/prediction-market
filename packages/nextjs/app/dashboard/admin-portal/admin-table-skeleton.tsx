import React from "react";
import { Skeleton } from "~~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~~/components/ui/table";

const AdminTableSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Filter skeletons */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-[150px] rounded-md" />
        <Skeleton className="h-9 w-[160px] rounded-md" />
        <Skeleton className="h-4 w-20 ml-auto" />
      </div>

      {/* Table skeleton */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              {["w-[280px]", "w-[90px]", "w-[80px]", "w-[110px]", "w-[120px]", "w-[140px]"].map((w, i) => (
                <TableHead key={i}>
                  <Skeleton className={`h-3 ${w}`} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, row) => (
              <TableRow key={row} className="border-border">
                <TableCell>
                  <Skeleton className="h-4 w-[220px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-14" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Skeleton className="h-7 w-20 rounded-md" />
                    <Skeleton className="h-7 w-7 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminTableSkeleton;
