import React from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Droplets } from "lucide-react";

const TestnetFaucetButton = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="hidden sm:flex border-border-accent/50 hover:bg-accent/20 hover:border-accent"
        >
          <Link href="https://console.optimism.io/faucet">
            <Droplets className="h-4 w-4 mr-1 text-accent" />
            <span className="hidden sm:inline">Faucet</span>
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Grab funds from faucet</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default TestnetFaucetButton;
