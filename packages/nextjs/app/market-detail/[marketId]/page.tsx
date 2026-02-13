"use client";

import React, { use } from "react";
import Link from "next/link";
import PriceChart from "../_components/price-chart";
import TradePanel from "../_components/trade-panel";
import { ArrowLeft, BarChart2, Clock, Droplets, Users } from "lucide-react";
import { MOCK_MARKETS, formatPrice, formatVolume } from "~~/lib/markets";

export default function MarketDetailPage({ params }: { params: Promise<{ marketId: string }> }) {
  const { marketId } = use(params);
  const market = MOCK_MARKETS.find(m => m.id === marketId);

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

  const endDate = new Date(market.endDate);
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

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
              {market.category}
            </span>
            {market.resolved && (
              <span className={market.outcome === "yes" ? "yes-pill" : "no-pill"}>
                Resolved: {market.outcome === "yes" ? "Yes ✓" : "No ✗"}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold leading-tight">{market.title}</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: BarChart2, label: "Volume", value: formatVolume(market.volume) },
                { icon: Droplets, label: "Liquidity", value: formatVolume(market.liquidity) },
                { icon: Clock, label: "Ends", value: market.resolved ? "Resolved" : `${daysLeft} days` },
                { icon: Users, label: "Traders", value: Math.floor(market.volume / 850).toLocaleString() },
              ].map(s => (
                <div key={s.label} className="glass-card p-3 text-center">
                  <s.icon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <div className="font-mono text-sm font-semibold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            <PriceChart data={market.priceHistory} />

            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold mb-2">Resolution Criteria</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{market.description}</p>
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
                      <span className="relative text-primary">{formatPrice(p)}</span>
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
                      <span className="relative text-no">{formatPrice(p)}</span>
                      <span className="relative text-muted-foreground">{(420 - i * 70).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <TradePanel market={market} />

            {market.resolved && (
              <div className="glass-card p-4 border-primary/30">
                <h3 className="text-sm font-semibold mb-2 text-primary">🎉 Claim Winnings</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  This market has resolved. If you hold winning shares, claim your payout below.
                </p>
                <button className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all">
                  Claim $67.50
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
