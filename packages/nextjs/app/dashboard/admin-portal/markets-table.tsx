import React, { useMemo, useState } from "react";
import AiSettlementButton from "./_components/ai-settlement-button";
import ManualSettlementButton from "./_components/manual-settlement-buttons";
import { useFetchNativeCurrencyPrice } from "@scaffold-ui/hooks";
import {
  type ColumnFiltersState,
  type SortingState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AlertTriangle, ArrowUpDown, CheckCircle, Clock } from "lucide-react";
import { formatEther } from "viem";
import { Badge } from "~~/components/ui/badge";
import { Button } from "~~/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~~/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~~/components/ui/table";
import { CATEGORIES } from "~~/lib/markets";
import { Market } from "~~/types/market";

type MarketStatus = "open" | "ended" | "resolved" | "inconclusive";
interface TableProps {
  data: Market[];
  // onRequestSettlement: (marketId: string) => void;
  // onResolve: (marketId: string, outcome: "yes" | "no") => void;
}
const columnHelper = createColumnHelper<Market>();

function getMarketStatus(m: Market): MarketStatus {
  if (m.status === 3) return "resolved";
  //if (m.aiStatus === "processing") return "processing";
  if (m.outcome === 3) return "inconclusive";
  const now = BigInt(Math.floor(Date.now() / 1000));

  return m.endDate < now ? "ended" : "open";
}

function getCategory(m: Market): string {
  return CATEGORIES[m.category];
}

const statusConfig: Record<MarketStatus, { label: string; icon: typeof CheckCircle; className: string }> = {
  open: { label: "Open", icon: Clock, className: "text-primary" },
  ended: { label: "Ended", icon: Clock, className: "text-orange-400" },
  resolved: { label: "Resolved", icon: CheckCircle, className: "text-primary" },
  // processing: { label: "AI Processing", icon: Loader2, className: "text-blue-400" },
  inconclusive: { label: "Inconclusive", icon: AlertTriangle, className: "text-yellow-400" },
};

function getMarketDate(m: Market): { label: string; date: string } {
  const status = getMarketStatus(m);

  switch (status) {
    case "resolved":
      return { label: "Settled", date: new Date(Number(m.settledAt) * 1000).toLocaleDateString() };
    case "ended":
    case "inconclusive":
      // case "processing":
      return { label: "Closed", date: new Date(Number(m.endDate) * 1000).toLocaleDateString() };
    default:
      return { label: "Opens", date: new Date(Number(m.endDate) * 1000).toString() }; //m.endDate };
  }
}

const MarketTable = ({ data }: TableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const { price: nativeCurrencyPrice } = useFetchNativeCurrencyPrice();
  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Market",
        cell: info => (
          <span className="block max-w-[280px] md:max-w-[330px] truncate font-medium text-sm">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("category", {
        header: "Category",
        cell: ({ row }) => {
          const cat = getCategory(row.original);
          return (
            <Badge variant="secondary" className="text-xs">
              {cat}
            </Badge>
          );
        },
        filterFn: (row, _columnId, filterValue) => {
          if (filterValue === undefined || filterValue === null) return true;
          return Number(row.original.category) === Number(filterValue);
        },
      }),
      columnHelper.accessor("volume", {
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            Volume <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => {
          const volumeData = row.original.volume;
          const volumeInUs = parseFloat(formatEther(volumeData)) * nativeCurrencyPrice;
          return <span className="font-mono text-xs">${volumeInUs}</span>;
        },
      }),
      columnHelper.display({
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = getMarketStatus(row.original);
          const config = statusConfig[status];
          const Icon = config.icon;
          return (
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.className}`}>
              <Icon className={`h-3 w-3`} />
              {config.label}
            </span>
          );
        },
        filterFn: (row, _columnId, filterValue) => {
          if (!filterValue || filterValue === "all") return true;
          const currentStatus = getMarketStatus(row.original);
          return currentStatus === filterValue;
        },
      }),
      columnHelper.display({
        id: "date",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            Date <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => {
          const { label, date } = getMarketDate(row.original);
          const formatted = new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          return (
            <div className="text-xs">
              <span className="text-muted-foreground">{label}: </span>
              <span className="font-medium">{formatted}</span>
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          return Number(rowA.original.endDate - rowB.original.endDate);
        },
      }),
      columnHelper.display({
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {m.status == 0 && m.outcome == 0 && <AiSettlementButton market={m} />}
              {/* {m.aiStatus === "processing" && (
                <span className="text-xs text-blue-400 flex items-center gap-1.5 px-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Analyzing…
                </span>
              )} */}
              {m.outcome == 3 && <ManualSettlementButton market={m} />}
            </div>
          );
        },
      }),
    ],
    [nativeCurrencyPrice],
  );

  const table = useReactTable({
    data: data,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  const categoryFilterValue = columnFilters.find(f => f.id === "category")?.value as string;
  const categoryFilter = typeof categoryFilterValue === "number" ? CATEGORIES[categoryFilterValue] : "All";
  const statusFilter = (columnFilters.find(f => f.id === "status")?.value as string) || "all";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={categoryFilter}
          onValueChange={v =>
            setColumnFilters(prev => [
              ...prev.filter(f => f.id !== "category"),
              ...(v === "All" ? [] : [{ id: "category", value: CATEGORIES.indexOf(v as any) }]),
            ])
          }
        >
          <SelectTrigger className="w-[150px] h-9 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat} className="text-xs">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={v =>
            setColumnFilters(prev => [
              ...prev.filter(f => f.id !== "status"),
              ...(v === "all" ? [] : [{ id: "status", value: v }]),
            ])
          }
        >
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All Statuses
            </SelectItem>
            <SelectItem value="open" className="text-xs">
              Open
            </SelectItem>
            <SelectItem value="ended" className="text-xs">
              Ended
            </SelectItem>
            <SelectItem value="resolved" className="text-xs">
              Resolved
            </SelectItem>
            <SelectItem value="processing" className="text-xs">
              AI Processing
            </SelectItem>
            <SelectItem value="inconclusive" className="text-xs">
              Inconclusive
            </SelectItem>
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground ml-auto">
          {table.getFilteredRowModel().rows.length} market{table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className="border-border hover:bg-transparent">
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id} className="text-xs text-muted-foreground font-medium">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
                  No markets found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} className="border-border">
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketTable;
