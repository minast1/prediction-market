import { useQuery } from "@tanstack/react-query";
import { Abi, formatUnits, parseAbiItem } from "viem";
import { usePublicClient, useWatchContractEvent } from "wagmi";

const PRICEACTION_ABI = parseAbiItem(
  `event PriceUpdated(uint256 indexed id, address indexed user, bool outcome, uint256 amount, uint256 yesPrice, uint256 noPrice, uint256 timeStamp)`,
);

// interface PriceActionArgs {
//   id: bigint;
//   user: `0x${string}`;
//   outcome: boolean;
//   amount: bigint;
//   timeStamp: bigint;
// }

export const useMarketPriceHistory = (
  marketId: bigint | undefined,
  contractAddress: `0x${string}` | undefined,
  contractAbi: Abi | undefined,
  ethPrice: number | undefined,
) => {
  const publicClient = usePublicClient();
  const isReady = !!marketId && !!publicClient && !!contractAddress && !!contractAbi && !!ethPrice;

  // const queryKey = ["marketPriceHistory", marketId?.toString(), contractAddress];
  // 2. Fetch Historical Logs for the Chart
  const {
    data: chartData = [],
    isLoading,
    refetch: refetchMarket,
  } = useQuery({
    queryKey: ["marketPriceHistory", marketId?.toString(), contractAddress, publicClient, contractAbi, ethPrice],
    enabled: isReady,
    //staleTime: 60000, // Data stays fresh for 60 seconds
    // gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    queryFn: async () => {
      if (!marketId || !contractAddress || !publicClient) return [];
      const logs = await publicClient!.getLogs({
        address: contractAddress,
        event: PRICEACTION_ABI,
        args: { id: marketId },
        fromBlock: BigInt(process.env.NEXT_PUBLIC_DEPLOYMENT_BLOCK || 0), //use deployment block as fromBlock
      });
      console.log({ logs });
      const mappedLogs = logs
        .map(log => {
          const { yesPrice, noPrice, timeStamp } = log.args;
          // Convert WAD (18 decimals) to a 0-1 decimal number
          const yPrice = parseFloat(formatUnits(yesPrice!, 18));
          const nPrice = parseFloat(formatUnits(noPrice!, 18));
          return {
            time: new Date(Number(timeStamp) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            yes: yPrice * ethPrice!,
            no: nPrice * ethPrice!,
            yesProb: (yPrice * 100).toFixed(1) + "%",
          };
        })
        .sort((a, b) => Number(a.time) - Number(b.time));

      const startingPoint = {
        time: "Start",
        yes: 0.5 * ethPrice!,
        no: 0.5 * ethPrice!,
        yesProb: "50.0%",
      };
      return [startingPoint, ...mappedLogs];
    },
  });

  // // 3. Sync real-time updates
  useWatchContractEvent({
    address: contractAddress,
    abi: contractAbi,
    eventName: "PriceUpdated",
    fromBlock: 0n,
    //fromBlock: BigInt(process.env.NEXT_PUBLIC_DEPLOYMENT_BLOCK || 0),
    onLogs: log => {
      console.log(log);
      // Optimistically update the query cache instead of a full refetch
      // queryClient.setQueryData(queryKey, (old: any[] = []) => {
      //   const enriched = newLogs.map(log => ({
      //     ...log,
      //     decoded: decodeEventLog({ abi: contractAbi!, data: log.data, topics: log.topics }),
      //   }));
      //   return [...old, ...enriched];
      // });
      refetchMarket(); // Refresh the on-chain share counts for current price
    },
  });

  return { chartData, isLoading };
};
