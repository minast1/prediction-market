"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Droplets } from "lucide-react";
//import { useWatchBalance } from "@scaffold-ui/hooks";
import { createWalletClient, http, parseEther } from "viem";
import { hardhat } from "viem/chains";
import { useAccount } from "wagmi";
import { useTransactor } from "~~/hooks/scaffold-eth";

// Number of ETH faucet sends to an address
const NUM_OF_ETH = "1";
const FAUCET_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

const localWalletClient = createWalletClient({
  chain: hardhat,
  transport: http(),
});

/**
 * FaucetButton button which lets you grab eth.
 */
export const FaucetButton = () => {
  const { address, chain: ConnectedChain } = useAccount();

  // const { data: balance } = useWatchBalance({ address, chain: hardhat });

  const [loading, setLoading] = useState(false);

  const faucetTxn = useTransactor(localWalletClient);

  const sendETH = async () => {
    if (!address) return;
    try {
      setLoading(true);
      await faucetTxn({
        account: FAUCET_ADDRESS,
        to: address,
        value: parseEther(NUM_OF_ETH),
      });
      setLoading(false);
    } catch (error) {
      console.error("⚡️ ~ file: FaucetButton.tsx:sendETH ~ error", error);
      setLoading(false);
    }
  };

  // Render only on local chain
  if (ConnectedChain?.id !== hardhat.id) {
    return null;
  }

  //const isBalanceZero = balance && balance.value === 0n;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={sendETH}
          disabled={loading}
          variant="outline"
          size="sm"
          className="border-accent/50 hover:bg-accent/20 hover:border-accent"
        >
          {!loading ? <Droplets className="h-4 w-4 mr-1 text-accent" /> : <Spinner />}
          <span className="hidden sm:inline">Faucet</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Grab funds from faucet</p>
      </TooltipContent>
    </Tooltip>
  );
};
