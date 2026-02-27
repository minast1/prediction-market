import { useMemo } from "react";
import { useFetchNativeCurrencyPrice } from "@scaffold-ui/hooks";
import { formatEther } from "viem";
import { getTrendingScore } from "~~/lib/markets";
import { Market } from "~~/types/market";

const useMarketStats = (markets: Market[] | undefined) => {
  const { price: nativeCurrencyPrice } = useFetchNativeCurrencyPrice();

  return useMemo(() => {
    if (!markets || !nativeCurrencyPrice)
      return {
        stats: {
          active: [],
          resolved: [],
          manualResolved: [],
          inconclusive: [],
          pending: [],
          aiResolved: [],
        },
        totalVolumeUSD: "0.00",
        totalLiquidityUSD: "0.00",
      };
    const now = BigInt(Math.floor(Date.now() / 1000));
    const active = markets.filter(m => m.endDate > now);
    const resolved = markets.filter(m => m.status === 3);
    const inconclusive = markets.filter(m => m.outcome === 3);
    const pending = markets.filter(m => now > m.endDate && m.status === 0);
    const aiResolved = markets.filter(m => m.resolution_type === 2);
    const manualResolved = markets.filter(m => m.resolution_type === 1);

    const totalScore = active.reduce((acc, m) => acc + getTrendingScore(m), 0n);
    const trending = active.filter(m => {
      const currentScore = getTrendingScore(m);
      const avgScore = totalScore / BigInt(active.length || 1);
      return currentScore > (avgScore * 150n) / 100n;
    });

    //Volume Math
    const totalVolumeWei = markets.reduce((acc, m) => acc + (m.yesShares + m.noShares || 0n), 0n);
    const volumeEth = parseFloat(formatEther(totalVolumeWei));
    const totalVolumeUSD = nativeCurrencyPrice
      ? (volumeEth * nativeCurrencyPrice).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";

    const toatlLiquidityWei = markets.reduce((acc, m) => {
      // console.log(`Market ${index} liquidity:`, m.liquidity?.toString());
      return acc + (m.liquidity || 0n);
    }, 0n);
    const liquidityEth = parseFloat(formatEther(toatlLiquidityWei));
    const totalLiquidityUSD = nativeCurrencyPrice
      ? (nativeCurrencyPrice * liquidityEth).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";

    return {
      activeMarkets: active,
      resolvedMarkets: resolved,
      inconclusiveMarkets: inconclusive,
      manualResolvedMarkets: manualResolved,
      pendingMarkets: pending,
      aiResolvedMarkets: aiResolved,
      trendingMarkets: trending,
      totalVolumeUSD,
      totalLiquidityUSD,
    };
  }, [markets, nativeCurrencyPrice]);
};

export default useMarketStats;
