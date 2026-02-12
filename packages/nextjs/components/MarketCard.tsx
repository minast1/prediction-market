import React from "react";
import Link from "next/link";
import { BarChart2, Clock, TrendingUp, Zap } from "lucide-react";
import { Market, formatPrice, formatVolume } from "~~/lib/markets";

interface MarketCardProps {
  market: Market;
}
const MarketCard = ({ market }: MarketCardProps) => {
  const priceChange =
    market.priceHistory.length >= 2
      ? market.priceHistory[market.priceHistory.length - 1].yes -
        market.priceHistory[market.priceHistory.length - 2].yes
      : 0;

  const endDate = new Date(market.endDate);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  return (
    <Link href={`/markets/${market.id}`} className="block">
      <div className="glass-card-hover p-4 h-full flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 flex-1">{market.title}</h3>
          <div className="flex gap-1 shrink-0">
            {market.trending && (
              <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <Zap className="h-3 w-3" />
                Hot
              </span>
            )}
            {market.isNew && (
              <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">New</span>
            )}
            {market.resolved && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${market.outcome === "yes" ? "yes-pill" : "no-pill"}`}>
                {market.outcome === "yes" ? "Yes ✓" : "No ✗"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BarChart2 className="h-3 w-3" />
            {formatVolume(market.volume)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {market.resolved ? "Resolved" : `${daysLeft}d left`}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-xs">
            {market.category}
          </span>
        </div>

        {!market.resolved && (
          <div className="mt-auto pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="font-mono text-lg font-bold text-primary">{formatPrice(market.yesPrice)}</div>
                  <div className="text-xs text-muted-foreground">Yes</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-lg font-bold text-no">{formatPrice(market.noPrice)}</div>
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
        )}
      </div>
    </Link>
  );
};

export default MarketCard;
