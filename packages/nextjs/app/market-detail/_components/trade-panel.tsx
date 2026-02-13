import React, { useState } from "react";
import { Market, formatPrice } from "~~/lib/markets";

interface TradePanelProps {
  market: Market;
}
const TradePanel = ({ market }: TradePanelProps) => {
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");
  const [tab, setTab] = useState<"buy" | "sell">("buy");

  const price = side === "yes" ? market.yesPrice : market.noPrice;
  const shares = amount ? parseFloat(amount) / price : 0;
  const potentialReturn = shares * (1 - price);

  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex rounded-lg bg-secondary p-0.5">
        <button
          onClick={() => setTab("buy")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            tab === "buy" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setTab("sell")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            tab === "sell" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Sell
        </button>
      </div>

      <div className="flex rounded-lg bg-secondary p-0.5">
        <button
          onClick={() => setSide("yes")}
          className={`flex-1 rounded-md py-2.5 text-sm font-semibold transition-all ${
            side === "yes"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Yes {formatPrice(market.yesPrice)}
        </button>
        <button
          onClick={() => setSide("no")}
          className={`flex-1 rounded-md py-2.5 text-sm font-semibold transition-all ${
            side === "no" ? "bg-no text-no-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          No {formatPrice(market.noPrice)}
        </button>
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1.5">Amount ($)</label>
        <input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Price</span>
          <span className="font-mono">{formatPrice(price)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Shares</span>
          <span className="font-mono">{shares > 0 ? shares.toFixed(2) : "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Potential return</span>
          <span className="font-mono text-primary font-semibold">
            {potentialReturn > 0 ? `+$${potentialReturn.toFixed(2)}` : "—"}
          </span>
        </div>
      </div>

      <button
        disabled={!amount || market.resolved}
        className={`w-full rounded-lg py-3 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          side === "yes"
            ? "bg-primary text-primary-foreground hover:brightness-110"
            : "bg-no text-no-foreground hover:brightness-110"
        }`}
      >
        {market.resolved ? "Market Resolved" : `${tab === "buy" ? "Buy" : "Sell"} ${side === "yes" ? "Yes" : "No"}`}
      </button>
    </div>
  );
};

export default TradePanel;
