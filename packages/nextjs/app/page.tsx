"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Shield, TrendingUp, Zap } from "lucide-react";
//import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import MarketCard from "~~/components/MarketCard";
import { MOCK_MARKETS, formatVolume } from "~~/lib/markets";

//import { hardhat } from "viem/chains";
//import { useAccount } from "wagmi";
//import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
//import { useTargetNetwork } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const trendingMarkets = MOCK_MARKETS.filter(m => m.trending && !m.resolved).slice(0, 3);
  const totalVolume = MOCK_MARKETS.reduce((s, m) => s + m.volume, 0);
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden md:px-[10.5rem] border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/9 via-transparent to-transparent" />
        <div className="container flex relative  py-20 md:py-28">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
              <Zap className="h-3.5 w-3.5" />
              Live prediction markets
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
              Trade on the outcome of <span className="text-primary">real-world events</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Buy and sell shares in prediction markets. Profit from your knowledge of politics, crypto, sports, and
              more.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/markets"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all"
              >
                Explore Markets
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground hover:bg-accent transition-colors"
              >
                View Portfolio
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* Stats */}
      <section className="border-b border-border">
        <div className="container grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {[
            { label: "Total Volume", value: formatVolume(totalVolume) },
            { label: "Active Markets", value: MOCK_MARKETS.filter(m => !m.resolved).length.toString() },
            { label: "Resolved", value: MOCK_MARKETS.filter(m => m.resolved).length.toString() },
            { label: "Categories", value: "7" },
          ].map(stat => (
            <div key={stat.label} className="py-6 px-4 text-center">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
      {/* Trending */}
      <section className="container py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Trending Markets</h2>
          </div>
          <Link href="/markets" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {trendingMarkets.map(market => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      </section>
      {/* Features */}
      <section className="container pb-16">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: BarChart3,
              title: "Real-time Markets",
              desc: "Trade on hundreds of events with live pricing and deep liquidity.",
            },
            {
              icon: Shield,
              title: "Transparent Resolution",
              desc: "Markets resolve based on verifiable outcomes. Every resolution is auditable.",
            },
            {
              icon: TrendingUp,
              title: "Profit from Knowledge",
              desc: "If you know better than the crowd, you profit. Simple as that.",
            },
          ].map(f => (
            <div key={f.title} className="glass-card p-6">
              <f.icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default Home;
