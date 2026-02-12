import { useState } from "react";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { NetworkOptions } from "./NetworkOptions";
import { useWatchBalance } from "@scaffold-ui/hooks";
import { clsx } from "clsx";
import { ChevronDown, SquareArrowLeft } from "lucide-react";
import { formatEther, getAddress } from "viem";
import { Address } from "viem";
//import { hardhat, sepolia } from "viem/chains";
import { useDisconnect } from "wagmi";
import {
  ArrowTopRightOnSquareIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon, // EyeIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
//import { BlockieAvatar } from "~~/components/scaffold-eth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger, //DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~~/components/ui/dropdown-menu";
import { useCopyToClipboard, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { getTargetNetworks } from "~~/utils/scaffold-eth";
//import { getTargetNetworks } from "~~/utils/scaffold-eth";
import { isENS } from "~~/utils/scaffold-eth/common";

//const BURNER_WALLET_ID = "burnerWallet";

const allowedNetworks = getTargetNetworks();

type AddressInfoDropdownProps = {
  address: Address;
  blockExplorerAddressLink: string | undefined;
  displayName: string;
  ensAvatar?: string;
};

export const AddressInfoDropdown = ({ address, displayName, blockExplorerAddressLink }: AddressInfoDropdownProps) => {
  const { disconnect } = useDisconnect();
  const [showQrCodeModal, setShowQrCodeModal] = useState(false);
  const checkSumAddress = getAddress(address);
  const { targetNetwork } = useTargetNetwork();

  const { copyToClipboard: copyAddressToClipboard, isCopiedToClipboard: isAddressCopiedToClipboard } =
    useCopyToClipboard();
  const [selectingNetwork] = useState(false);
  const { data: balance } = useWatchBalance({ address, chainId: targetNetwork.id });

  const handleDisconnect = () => {
    disconnect();
  };
  const formattedBalance = balance ? Number(formatEther(balance.value)) : 0;

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm transition-colors hover:bg-accent">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
            <span className="font-mono text-xs text-muted-foreground hidden sm:inline">
              {" "}
              {isENS(displayName) ? displayName : checkSumAddress?.slice(0, 6) + "..." + checkSumAddress?.slice(-4)}
            </span>
            <span className="font-mono text-sm font-semibold text-primary">{formattedBalance.toFixed(4)} ETH</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="shadow-xl" onCloseAutoFocus={e => e.preventDefault()}>
          <DropdownMenuItem
            onSelect={e => {
              e.preventDefault();
              copyAddressToClipboard(checkSumAddress);
            }}
            className={clsx(selectingNetwork ? "hidden" : "")}
          >
            {isAddressCopiedToClipboard ? (
              <>
                <CheckCircleIcon className="text-xl font-normal h-6 w-4 ml-2 sm:ml-0" aria-hidden="true" />
                <span className="whitespace-nowrap">Copied!</span>
              </>
            ) : (
              <>
                <DocumentDuplicateIcon className="text-xl font-normal h-6 w-4 mr-2 sm:ml-0" aria-hidden="true" />
                <span className="whitespace-nowrap">Copy address</span>
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem className="w-full bg-transparent" onSelect={() => setShowQrCodeModal(true)}>
            <QrCodeIcon className="h-6 w-4 mr-2 sm:ml-0" />
            View QR Code
          </DropdownMenuItem>

          <DropdownMenuItem className={clsx(selectingNetwork ? "hidden" : "")}>
            <ArrowTopRightOnSquareIcon className="h-6 w-4 mr-2 sm:ml-0" />
            <a target="_blank" href={blockExplorerAddressLink} rel="noopener noreferrer" className="whitespace-nowrap">
              View on Block Explorer
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {allowedNetworks.length > 1 ? (
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  className="text-sm hover:bg-accent/30"
                  // onSelect={() => {
                  //   setSelectingNetwork(true);
                  // }}
                >
                  <ArrowsRightLeftIcon className="h-6 w-4 mr-2 sm:ml-0" />
                  Switch Network
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="ml-1">
                    <NetworkOptions />
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>
          ) : null}

          <DropdownMenuItem onSelect={handleDisconnect} className={selectingNetwork ? "hidden" : ""}>
            <SquareArrowLeft className="h-6 w-4 mr-2 sm:ml-0" /> Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AddressQRCodeModal address={address} onOpenChange={setShowQrCodeModal} open={showQrCodeModal} />
    </>
  );
};
