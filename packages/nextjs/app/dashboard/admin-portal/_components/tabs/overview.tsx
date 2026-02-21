import React, { useMemo } from "react";
import { useFetchNativeCurrencyPrice } from "@scaffold-ui/hooks";
import { Activity, AlertTriangle, BarChart3, Bot, DollarSign } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatEther } from "viem";
import { Badge } from "~~/components/ui/badge";
import { CATEGORIES, formatVolume } from "~~/lib/markets";

type TProps = {
  markets: any[];
};

const PIE_COLORS = [
  "hsl(152, 60%, 48%)",
  "hsl(200, 60%, 50%)",
  "hsl(40, 80%, 55%)",
  "hsl(280, 50%, 55%)",
  "hsl(20, 70%, 55%)",
  "hsl(340, 60%, 50%)",
  "hsl(170, 50%, 45%)",
];

const OverviewTab = ({ markets }: TProps) => {
  const { price: nativeCurrencyPrice } = useFetchNativeCurrencyPrice();

  const totalVolume = useMemo(() => {
    if (!nativeCurrencyPrice) return 0;
    const totalOverallVolume = markets?.reduce((s, m) => s + m.volume, 0n);
    return parseFloat(formatEther(totalOverallVolume)) * nativeCurrencyPrice;
  }, [nativeCurrencyPrice, markets]);

  const volumeOverTime = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      volume: Math.round(totalVolume * (0.1 + Math.random() * 0.05)),
    };
  });

  const totalLiquidity = markets?.reduce((s, m) => s + m.liquidity, 0);
  const resolvedMarkets = markets?.filter(m => m.resolved);
  const categoryData = CATEGORIES.filter(c => c !== "All").map(cat => ({
    name: cat,
    count: markets?.filter(m => m.category === cat).length,
    volume: markets?.filter(m => m.category === cat).reduce((s, m) => s + m.volume, 0),
  }));
  const activeMarkets = markets?.filter(m => m.marketClose > Date.now() / 1000) || [];
  const inconclusiveMarkets = markets?.filter(m => m.aiStatus === "inconclusive" && !m.resolved);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Volume", value: formatVolume(totalVolume), icon: DollarSign, color: "text-primary" },
          {
            label: "Active Markets",
            value: activeMarkets.length.toString(),
            icon: Activity,
            color: "text-primary",
          },
          {
            label: "Total Liquidity",
            value: formatVolume(totalLiquidity),
            icon: BarChart3,
            color: "text-blue-400",
          },
          {
            label: "Inconclusive",
            value: inconclusiveMarkets?.length.toString(),
            icon: AlertTriangle,
            color: "text-yellow-400",
          },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="stat-label">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-4">Volume (7 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={volumeOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 14%)" />
              <XAxis
                dataKey="day"
                tick={{ fill: "hsl(215, 12%, 55%)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(215, 12%, 55%)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatVolume(v)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(220, 18%, 9%)",
                  border: "1px solid hsl(220, 14%, 14%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                // formatter={(v: number) => [formatVolume(v), "Volume"]}
              />
              <Line type="monotone" dataKey="volume" stroke="hsl(152, 60%, 48%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4">
          {/* Recently Resolved */}
          <h3 className="text-sm font-semibold mb-4">Recently Resolved</h3>
          <div className="space-y-3">
            {resolvedMarkets?.map(m => (
              <div key={m.id} className="glass-card p-4 flex items-center justify-between gap-4 opacity-70">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{m.title}</span>
                    {m.aiStatus === "resolved" && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Bot className="h-2.5 w-2.5" /> AI
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {m.category} · {formatVolume(m.volume)} volume
                  </div>
                </div>
                <Badge variant={m.outcome === "yes" ? "default" : "destructive"} className="text-xs">
                  {m.outcome?.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-4">Volume by Category</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={categoryData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
              tickFormatter={(v: number) => formatVolume(v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 9%)",
                border: "1px solid hsl(220, 14%, 14%)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              //formatter={(v: number) => [formatVolume(v), "Volume"]}
            />
            <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
              {categoryData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OverviewTab;
