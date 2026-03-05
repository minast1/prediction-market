import React, { useState } from "react";
import { useFetchNativeCurrencyPrice, useWatchBalance } from "@scaffold-ui/hooks";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { Alert, AlertDescription } from "~~/components/ui/alert";
import { Button } from "~~/components/ui/button";
import { Spinner } from "~~/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "~~/components/ui/tooltip";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import useCalculateSellPayout from "~~/hooks/useCalculateSellPayout";
import { calculatePotentialPayout, formatPrice, isNumericStrict } from "~~/lib/markets";
import { MarketsReturnType } from "~~/types/market";

interface TradePanelProps {
  market: MarketsReturnType | undefined;
}
const TradePanel = ({ market }: TradePanelProps) => {
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const { address } = useAccount();
  const { data: balance } = useWatchBalance({ address });

  const { data: currentPrice } = useScaffoldReadContract({
    contractName: "PredictionMarket",
    functionName: "getPrices",
    args: [BigInt(market!.id)],
    query: {
      enabled: !!market,
    },
  });

  const yesPrice = currentPrice ? currentPrice[0] : 0n;
  const noPrice = currentPrice ? currentPrice[1] : 0n;

  const { data: userPredictions } = useScaffoldReadContract({
    contractName: "PredictionMarket",
    functionName: "getUserPredictions",
    args: [BigInt(market!.id), address],
    query: {
      enabled: !!market,
    },
  });

  const { minPayout } = useCalculateSellPayout(market, side === "yes" ? true : false, parseEther(amount));
  const isOverBalance = amount && balance ? parseEther(amount) >= balance.value : false;
  const isOverYesPoolSize =
    tab === "sell" && userPredictions && parseEther(amount) > userPredictions.yesAmount && side === "yes";
  const isOverNoPoolSize =
    tab === "sell" && userPredictions && parseEther(amount) > userPredictions.noAmount && side === "no";
  //const hasPartaken = userPredictions?.lastUpdated !== BigInt(0);
  const hasShares = userPredictions?.lastUpdated !== 0n;

  ///sconsole.log({ isOverYesPoolSize, isOverNoPoolSize });
  const { price: ethPrice } = useFetchNativeCurrencyPrice();
  const now = BigInt(Math.floor(Date.now() / 1000));
  const isClosed = market && now > market.marketClose;
  const potentialReturn = !market
    ? 0
    : Number(calculatePotentialPayout(parseEther(amount), side === "yes" ? 1 : 0, market));
  const { writeContractAsync: writeAsync, isMining } = useScaffoldWriteContract({ contractName: "PredictionMarket" });

  const handleTrade = async () => {
    setIsLoading(true);
    const amountWei = parseEther(amount);
    const sideInt = side === "yes" ? true : false;
    if (!market) return;
    if (tab === "buy") {
      await writeAsync(
        {
          functionName: "buy",
          args: [BigInt(market?.id), sideInt],
          value: amountWei,
        },
        {
          onBlockConfirmation: () => {
            setIsLoading(false);
            setAmount("");
          },
        },
      );
    } else {
      await writeAsync(
        {
          functionName: "sell",
          args: [BigInt(market.id), sideInt, amountWei, minPayout],
        },
        {
          onBlockConfirmation: () => {
            setIsLoading(false);
            setAmount("");
            setTab("buy");
          },
        },
      );
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
        <Tooltip>
          <TooltipTrigger asChild>
            {/* <span className="inline-block w-fit"> */}
            <button
              disabled={!hasShares}
              onClick={() => setTab("sell")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                tab === "sell" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Sell
            </button>
            {/* </span> */}
          </TooltipTrigger>
          {!hasShares && (
            <TooltipContent>You don&apos;t have any shares to sell. Please buy some first.</TooltipContent>
          )}
        </Tooltip>
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
          onChange={e => {
            // console.log(isNumericStrict(e.target.value));
            if (!isNumericStrict(e.target.value)) return;
            setAmount(e.target.value);
          }}
          className={`w-full rounded-lg border bg-secondary px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 ${
            isOverBalance || isOverYesPoolSize || isOverNoPoolSize
              ? "border-destructive focus:ring-destructive text-destructive"
              : "border-border focus:ring-primary"
          }`}
        />
        {isOverBalance ? (
          <p className="mt-1 text-xs text-destructive">Insufficient balance</p>
        ) : isOverYesPoolSize && side === "yes" ? (
          <p className="mt-1 text-[10px] text-destructive">
            Insufficient Pool Depth: Trying to sell {Number(amount).toFixed(2)} shares but only{" "}
            {formatEther(userPredictions.yesAmount)} available.
          </p>
        ) : isOverNoPoolSize && side === "no" ? (
          <p className="mt-1 text-[11px] text-destructive">
            Insufficient Pool Depth: Trying to sell {Number(amount).toFixed(2)} shares but only{" "}
            {formatEther(userPredictions.noAmount)} available.
          </p>
        ) : null}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Price</span>
          <span className="font-mono">
            {side === "yes" ? formatPrice(yesPrice, ethPrice) : side === "no" ? formatPrice(noPrice, ethPrice) : "—"}
          </span>
        </div>
        {/* <div className="flex justify-between text-muted-foreground">
          <span>Shares</span>
          <span className="font-mono">{shares > 0 ? shares.toFixed(2) : "—"}</span>
        </div> */}
        <div className="flex justify-between">
          <span className="text-muted-foreground">{tab === "sell" ? "Minimum payout" : "Potential return"}</span>
          <span className="font-mono text-primary font-semibold">
            {potentialReturn > 0 && tab === "buy"
              ? `+$${(ethPrice * potentialReturn).toFixed(2)}`
              : tab === "sell"
                ? `-$${formatPrice(minPayout, ethPrice)}`
                : "—"}
          </span>
        </div>
      </div>

      <Button
        disabled={!amount || isClosed || market?.status === 3 || isOverBalance}
        onClick={handleTrade}
        className={`w-full rounded-lg py-3 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          side === "yes"
            ? "bg-primary text-primary-foreground hover:brightness-110"
            : "bg-no text-no-foreground hover:brightness-110 hover:bg-no"
        }`}
      >
        {isLoading || isMining ? (
          <>
            Loading..
            <Spinner className="mr-2" />
          </>
        ) : market?.status === 3 ? (
          "Resolved"
        ) : isClosed ? (
          "Market Closed"
        ) : (
          `${tab === "buy" ? "Buy" : "Sell"} ${side === "yes" ? "Yes" : "No"}`
        )}
      </Button>

      <Alert className="border-primary/20 bg-primary/5 mt-10">
        {/* <div className="flex items-start gap-3"> */}
        {/* <InfoIcon className="w-4 h-4 mt-0.5 text-primary" /> */}
        <AlertDescription className="text-xs leading-relaxed text-muted-foreground space-y-3">
          <p>
            <strong className="text-foreground block mb-0.5 underline decoration-primary/30">
              📈 Probability Pricing
            </strong>
            A &quot;Yes&quot; price of <span className="text-success font-mono">62%</span> reflects the current market
            sentiment. Your trade moves this price instantly based on the <strong>LMSR Liquidity Curve</strong>.
          </p>

          <p>
            <strong className="text-foreground block mb-0.5 underline decoration-primary/30">
              🥊 Zero-Sum Mechanics
            </strong>
            Profits are <strong>non-fixed</strong>. If you win, you claim your stake back plus a proportional slice of
            the opposing pool. You earn the highest ROI when you are{" "}
            <span className="text-primary font-bold">Right and Alone</span>.
          </p>

          <p>
            <strong className="text-foreground block mb-0.5 underline decoration-primary/30">
              ⚡ Instant Exit & Slippage
            </strong>
            You can sell anytime. Note that large trades relative to{" "}
            <strong>{formatEther(market?.liquidity as bigint)} ETH</strong> liquidity will incur higher slippage (the
            AMM spread).
          </p>
        </AlertDescription>
        {/* </div> */}
      </Alert>
    </div>
  );
};

export default TradePanel;
