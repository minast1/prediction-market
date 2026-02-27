import React, { useState } from "react";
import { useFetchNativeCurrencyPrice, useWatchBalance } from "@scaffold-ui/hooks";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useMarketPriceHistory } from "~~/hooks/useMarketPriceHistory";
import { calculatePotentialPayout } from "~~/lib/markets";

interface TradePanelProps {
  market:
    | {
        question: string;
        marketOpen: bigint;
        marketClose: bigint;
        category: number;
        outcome: number;
        id: bigint;
        status: number;
        settledAt: bigint;
        confidenceBps: number;
        yesShares: bigint;
        noShares: bigint;
        criteria: string;
        liquidity: bigint;
        resolutionChannel: number;
        totalParticipants: bigint;
      }
    | undefined;
}
const TradePanel = ({ market }: TradePanelProps) => {
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const { address } = useAccount();
  const { data: balance } = useWatchBalance({ address });
  const { data: userPredictions } = useScaffoldReadContract({
    contractName: "PredictionMarket",
    functionName: "getUserPredictions",
    args: [market?.id],
    query: {
      enabled: !!market,
    },
  });

  const isOverBalance = amount && balance ? parseEther(amount) >= balance.value : false;
  //const hasPartaken = userPredictions?.lastUpdated !== BigInt(0);
  const hasShares = userPredictions?.yesAmount !== BigInt(0);
  //const claimed = userPredictions?.claimed === true;
  const { data: contract } = useScaffoldContract({
    contractName: "PredictionMarket",
  });
  const { price: ethPrice } = useFetchNativeCurrencyPrice();
  const { currentPrice } = useMarketPriceHistory(market?.id, contract?.address, contract?.abi);

  const potentialReturn = !market
    ? 0
    : Number(calculatePotentialPayout(parseEther(amount), side === "yes" ? 1 : 0, market));
  const { writeContractAsync: writeAsync } = useScaffoldWriteContract({ contractName: "PredictionMarket" });

  const handleTrade = async () => {
    const amountWei = parseEther(amount);
    const sideInt = side === "yes" ? true : false;
    if (!market) return;
    if (tab === "buy") {
      await writeAsync({
        functionName: "buy",
        args: [BigInt(market?.id), sideInt, BigInt(currentPrice)],
        value: amountWei,
      });
    } else {
      await writeAsync({
        functionName: "sell",
        args: [BigInt(market.id), sideInt, amountWei, BigInt(potentialReturn)],
      });
    }
  };
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
          disabled={!hasShares}
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
          // disabled={isOverBalance}
          className={`flex-1 rounded-md py-2.5 text-sm font-semibold transition-all ${
            side === "yes"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Yes {/* Yes  {formatPrice(market.yesPrice)} */}
        </button>
        <button
          onClick={() => setSide("no")}
          // disabled={isOverBalance}
          className={`flex-1 rounded-md py-2.5 text-sm font-semibold transition-all ${
            side === "no" ? "bg-no text-no-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          No{/* No {formatPrice(market.noPrice)} */}
        </button>
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1.5">Amount (ETH)</label>
        <input
          // ariaInvalid={isOverBalance}
          placeholder="0.00"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className={`w-full rounded-lg border bg-secondary px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 ${
            isOverBalance
              ? "border-destructive focus:ring-destructive text-destructive"
              : "border-border focus:ring-primary"
          }`}
        />
        {isOverBalance && <p className="mt-1 text-[10px] text-destructive">Insufficient balance</p>}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Price</span>
          <span className="font-mono">{(Number(currentPrice) * ethPrice).toFixed(2)}</span>
        </div>
        {/* <div className="flex justify-between text-muted-foreground">
          <span>Shares</span>
          <span className="font-mono">{shares > 0 ? shares.toFixed(2) : "—"}</span>
        </div> */}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Potential return</span>
          <span className="font-mono text-primary font-semibold">
            {potentialReturn > 0 ? `+$${(ethPrice * potentialReturn).toFixed(2)}` : "—"}
          </span>
        </div>
      </div>

      <button
        disabled={!amount || market?.status === 3 || isOverBalance}
        onClick={handleTrade}
        className={`w-full rounded-lg py-3 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          side === "yes"
            ? "bg-primary text-primary-foreground hover:brightness-110"
            : "bg-no text-no-foreground hover:brightness-110"
        }`}
      >
        {market?.status === 3
          ? "Market Resolved"
          : `${tab === "buy" ? "Buy" : "Sell"} ${side === "yes" ? "Yes" : "No"}`}
      </button>
    </div>
  );
};

export default TradePanel;
