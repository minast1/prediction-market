import { useMemo } from "react";
import { useScaffoldContract, useScaffoldReadContract } from "./scaffold-eth";
import { formatEther } from "viem";
import { UseReadContractsReturnType, useAccount, useReadContracts, useWatchContractEvent } from "wagmi";
import { calculateCurrentPrice, calculatePotentialPayout } from "~~/lib/markets";

const useUserActivePositions = () => {
  const { address } = useAccount();
  const { data: predictionMarket } = useScaffoldContract({ contractName: "PredictionMarket" });
  const { data: activeIds, isLoading: isLoadingIds } = useScaffoldReadContract({
    contractName: "PredictionMarket",
    functionName: "getUserActiveMarketIds",
    args: [address],
    query: {
      enabled: !!address,
    },
  });

  const calls = useMemo(() => {
    if (!activeIds || !predictionMarket || !address) return [];
    return activeIds.flatMap(id => [
      {
        address: predictionMarket.address,
        abi: predictionMarket.abi,
        functionName: "getUserPredictions",
        args: [id, address],
      },
      {
        address: predictionMarket.address,
        abi: predictionMarket.abi,
        functionName: "getMarketInfo",
        args: [id],
      },
    ]);
  }, [activeIds, predictionMarket, address]);

  const {
    data: results,
    isLoading: isLoadingDetails,
    refetch,
  } = useReadContracts<UseReadContractsReturnType[]>({
    contracts: calls,
    query: {
      enabled: calls.length > 0,
    },
  });

  const activePositions = useMemo(() => {
    if (!results || !activeIds) return [];

    const formatted = [];
    for (let i = 0; i < activeIds.length; i++) {
      const prediction = results[i * 2]?.result as any;
      const market = results[i * 2 + 1]?.result as any;
      if (prediction && market) {
        const isYes = prediction.lastSide === 2;
        const initialStake = isYes ? prediction.yesAmount : prediction.noAmount;

        const { yes: yesPrice, no: noPrice } = calculateCurrentPrice(market);
        const currentPrice = isYes ? yesPrice : noPrice;
        //const currentValue = calculateInstantValue(market, isYes, initialStake);

        const pnl = parseFloat(calculatePotentialPayout(initialStake, prediction.lastSide, market));
        const roi = initialStake > 0n ? (pnl / parseFloat(formatEther(initialStake))) * 100 : 0;
        formatted.push({
          id: activeIds[i],
          question: market.question,
          side: prediction.lastSide,
          staked: prediction.lastSide === 2 ? prediction.yesAmount : prediction.noAmount,
          closing: market.marketClose,
          is_resolved: market.status === 3,
          is_open: market.marketClose < BigInt(Math.floor(Date.now() / 1000)),
          open: prediction.lastUpdated,
          current_price: currentPrice,
          market_outcome: market.outcome,
          pnl,
          roi,
        });
      }
    }
    return formatted;
  }, [results, activeIds]);

  const winStats = useMemo(() => {
    if (!activePositions.length) return { correct: 0, wrong: 0, pending: 0 };
    const initial = { correct: 0, wrong: 0, pending: 0 };
    const counts = activePositions.reduce((acc, pos) => {
      const { side, market_outcome, is_resolved } = pos;
      // 1. Pending (Market not yet settled)
      if (!is_resolved) {
        acc.pending += 1;
      }
      //2. Settled - Check if the user was wrong
      if (is_resolved && market_outcome !== side) {
        acc.wrong += 1;
      }
      return acc;
    }, initial);

    return counts;
  }, [activePositions]);

  const portfolioStats = useMemo(() => {
    if (!activePositions.length) return { totalPnl: 0n, avgRoi: 0, totalStake: 0n };

    const totals = activePositions.reduce(
      (acc, pos) => ({
        totalPnl: acc.totalPnl + pos.pnl,
        totalStake: acc.totalStake + pos.staked,
      }),
      { totalPnl: 0, totalStake: 0n },
    );
    const avgRoi = (totals.totalPnl / parseFloat(formatEther(totals.totalStake))) * 100;
    return { totalPnl: totals.totalPnl, avgRoi, totalStake: totals.totalStake };
  }, [activePositions]);

  useWatchContractEvent({
    address: predictionMarket?.address,
    abi: predictionMarket?.abi,
    eventName: "PriceUpdated",
    //fromBlock: 0n,
    //fromBlock: BigInt(process.env.NEXT_PUBLIC_DEPLOYMENT_BLOCK || 0),
    onLogs: log => {
      console.log(log);
      refetch();
    },
  });
  return {
    activePositions,
    stats: portfolioStats,
    isLoading: isLoadingIds || isLoadingDetails,
    winStats,
  };
};

export default useUserActivePositions;
