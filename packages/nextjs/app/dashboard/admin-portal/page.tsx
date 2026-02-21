"use client";

import { useState } from "react";
import AdminSkeleton from "./_components/admin-skeleton";
import NewMarketDialog from "./_components/new-market";
import MarketsTab from "./_components/tabs/markets";
import OverviewTab from "./_components/tabs/overview";
import { Activity, BarChart3 } from "lucide-react";
import { NextPage } from "next";
import useTransformedMarketData from "~~/hooks/useTransformedMarketData";

type AdminTab = "overview" | "markets";

const tabs: { id: AdminTab; label: string; icon: typeof BarChart3 }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "markets", label: "Manage Markets", icon: Activity },
];
const AdminPortal: NextPage = () => {
  const [tab, setTab] = useState<AdminTab>("overview");
  // const [markets] = useState<Market[]>(MOCK_MARKETS);
  const { data: markets, isLoading: isLoadingMarkets } = useTransformedMarketData();

  if (isLoadingMarkets && !markets) {
    return <AdminSkeleton />;
  }
  return (
    <section>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <NewMarketDialog />
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
        {tab === "overview" && <OverviewTab markets={markets as any[]} />}

        {/* Resolution Tab */}
        {tab === "markets" && <MarketsTab markets={markets as any[]} isLoadingTableData={isLoadingMarkets} />}
      </div>
    </section>
  );
};

export default AdminPortal;
