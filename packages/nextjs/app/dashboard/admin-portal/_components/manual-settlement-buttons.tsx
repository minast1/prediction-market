import React from "react";
import { Button } from "~~/components/ui/button";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { Market } from "~~/types/market";

const ManualSettlementButton = ({ market }: { market: Market }) => {
  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "PredictionMarket",
  });
  return (
    <>
      <Button
        id={`resolve-yes${market.id}`}
        size="sm"
        variant="ghost"
        className="h-7 text-xs text-primary"
        onClick={async () => {
          await writeContractAsync({
            functionName: "settleMarketManually",
            args: [BigInt(market.id), 2],
          });
        }}
      >
        Yes
      </Button>
      <Button
        id={`resolve-no${market.id}`}
        size="sm"
        variant="ghost"
        className="h-7 text-xs text-destructive"
        onClick={async () => {
          await writeContractAsync({
            functionName: "settleMarketManually",
            args: [BigInt(market.id), 1],
          });
        }}
      >
        No
      </Button>
    </>
  );
};

export default ManualSettlementButton;
