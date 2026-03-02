import React from "react";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { useFetchNativeCurrencyPrice } from "@scaffold-ui/hooks";
import { BarChart2, Clock, TrendingUp, Zap } from "lucide-react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import useMarketStats from "~~/hooks/useMarketStats";
import useTransformedMarketData from "~~/hooks/useTransformedMarketData";
import { CATEGORIES, formatPrice, timeLeftLabel } from "~~/lib/markets";
import { Market } from "~~/types/market";

interface MarketCardProps {
  market: Market;
}
const MarketCard = ({ market }: MarketCardProps) => {
  const { price: nativeCurrencyPrice } = useFetchNativeCurrencyPrice();
  const { data: marketData } = useTransformedMarketData();

  const { trendingMarkets } = useMarketStats(marketData);
  const { data: currentPrice } = useScaffoldReadContract({
    contractName: "PredictionMarket",
    functionName: "getPrices",
    args: [BigInt(market.id)],
    query: {
      enabled: !!market,
    },
  });
  const yesPrice = currentPrice ? currentPrice[0] : 0n;
  const noPrice = currentPrice ? currentPrice[1] : 0n;
  const priceChange = Number(yesPrice) - Number(noPrice);

  const now = BigInt(Math.floor(Date.now() / 1000));
  const isClosed = now > market.endDate;
  const resolved = market.status === 3;

  const oneDayInSeconds = 86400n;
  const diff = market.endDate > now ? market.endDate - now : 0n;
  const newMarketdiff = now - market.openDate;
  const isNewMarket = newMarketdiff < oneDayInSeconds && !isClosed;

  const isTrending = trendingMarkets?.some(m => m.id === market.id);

  const isEndingSoon = diff > 0n && diff < 3600n;
  const daysLeft = timeLeftLabel(diff);
  console.log(diff);
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
          {isEndingSoon ? (
            <Badge variant="destructive">Ending Soon</Badge>
          ) : (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {resolved || isClosed ? "Closed" : daysLeft}
            </span>
          )}

          <span className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-xs">
            {CATEGORIES[market.category]}
          </span>
        </div>

        <div className="mt-auto pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="font-mono text-base font-bold text-primary">
                  ${formatPrice(yesPrice, nativeCurrencyPrice)}
                </div>
                <div className="text-xs text-muted-foreground">Yes</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-base font-bold text-no">
                  ${formatPrice(noPrice, nativeCurrencyPrice)}
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
