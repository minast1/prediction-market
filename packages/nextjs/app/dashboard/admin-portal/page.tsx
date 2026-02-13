"use client";

import { useState } from "react";
import { Activity, AlertTriangle, BarChart3, CheckCircle, Clock, DollarSign, Gavel, Plus, Trash2 } from "lucide-react";
import { NextPage } from "next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "~~/components/ui/badge";
import { Button } from "~~/components/ui/button";
import { CATEGORIES, MOCK_MARKETS, Market, formatVolume } from "~~/lib/markets";

type AdminTab = "overview" | "markets" | "resolution";

interface NewMarketForm {
  title: string;
  category: string;
  endDate: string;
  description: string;
}

const AdminPortal: NextPage = () => {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [markets, setMarkets] = useState<Market[]>(MOCK_MARKETS);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<NewMarketForm>({ title: "", category: "Crypto", endDate: "", description: "" });

  const activeMarkets = markets.filter(m => !m.resolved);
  const resolvedMarkets = markets.filter(m => m.resolved);
  const pendingResolution = activeMarkets.filter(m => new Date(m.endDate) <= new Date());
  const totalVolume = markets.reduce((s, m) => s + m.volume, 0);
  const totalLiquidity = markets.reduce((s, m) => s + m.liquidity, 0);

  const categoryData = CATEGORIES.filter(c => c !== "All").map(cat => ({
    name: cat,
    count: markets.filter(m => m.category === cat).length,
    volume: markets.filter(m => m.category === cat).reduce((s, m) => s + m.volume, 0),
  }));

  const volumeOverTime = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      volume: Math.round(totalVolume * (0.1 + Math.random() * 0.05)),
    };
  });

  const PIE_COLORS = [
    "hsl(152, 60%, 48%)",
    "hsl(200, 60%, 50%)",
    "hsl(40, 80%, 55%)",
    "hsl(280, 50%, 55%)",
    "hsl(20, 70%, 55%)",
    "hsl(340, 60%, 50%)",
    "hsl(170, 50%, 45%)",
  ];

  const handleCreate = () => {
    if (!form.title || !form.endDate) return;
    const newMarket: Market = {
      id: String(markets.length + 1),
      title: form.title,
      category: form.category,
      volume: 0,
      liquidity: 0,
      endDate: form.endDate,
      yesPrice: 0.5,
      noPrice: 0.5,
      priceHistory: [{ time: "Now", yes: 0.5 }],
      description: form.description,
      resolved: false,
      isNew: true,
    };
    setMarkets([newMarket, ...markets]);
    setForm({ title: "", category: "Crypto", endDate: "", description: "" });
    setShowCreate(false);
  };

  const handleResolve = (id: string, outcome: "yes" | "no") => {
    setMarkets(markets.map(m => (m.id === id ? { ...m, resolved: true, outcome } : m)));
  };

  const handleDelete = (id: string) => {
    setMarkets(markets.filter(m => m.id !== id));
  };

  const tabs: { id: AdminTab; label: string; icon: typeof BarChart3 }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "markets", label: "Manage Markets", icon: Activity },
    { id: "resolution", label: "Resolution", icon: Gavel },
  ];

  return (
    <section>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button
            onClick={() => {
              setTab("markets");
              setShowCreate(true);
            }}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Create Market
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
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
                  label: "Pending Resolution",
                  value: pendingResolution.length.toString(),
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
                      //formatter={(v: number) => [formatVolume(v), "Volume"]}
                    />
                    <Line type="monotone" dataKey="volume" stroke="hsl(152, 60%, 48%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-4">
                <h3 className="text-sm font-semibold mb-4">Markets by Category</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      dataKey="count"
                      strokeWidth={0}
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(220, 18%, 9%)",
                        border: "1px solid hsl(220, 14%, 14%)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      // formatter={(v: number, name: string) => [v, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
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
                    // formatter={(v: number) => [formatVolume(v), "Volume"]}
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
        )}

        {/* Markets Tab */}
        {tab === "markets" && (
          <div className="space-y-4">
            {showCreate && (
              <div className="glass-card p-6 space-y-4 animate-slide-up">
                <h3 className="font-semibold">Create New Market</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Title</label>
                    <input
                      className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Will X happen by Y?"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Category</label>
                    <select
                      className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                    >
                      {CATEGORIES.filter(c => c !== "All").map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">End Date</label>
                    <input
                      type="date"
                      className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      value={form.endDate}
                      onChange={e => setForm({ ...form, endDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Description</label>
                    <input
                      className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Resolution criteria..."
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreate} size="sm">
                    Create
                  </Button>
                  <Button onClick={() => setShowCreate(false)} variant="ghost" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            {!showCreate && (
              <Button onClick={() => setShowCreate(true)} variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> New Market
              </Button>
            )}

            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="text-left py-3 px-4 font-medium">Market</th>
                      <th className="text-center py-3 px-2 font-medium">Category</th>
                      <th className="text-right py-3 px-2 font-medium">Volume</th>
                      <th className="text-center py-3 px-2 font-medium">Status</th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {markets.map(m => (
                      <tr
                        key={m.id}
                        className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                      >
                        <td className="py-3 px-4 max-w-[300px] truncate">{m.title}</td>
                        <td className="py-3 px-2 text-center">
                          <Badge variant="secondary" className="text-xs">
                            {m.category}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-xs">{formatVolume(m.volume)}</td>
                        <td className="py-3 px-2 text-center">
                          {m.resolved ? (
                            <span className="inline-flex items-center gap-1 text-xs text-primary">
                              <CheckCircle className="h-3 w-3" /> Resolved
                            </span>
                          ) : new Date(m.endDate) <= new Date() ? (
                            <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
                              <AlertTriangle className="h-3 w-3" /> Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" /> Active
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!m.resolved && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-primary"
                                  onClick={() => handleResolve(m.id, "yes")}
                                >
                                  Resolve Yes
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-destructive"
                                  onClick={() => handleResolve(m.id, "no")}
                                >
                                  Resolve No
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => handleDelete(m.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Resolution Tab */}
        {tab === "resolution" && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4 mb-2">
              <div className="glass-card p-4">
                <div className="stat-label">Resolved</div>
                <div className="stat-value mt-1 text-primary">{resolvedMarkets.length}</div>
              </div>
              <div className="glass-card p-4">
                <div className="stat-label">Pending Resolution</div>
                <div className="stat-value mt-1 text-yellow-400">{pendingResolution.length}</div>
              </div>
              <div className="glass-card p-4">
                <div className="stat-label">Active</div>
                <div className="stat-value mt-1">{activeMarkets.length - pendingResolution.length}</div>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-muted-foreground">Markets Awaiting Resolution</h3>
            {pendingResolution.length === 0 ? (
              <div className="glass-card p-8 text-center text-muted-foreground text-sm">
                No markets currently pending resolution.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingResolution.map(m => (
                  <div key={m.id} className="glass-card p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{m.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Ended {m.endDate} · {formatVolume(m.volume)} volume
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-8 text-xs" onClick={() => handleResolve(m.id, "yes")}>
                        Resolve YES
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 text-xs"
                        onClick={() => handleResolve(m.id, "no")}
                      >
                        Resolve NO
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h3 className="text-sm font-semibold text-muted-foreground mt-6">Recently Resolved</h3>
            <div className="space-y-3">
              {resolvedMarkets.map(m => (
                <div key={m.id} className="glass-card p-4 flex items-center justify-between gap-4 opacity-80">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{m.title}</div>
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
        )}
      </div>
    </section>
  );
};

export default AdminPortal;
