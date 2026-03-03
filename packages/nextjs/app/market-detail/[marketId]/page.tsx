"use client";

import React, { use, useMemo } from "react";
import Link from "next/link";
import PriceChart from "../_components/price-chart";
//import PriceChart from "../_components/price-chart";
import TradePanel from "../_components/trade-panel";
import { useFetchNativeCurrencyPrice } from "@scaffold-ui/hooks";
import { ArrowLeft, BarChart2, Clock, Droplets, Users } from "lucide-react";
import { useAccount } from "wagmi";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useMarketPriceHistory } from "~~/hooks/useMarketPriceHistory";
import { CATEGORIES, calculatePotentialPayout, formatPrice, timeLeftLabel } from "~~/lib/markets";

export default function MarketDetailPage({ params }: { params: Promise<{ marketId: string }> }) {
  const { marketId } = use(params);
  const { address } = useAccount();
  const { price: nativeCurrencyPrice } = useFetchNativeCurrencyPrice();
  const { data: market } = useScaffoldReadContract({
    contractName: "PredictionMarket",
    functionName: "getMarketInfo",
    args: [BigInt(marketId)],
  });
  const { data: contractInfo } = useScaffoldContract({ contractName: "PredictionMarket" });
  const { chartData } = useMarketPriceHistory(
    market?.id,
    contractInfo?.address,
    contractInfo?.abi,
    nativeCurrencyPrice,
  );

  const { data: userPredictions } = useScaffoldReadContract({
    contractName: "PredictionMarket",
    functionName: "getUserPredictions",
    args: [BigInt(market?.id || 0), address],
    query: {
      enabled: !!market,
    },
  });
  const claimed = userPredictions?.claimed === true;
  const payOut = useMemo(() => {
    // 1. If market isn't resolved (Status 3) or data is missing, return 0
    if (!market || !userPredictions || market.status !== 3) return "0.00";
    const winner = market.outcome;
    let winningAmount = 0n;
    if (winner === 2) {
      //Yes won
      winningAmount = userPredictions.yesAmount;
    } else if (winner === 1) {
      //No won
      winningAmount = userPredictions.noAmount;
    }
    if (winningAmount === 0n) return "0.00";
    const total = calculatePotentialPayout(winningAmount, winner, market);
    return total;
  }, [market, userPredictions]);

  if (!market) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-16 text-center">
          <p className="text-lg text-muted-foreground">Market not found</p>
          <Link href="/markets" className="text-primary hover:underline text-sm mt-2 inline-block">
            Back to markets
          </Link>
        </div>
      </div>
    );
  }
  const now = BigInt(Math.floor(Date.now() / 1000));

  const diff = market.marketClose > now ? market.marketClose - now : 0n;
  const daysLeft = timeLeftLabel(diff);
  const isClosed = now > market.marketClose;
  const isWon = market.outcome == userPredictions?.lastSide;
  return (
    <section>
      <div className="container py-6">
        <Link
          href="/markets"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to markets
        </Link>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-xs">
              {CATEGORIES[market.category]}
            </span>
            {market.status == 3 && (
              <span className={market.outcome === 2 ? "yes-pill" : "no-pill"}>
                Resolved: {market.outcome === 2 ? "Yes ✓" : "No ✗"}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold leading-tight">{market.question}</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  icon: BarChart2,
                  label: "Volume",
                  value: formatPrice(market.yesShares + market.noShares, nativeCurrencyPrice),
                },
                { icon: Droplets, label: "Liquidity", value: formatPrice(market.liquidity, nativeCurrencyPrice) },
                { icon: Clock, label: "Ends", value: isClosed ? "Ended" : `${daysLeft}` },
                {
                  icon: Users,
                  label: "Traders",
                  value: Math.floor(Number(market.totalParticipants)).toLocaleString(),
                },
              ].map(s => (
                <div key={s.label} className="glass-card p-3 text-center">
                  <s.icon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <div className="font-mono text-sm font-semibold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            <PriceChart data={chartData} />

            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold mb-2">Resolution Criteria</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{market.criteria}</p>
            </div>

            {/* Order Book Mock */}
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold mb-3">Order Book</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-2 flex justify-between">
                    <span>Price</span>
                    <span>Shares</span>
                  </div>
                  {[0.63, 0.64, 0.65, 0.66, 0.67].map((p, i) => (
                    <div key={p} className="flex justify-between text-xs font-mono py-1 relative">
                      <div
                        className="absolute inset-y-0 right-0 bg-primary/8 rounded-sm"
                        style={{ width: `${(5 - i) * 20}%` }}
                      />
                      <span className="relative text-primary">{p}</span>
                      <span className="relative text-muted-foreground">{(500 - i * 80).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-2 flex justify-between">
                    <span>Price</span>
                    <span>Shares</span>
                  </div>
                  {[0.62, 0.61, 0.6, 0.59, 0.58].map((p, i) => (
                    <div key={p} className="flex justify-between text-xs font-mono py-1 relative">
                      <div
                        className="absolute inset-y-0 right-0 rounded-sm"
                        style={{ width: `${(5 - i) * 20}%`, backgroundColor: "hsl(var(--no) / 0.08)" }}
                      />
                      <span className="relative text-no">{p}</span>
                      <span className="relative text-muted-foreground">{(420 - i * 70).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <TradePanel market={market as any} />

            {market.status == 3 && isWon && !claimed && (
              <div className="glass-card p-4 border-primary/30">
                <h3 className="text-sm font-semibold mb-2 text-primary">🎉 Claim Winnings</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  This market has resolved. If you hold winning shares, claim your payout below.
                </p>
                <button className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all">
                  {`Claim $${(Number(payOut) * nativeCurrencyPrice).toFixed(2)}`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
