import React, { useState } from "react";
import { Bot, Loader2 } from "lucide-react";
import { Button } from "~~/components/ui/button";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { Market } from "~~/types/market";

const AiSettlementButton = ({ market }: { market: Market }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { writeContractAsync, isMining } = useScaffoldWriteContract({ contractName: "PredictionMarket" });

  return (
    <Button
      size="sm"
      id={`resolve-${market.id}`}
      variant="outline"
      className="h-7 text-xs gap-1.5 hover:cursor-pointer border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
      onClick={async () => {
        setIsLoading(true);
        try {
          const req = await fetch("/api/resolve", {
            method: "POST",
            body: JSON.stringify({
              prompt: market.title,
            }),
          });

          const res = await req.json();
          const output = res.output.result;
          const parsedOutput = output === "YES" ? 2 : output === "NO" ? 1 : 3;
          await writeContractAsync(
            {
              functionName: "settleMarket",
              args: [BigInt(market.id), parsedOutput, res.output.confidence, "eventUri"],
            },
            {
              onBlockConfirmation: () => {
                setIsLoading(false);
              },
            },
          );
        } catch (error) {
          console.log(error);
          setIsLoading(false);
        }
      }}
    >
      {isLoading || isMining ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <>
          <Bot className="h-3 w-3" /> Request Settlement
        </>
      )}
    </Button>
  );
};

export default AiSettlementButton;
