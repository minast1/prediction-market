import { useScaffoldReadContract } from "./scaffold-eth";

const useTransformedMarketData = () => {
  const queryInfo = useScaffoldReadContract({
    contractName: "PredictionMarket",
    functionName: "getAllMarkets",
  });

  return {
    ...queryInfo,
    data: queryInfo.data?.map(market => {
      return {
        category: market.category,
        title: market.question,
        id: String(Number(market.id)),
        outcome: market.outcome,
        status: market.status,
        endDate: market.marketClose,
        openDate: market.marketOpen,
        settledAt: market.settledAt,
        volume: market.yesShares + market.noShares,
        criteria: market.criteria,
        liquidity: market.liquidity,
        yesShares: market.yesShares,
        noShares: market.noShares,
        resolution_type: market.resolutionChannel,
        active_predictions: market.totalParticipants,
      };
    }),
  };
};

export default useTransformedMarketData;
