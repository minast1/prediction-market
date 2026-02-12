"use client";

// @refresh reset
//import { Balance } from "../Balance";
import { AddressInfoDropdown } from "./AddressInfoDropdown";
//import { AddressQRCodeModal } from "./AddressQRCodeModal";
//import { RevealBurnerPKModal } from "./RevealBurnerPKModal";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Globe } from "lucide-react";
//import { Balance } from "@scaffold-ui/components";
import { Address } from "viem";
import { Button } from "~~/components/ui/button";
//import { useNetworkColor } from "~~/hooks/scaffold-eth";
//import { useNetworkColor } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";

/**
 * Custom Wagmi Connect Button (watch balance + custom design)
 */
export const RainbowKitCustomConnectButton = () => {
  // const networkColor = useNetworkColor();
  const { targetNetwork } = useTargetNetwork();

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;

        const blockExplorerAddressLink = account
          ? getBlockExplorerAddressLink(targetNetwork, account.address)
          : undefined;

        return (
          <>
            {(() => {
              if (!connected) {
                return (
                  <Button className="btn btn-primary btn-sm" onClick={openConnectModal} type="button">
                    Connect Wallet
                  </Button>
                );
              }

              if (chain.unsupported || chain.id !== targetNetwork.id) {
                return <WrongNetworkDropdown />;
              }

              return (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/30">
                    <Globe className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium text-success">{targetNetwork.name}</span>
                  </div>
                  <AddressInfoDropdown
                    address={account.address as Address}
                    displayName={account.displayName}
                    ensAvatar={account.ensAvatar}
                    blockExplorerAddressLink={blockExplorerAddressLink}
                  />

                  {/* <RevealBurnerPKModal /> */}
                </div>
              );
            })()}
          </>
        );
      }}
    </ConnectButton.Custom>
  );
};
