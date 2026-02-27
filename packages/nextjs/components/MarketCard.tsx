import React from "react";
import Link from "next/link";
import { useFetchNativeCurrencyPrice } from "@scaffold-ui/hooks";
import { BarChart2, Clock, TrendingUp, Zap } from "lucide-react";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";
import { useMarketPriceHistory } from "~~/hooks/useMarketPriceHistory";
import useMarketStats from "~~/hooks/useMarketStats";
import useTransformedMarketData from "~~/hooks/useTransformedMarketData";
import { CATEGORIES } from "~~/lib/markets";
import { Market } from "~~/types/market";

interface MarketCardProps {
  market: Market;
}
const MarketCard = ({ market }: MarketCardProps) => {
  const { data: marketContract } = useScaffoldContract({ contractName: "PredictionMarket" });
  const { price: nativeCurrencyPrice } = useFetchNativeCurrencyPrice();
  const { data: marketData } = useTransformedMarketData();
  const { yesPrice, noPrice, chartData } = useMarketPriceHistory(
    BigInt(market.id),
    marketContract?.address,
    marketContract?.abi,
  );
  const { trendingMarkets } = useMarketStats(marketData);
  const priceChange =
    chartData.length >= 2 ? chartData[chartData.length - 1].price - chartData[chartData.length - 2].price : 0;

  const now = BigInt(Math.floor(Date.now() / 1000));
  const isClosed = now > market.endDate;
  const resolved = market.status === 3;

  const oneDayInSeconds = 86400n;
  const diff = market.endDate > now ? market.endDate - now : 0n;
  const newMarketdiff = now - market.openDate;
  const isNewMarket = newMarketdiff < oneDayInSeconds && !isClosed;

  const isTrending = trendingMarkets?.some(m => m.id === market.id);

  const daysLeft = Number(diff / oneDayInSeconds);
  return (
    <Link href={`/market-detail/${market.id}`} className="block">
      <div className="glass-card-hover p-4 h-full flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 flex-1">{market.title}</h3>
          <div className="flex gap-1 shrink-0">
            {isTrending && (
              <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <Zap className="h-3 w-3" />
                Hot
              </span>
            )}
            {isNewMarket && (
              <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">New</span>
            )}
            {resolved && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${market.outcome === 2 ? "yes-pill" : "no-pill"}`}>
                {market.outcome === 2 ? "Yes ✓" : "No ✗"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BarChart2 className="h-3 w-3" />
            {Number(market.yesShares + market.noShares) * nativeCurrencyPrice}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {resolved || isClosed || daysLeft === 0 ? "Closed" : `${daysLeft} d left`}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-xs">
            {CATEGORIES[market.category]}
          </span>
        </div>

        <div className="mt-auto pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="font-mono text-base font-bold text-primary">
                  ${(Number(yesPrice) * nativeCurrencyPrice).toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">Yes</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-base font-bold text-no">
                  ${(Number(noPrice) * nativeCurrencyPrice).toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">No</div>
              </div>
            </div>
            {priceChange !== 0 && (
              <div
                className={`flex items-center gap-1 text-xs font-mono ${priceChange > 0 ? "price-up" : "price-down"}`}
              >
                <TrendingUp className={`h-3 w-3 ${priceChange < 0 ? "rotate-180" : ""}`} />
                {Math.abs(priceChange * 100).toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MarketCard;
