import React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { CATEGORIES, Category } from "~~/lib/markets";

export type SortField = "volume" | "endDate" | "yesPrice" | "liquidity";
export type SortDir = "asc" | "desc";

interface MarketFiltersProps {
  category: Category;
  onCategoryChange: (c: Category) => void;
  search: string;
  onSearchChange: (s: string) => void;
  sortField: SortField;
  sortDir: SortDir;
  onSortChange: (field: SortField) => void;
  showResolved: boolean;
  onShowResolvedChange: (v: boolean) => void;
}
const MarketFilters = ({
  category,
  onCategoryChange,
  search,
  onSearchChange,
  sortField,
  sortDir,
  onSortChange,
  showResolved,
  onShowResolvedChange,
}: MarketFiltersProps) => {
  return (
    <div className="space-y-4 md:mb-10">
      <input
        type="text"
        placeholder="Search markets..."
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />

      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              category === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {(["volume", "endDate", "yesPrice", "liquidity"] as SortField[]).map(field => {
          const labels: Record<SortField, string> = {
            volume: "Volume",
            endDate: "End Date",
            yesPrice: "Price",
            liquidity: "Liquidity",
          };
          const active = sortField === field;
          return (
            <button
              key={field}
              onClick={() => onSortChange(field)}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {labels[field]}
              {active ? (
                sortDir === "desc" ? (
                  <ArrowDown className="h-3 w-3" />
                ) : (
                  <ArrowUp className="h-3 w-3" />
                )
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-40" />
              )}
            </button>
          );
        })}

        <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={e => onShowResolvedChange(e.target.checked)}
            className="rounded border-border accent-primary"
          />
          Show resolved
        </label>
      </div>
    </div>
  );
};

export default MarketFilters;
