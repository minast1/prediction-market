import { useScaffoldReadContract } from "./scaffold-eth";

const useTransformedMarketData = () => {
  const queryInfo = useScaffoldReadContract({
    contractName: "PredictionMarket",
    functionName: "getAllMarkets",
  });

  return {
    ...queryInfo,
    data: queryInfo.data?.map((market, idx) => {
      return {
        category: market.category,
        title: market.question,
        id: String(idx + 1),
        outcome: market.outcome,
        status: market.status,
        endDate: market.marketClose,
        settledAt: market.settledAt,
        volume: market.yesShares + market.noShares,
        criteria: market.criteria,
      };
    }),
  };
};

export default useTransformedMarketData;
