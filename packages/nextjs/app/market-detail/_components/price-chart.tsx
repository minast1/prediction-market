import React from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface PriceChartProps {
  data: { time: string; yes: number }[];
}
const PriceChart = ({ data }: PriceChartProps) => {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Price History</h3>
        <div className="flex gap-2">
          {["1W", "1M", "ALL"].map(label => (
            <button
              key={label}
              className="px-2 py-1 text-xs rounded bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="yesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(152, 60%, 48%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(152, 60%, 48%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 14%)" />
          <XAxis dataKey="time" tick={{ fill: "hsl(215, 12%, 55%)", fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            domain={[0, 1]}
            tick={{ fill: "hsl(215, 12%, 55%)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${Math.round(v * 100)}¢`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(220, 18%, 9%)",
              border: "1px solid hsl(220, 14%, 14%)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "hsl(215, 12%, 55%)" }}
            //formatter={(value: number) => [`${Math.round(value * 100)}¢`, "Yes"]}
          />
          <Area type="monotone" dataKey="yes" stroke="hsl(152, 60%, 48%)" strokeWidth={2} fill="url(#yesGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
