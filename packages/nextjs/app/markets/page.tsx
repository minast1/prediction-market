"use client";

import { useMemo, useState } from "react";
import MarketFilters, { SortDir, SortField } from "./_components/MarketFilters";
import { NextPage } from "next";
import MarketCard from "~~/components/MarketCard";
import useMarketStats from "~~/hooks/useMarketStats";
import useTransformedMarketData from "~~/hooks/useTransformedMarketData";
import { CATEGORIES, Category } from "~~/lib/markets";

const Markets: NextPage = () => {
  const [category, setCategory] = useState<Category>("All Categories");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("volume");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showResolved, setShowResolved] = useState(false);
  const { data: marketData } = useTransformedMarketData();
  const { resolvedMarkets, activeMarkets } = useMarketStats(marketData);
  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortDir(d => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let markets = marketData;

    if (showResolved) markets = resolvedMarkets;
    if (category !== "All Categories") markets = markets?.filter(m => CATEGORIES[m.category] === category);
    if (search) {
      const q = search.toLowerCase();
      markets = markets?.filter(m => m.title.toLowerCase().includes(q));
    }

    markets = markets?.sort((a, b) => {
      let av: number, bv: number;
      switch (sortField) {
        case "volume":
          av = Number(a.volume);
          bv = Number(b.volume);
          break;
        case "liquidity":
          av = Number(a.liquidity);
          bv = Number(b.liquidity);
          break;
        case "yesPrice":
          av = 2; //a.;
          bv = 3; //b.yesPrice;
          break;
        case "endDate":
          av = new Date().getTime(); //Date(a.endDate).getTime();
          bv = new Date().getTime(); ///Date(b.endDate).getTime();
          break;
        default:
          av = 0;
          bv = 0;
      }
      return sortDir === "desc" ? bv - av : av - bv;
    });

    return markets;
  }, [marketData, showResolved, resolvedMarkets, category, search, sortField, sortDir]);

  return (
    <section>
      <div className="container py-8 md:py-12">
        <div className="mb-6 md:mb-10">
          <h1 className="text-2xl font-bold mb-1">Discover Markets</h1>
          <p className="text-sm text-muted-foreground">
            Browse {activeMarkets?.length} markets across {7} categories
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
          {filtered?.map(market => <MarketCard key={market.id} market={market} />)}
        </div>

        {filtered?.length === 0 && (
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
