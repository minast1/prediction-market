"use client";

import { useMemo, useState } from "react";
import MarketFilters, { SortDir, SortField } from "./_components/MarketFilters";
import { NextPage } from "next";
import MarketCard from "~~/components/MarketCard";
import { Category, MOCK_MARKETS } from "~~/lib/markets";

const Markets: NextPage = () => {
  const [category, setCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("volume");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showResolved, setShowResolved] = useState(false);

  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortDir(d => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let markets = MOCK_MARKETS;

    if (!showResolved) markets = markets.filter(m => !m.resolved);
    if (category !== "All") markets = markets.filter(m => m.category === category);
    if (search) {
      const q = search.toLowerCase();
      markets = markets.filter(m => m.title.toLowerCase().includes(q));
    }

    markets = [...markets].sort((a, b) => {
      let av: number, bv: number;
      switch (sortField) {
        case "volume":
          av = a.volume;
          bv = b.volume;
          break;
        case "liquidity":
          av = a.liquidity;
          bv = b.liquidity;
          break;
        case "yesPrice":
          av = a.yesPrice;
          bv = b.yesPrice;
          break;
        case "endDate":
          av = new Date(a.endDate).getTime();
          bv = new Date(b.endDate).getTime();
          break;
        default:
          av = 0;
          bv = 0;
      }
      return sortDir === "desc" ? bv - av : av - bv;
    });

    return markets;
  }, [category, search, sortField, sortDir, showResolved]);

  return (
    <section>
      <div className="container py-8 md:py-12">
        <div className="mb-6 md:mb-10">
          <h1 className="text-2xl font-bold mb-1">Discover Markets</h1>
          <p className="text-sm text-muted-foreground">
            Browse {MOCK_MARKETS.length} markets across {7} categories
          </p>
        </div>

        <MarketFilters
          category={category}
          onCategoryChange={setCategory}
          search={search}
          onSearchChange={setSearch}
          sortField={sortField}
          sortDir={sortDir}
          onSortChange={handleSortChange}
          showResolved={showResolved}
          onShowResolvedChange={setShowResolved}
        />

        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(market => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No markets found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Markets;
