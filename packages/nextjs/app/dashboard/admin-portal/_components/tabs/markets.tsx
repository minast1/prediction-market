import React from "react";
import AdminTableSkeleton from "../../admin-table-skeleton";
import MarketTable from "../../markets-table";
import { AlertTriangle, Bot } from "lucide-react";
//import { Badge } from "~~/components/ui/badge";
//import { Button } from "~~/components/ui/button";
import { Market } from "~~/types/market";

type TProps = {
  markets: Market[];
  isLoadingTableData: boolean;
};
const MarketsTab = ({ markets, isLoadingTableData }: TProps) => {
  const resolvedMarkets = markets?.filter(m => m.status === 3);
  const inconclusiveMarkets = markets?.filter(m => m.outcome === 3);
  const aiResolvedMarkets = markets?.filter(m => m.status === 3);
  const pendingMarkets = markets
    ? markets.filter(m => {
        const now = BigInt(Math.floor(Date.now() / 1000));
        return m.endDate < now && m.outcome === 0;
      })
    : [];

  //   if (isLoading) {
  //     return <div className="min-h-screen bg-background">{/* <AdminSkeleton /> */}</div>;
  //   }
  return (
    <div className="space-y-6">
      {/* AI Resolution Explainer */}
      <div className="glass-card p-5 border border-primary/20 bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 mt-0.5">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold mb-1">AI-Powered Settlement</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Request settlement for each market individually. Gemini AI analyzes real-world data to determine the
              outcome. When results are <span className="text-yellow-400 font-medium">inconclusive</span>, the market is
              flagged for
              <span className="text-foreground font-medium"> manual resolution</span> by an admin.
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                <span className="text-muted-foreground">Awaiting Settlement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                <span className="text-muted-foreground">AI Processing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">AI Resolved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                <span className="text-muted-foreground">Inconclusive — Manual</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="stat-label">Awaiting Settlement</div>
          <div className="stat-value mt-1 text-muted-foreground">{pendingMarkets.length}</div>
        </div>
        <div className="glass-card p-4">
          <div className="stat-label">AI Resolved</div>
          <div className="stat-value mt-1 text-primary">{aiResolvedMarkets.length}</div>
        </div>
        <div className="glass-card p-4">
          <div className="stat-label flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-yellow-400" />
            Inconclusive
          </div>
          <div className="stat-value mt-1 text-yellow-400">{inconclusiveMarkets.length}</div>
        </div>
        <div className="glass-card p-4">
          <div className="stat-label">Total Resolved</div>
          <div className="stat-value mt-1">{resolvedMarkets.length}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-card overflow-hidden p-4">
          <div className="overflow-x-auto">
            {isLoadingTableData ? <AdminTableSkeleton /> : <MarketTable data={markets} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketsTab;
