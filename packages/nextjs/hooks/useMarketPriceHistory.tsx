import { useMemo } from "react";
import { useScaffoldReadContract } from "./scaffold-eth";
import { useQuery } from "@tanstack/react-query";
import { Abi, decodeEventLog, parseAbiItem } from "viem";
import { usePublicClient, useWatchContractEvent } from "wagmi";
import { queryClient } from "~~/components/ScaffoldEthAppWithProviders";

const PRICEACTION_ABI = parseAbiItem(
  `event PriceAction( uint256 indexed id, address indexed user, bool outcome, uint256 amount, uint256 timeStamp )`,
);

interface PriceActionArgs {
  id: bigint;
  user: `0x${string}`;
  outcome: boolean;
  amount: bigint;
  timeStamp: bigint;
}

export const useMarketPriceHistory = (
  marketId: bigint | undefined,
  contractAddress: `0x${string}` | undefined,
  contractAbi: Abi | undefined,
) => {
  const publicClient = usePublicClient();
  const isReady = !!marketId && !!publicClient && !!contractAddress && !!contractAbi;

  // 1. Fetch CURRENT state for the latest "live" price
  const { data: market, refetch: refetchMarket } = useScaffoldReadContract({
    contractName: "PredictionMarket",
    functionName: "getMarketInfo",
    args: [marketId],
    query: { enabled: isReady },
  });
  const queryKey = ["marketPriceHistory", marketId?.toString(), contractAddress];
  // 2. Fetch Historical Logs for the Chart
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["marketPriceHistory", marketId?.toString(), contractAddress],
    enabled: isReady,
    staleTime: 60000, // Data stays fresh for 60 seconds
    // gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    queryFn: async () => {
      if (!marketId || !contractAddress || !publicClient) return [];
      const logs = await publicClient!.getLogs({
        address: contractAddress,
        event: PRICEACTION_ABI,
        args: { id: marketId },
        fromBlock: BigInt(process.env.NEXT_PUBLIC_DEPLOYMENT_BLOCK || 0), //use deployment block as fromBlock
      });

      return logs
        .map(log => {
          try {
            const decoded = decodeEventLog({
              abi: contractAbi!,
              data: log.data,
              topics: log.topics,
            });
            return { ...log, decoded };
          } catch (e) {
            console.log(e);
            return null;
          }
        })
        .filter((log): log is Extract<typeof log, { decoded: { args: any } }> => log !== null)
        .sort((a, b) => {
          const argsA = a.decoded.args as unknown as PriceActionArgs;
          const argsB = b.decoded.args as unknown as PriceActionArgs;
          return Number(argsB.timeStamp - argsA.timeStamp);
        });
    },
  });

  // 3. Sync real-time updates
  useWatchContractEvent({
    address: contractAddress,
    abi: contractAbi,
    eventName: "PriceAction",
    //fromBlock: BigInt(process.env.NEXT_PUBLIC_DEPLOYMENT_BLOCK || 0),
    onLogs: newLogs => {
      // Optimistically update the query cache instead of a full refetch
      queryClient.setQueryData(queryKey, (old: any[] = []) => {
        const enriched = newLogs.map(log => ({
          ...log,
          decoded: decodeEventLog({ abi: contractAbi!, data: log.data, topics: log.topics }),
        }));
        return [...old, ...enriched];
      });
      refetchMarket(); // Refresh the on-chain share counts for current price
    },
  });

  // 4. Calculate Chart Data
  // 4. Calculate Chart Data using LMSR
  const { chartData, currentPrice, yesPrice, noPrice } = useMemo(() => {
    if (!market || !events.length) return { chartData: [], currentPrice: "0.50", yesPrice: "0.50", noPrice: "0.50" };

    // Index 6 in your struct is liquidity (b)
    const { yesShares, noShares, liquidity } = market;
    const b = Number(liquidity);

    // Live Price Calculation
    const curExpYes = yesShares === 0n ? 0.5 : Math.exp(Number(yesShares) / b);
    const curExpNo = noShares === 0n ? 0.5 : Math.exp(Number(noShares) / b);
    const totalExp = curExpYes + curExpNo;

    const livePrice = (curExpYes / totalExp).toFixed(4);
    const liveYesPrice = (curExpYes / totalExp).toFixed(4);
    const liveNoPrice = (curExpNo / totalExp).toFixed(4);

    // Reconstruct Price History
    let runningYes = 0n;
    let runningNo = 0n;

    const data = events.map(event => {
      const { outcome, amount, timeStamp } = event.decoded.args as any;

      if (outcome) runningYes += amount;
      else runningNo += amount;

      const p = Math.exp(Number(runningYes) / b) / (Math.exp(Number(runningYes) / b) + Math.exp(Number(runningNo) / b));

      return {
        date: new Date(Number(timeStamp) * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        price: Number(p.toFixed(4)),
        fullDate: new Date(Number(timeStamp) * 1000).toLocaleString(),
      };
    });

    return { chartData: data, currentPrice: livePrice, yesPrice: liveYesPrice, noPrice: liveNoPrice };
  }, [events, market]);

  return { chartData, currentPrice, isLoading, yesPrice, noPrice };
};
