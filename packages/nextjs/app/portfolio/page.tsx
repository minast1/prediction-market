"use client";

import { useMemo } from "react";
import Link from "next/link";
import PortfolioPageSkeleton from "./_components/skeleton";
import { useFetchNativeCurrencyPrice, useWatchBalance } from "@scaffold-ui/hooks";
import { CheckCircle, ExternalLink, Globe, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { NextPage } from "next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatEther, getAddress, isAddress } from "viem";
import { useAccount, useEnsName } from "wagmi";
import { useNetworkColor, useTargetNetwork } from "~~/hooks/scaffold-eth";
import useUserActivePositions from "~~/hooks/useUserActivePositions";
import { MOCK_MARKETS, MOCK_POSITIONS } from "~~/lib/markets";

const Portfolio: NextPage = () => {
  const { address } = useAccount();
  const { data: balance } = useWatchBalance({ address });
  const { price: ethPrice } = useFetchNativeCurrencyPrice();
  const { targetNetwork } = useTargetNetwork();

  const checkSumAddress = useMemo(() => {
    if (!address || !isAddress(address)) return undefined;
    return getAddress(address); // 🚀 Converts to Checksum format
  }, [address]);

  const { data: ensName } = useEnsName({
    address: checkSumAddress!,
    query: {
      enabled: !!checkSumAddress,
    },
    chainId: targetNetwork.id, // ENS only lives on Ethereum Mainnet
  });

  const resolvedPositions = MOCK_POSITIONS.filter(p => {
    const m = MOCK_MARKETS.find(mk => mk.id === p.marketId);
    return m && m.resolved;
  });
  const { activePositions, isLoading, stats } = useUserActivePositions();
  const resolved = activePositions.filter(pos => pos.is_resolved);
  const displayName = ensName ? ensName : `${checkSumAddress?.slice(0, 6)}...${checkSumAddress?.slice(-4)}`;
  const networkColor = useNetworkColor();

  const totalValue = balance ? Number(formatEther(balance.value)) : 0;
  const totalPnl = stats.totalPnl ? Number(stats.totalPnl) * ethPrice : 0;
  //const totalPredictions = MOCK_POSITIONS.length;
  const correctPredictions = MOCK_POSITIONS.filter(p => {
    const m = MOCK_MARKETS.find(mk => mk.id === p.marketId);
    if (!m?.resolved) return false;
    return m.outcome === p.side;
  }).length;
  const incorrectPredictions = resolvedPositions.length - correctPredictions;
  const pendingPredictions = activePositions.length;

  const accuracyData = [
    { name: "Correct", value: correctPredictions },
    { name: "Incorrect", value: incorrectPredictions },
    { name: "Pending", value: pendingPredictions },
  ].filter(d => d.value > 0);
  const ACCURACY_COLORS = ["hsl(152, 60%, 48%)", "hsl(0, 72%, 55%)", "hsl(215, 12%, 55%)"];
  const pnlData = MOCK_POSITIONS.map(p => ({
    name: p.marketTitle.slice(0, 18) + "...",
    pnl: p.pnl,
  }));

  const accuracyPercent =
    resolvedPositions.length > 0 ? Math.round((correctPredictions / resolvedPositions.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PortfolioPageSkeleton />
      </div>
    );
  }

  return (
    <section>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Portfolio</h1>

        {/* Summary */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 stat-label">
              <Wallet className="h-3.5 w-3.5" /> Wallet Balance
            </div>
            <div className="stat-value mt-1">${(totalValue * ethPrice).toFixed(2)}</div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span className="font-mono">{targetNetwork.name}</span>
              <span
                className={`rounded-full w-2 h-2 border`}
                style={{ backgroundColor: networkColor, borderColor: networkColor }}
              />
              <span className="font-mono"> {displayName}</span>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="stat-label">Total P&L</div>
            <div
              className={`stat-value mt-1 flex items-center gap-2 ${stats?.totalPnl >= 0 ? "price-up" : "price-down"}`}
            >
              {stats?.totalPnl >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}$
              {totalPnl.toFixed(2)}
              <span className="text-sm">({Number(stats?.avgRoi).toFixed(1)}%)</span>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="stat-label">Active Positions</div>
            <div className="stat-value mt-1">{activePositions.length}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold mb-2">Prediction Accuracy</h3>
            <div className="flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={accuracyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {accuracyData.map((_, i) => (
                      <Cell key={i} fill={ACCURACY_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220, 18%, 9%)",
                      border: "1px solid hsl(220, 14%, 14%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    //formatter={(value: number, name: string) => [value, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold font-mono">{accuracyPercent}%</span>
                <span className="text-xs text-muted-foreground">Accuracy</span>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ACCURACY_COLORS[0] }} /> Correct (
                {correctPredictions})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ACCURACY_COLORS[1] }} /> Wrong (
                {incorrectPredictions})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ACCURACY_COLORS[2] }} /> Pending (
                {pendingPredictions})
              </span>
            </div>
          </div>
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold mb-4">P&L by Position</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pnlData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 14%)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "hsl(215, 12%, 55%)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(215, 12%, 55%)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220, 18%, 9%)",
                    border: "1px solid hsl(220, 14%, 14%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  // formatter={(value: number) => [`$${value.toFixed(2)}`, "P&L"]}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {pnlData.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? "hsl(152, 60%, 48%)" : "hsl(0, 72%, 55%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Positions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Active Positions</h2>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left py-3 px-4 font-medium">Market</th>
                    <th className="text-center py-3 px-2 font-medium">Side</th>
                    <th className="text-right py-3 px-2 font-medium">Shares</th>
                    <th className="text-right py-3 px-2 font-medium">Open Date</th>
                    <th className="text-right py-3 px-2 font-medium">Opening Price</th>
                    <th className="text-right py-3 px-2 font-medium">Current Price</th>
                    <th className="text-right py-3 px-4 font-medium">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {activePositions.map(pos => (
                    <tr
                      key={Number(pos.id)}
                      className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/markets/${Number(pos.id)}`}
                          className="hover:text-primary transition-colors flex items-center gap-1"
                        >
                          {pos.question.slice(0, 40)}...
                          <ExternalLink className="h-3 w-3 opacity-40" />
                        </Link>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={pos.side === 2 ? "yes-pill capitalize" : "no-pill capitalize"}>
                          {pos.side === 2 ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono">{formatEther(pos.staked)}</td>
                      <td className="py-3 px-2 text-right font-mono">
                        {new Date(Number(pos.open) * 1000).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 text-right font-mono">
                        ${(parseFloat(formatEther(pos.staked)) * ethPrice).toFixed(2)}
                      </td>
                      <td className={`py-3 px-2 text-right font-mono`}>${(pos.current_price * ethPrice).toFixed(2)}</td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-semibold ${pos.pnl >= 0 ? "price-up" : "price-down"}`}
                      >
                        {pos.pnl >= 0 ? "+" : ""}${(pos.pnl * ethPrice).toFixed(2)}
                        <span className="text-xs ml-1 opacity-70">({pos.roi.toFixed(1)}%)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Resolved */}
        {resolved.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Resolved — Claim Winnings
            </h2>
            <div className="space-y-3">
              {resolved.map(pos => {
                const won = pos.side === pos.market_outcome;
                return (
                  <div key={Number(pos.id)} className="glass-card p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/markets/${Number(pos.id)}`}
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        {pos.question}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className={pos.side === 2 ? "yes-pill" : "no-pill"}>{pos.side === 2 ? "Yes" : "No"}</span>
                        <span>
                          {formatEther(pos.staked)} shares @ $
                          {(parseFloat(formatEther(pos.staked)) * ethPrice).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {won ? (
                        <>
                          <div className="font-mono text-sm font-semibold price-up">
                            +${(Number(pos.pnl) * ethPrice).toFixed(2)}
                          </div>
                          <button className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110 transition-all">
                            Claim
                          </button>
                        </>
                      ) : (
                        <div className="font-mono text-sm text-muted-foreground">Lost</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Portfolio;
