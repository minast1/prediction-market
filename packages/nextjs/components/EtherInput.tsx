import React, { useMemo, useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from "./ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useFetchNativeCurrencyPrice } from "@scaffold-ui/hooks";
import clsx from "clsx";
import { ArrowLeftRight } from "lucide-react";

const MAX_DECIMALS_USD = 2;

const SIGNED_NUMBER_REGEX = /^-?\d*\.?\d*$/;

function etherToDisplay(usdMode: boolean, ethValue: string, price: number) {
  if (usdMode && price) {
    const parsedEth = parseFloat(ethValue);
    if (isNaN(parsedEth)) return ethValue;

    return (Math.round(parsedEth * price * 10 ** MAX_DECIMALS_USD) / 10 ** MAX_DECIMALS_USD).toString();
  }
  return ethValue;
}

function displayToEth(usdMode: boolean, displayValue: string, price: number) {
  if (usdMode && price) {
    const parsedDisplay = parseFloat(displayValue);
    if (isNaN(parsedDisplay)) return displayValue;

    return (parsedDisplay / price).toString();
  }
  return displayValue;
}
const EtherInput = ({
  value,
  placeholder,
  onChange,
  ariaInvalid = false,
  className,
  disabled,
  defaultUsdMode = true, // USD as default
}: {
  value: string; // Controlled by RHF
  onChange: (ethValue: string) => void; // Updates form state
  placeholder?: string;
  ariaInvalid?: boolean | "false" | "true" | "grammar" | "spelling" | undefined;
  className?: string;
  disabled?: boolean;
  defaultUsdMode?: boolean;
}) => {
  const [usdMode, setUsdMode] = useState(defaultUsdMode);
  const [transitoryDisplayValue, setTransitoryDisplayValue] = useState<string>();

  // Fetch ETH price using React Query
  // const { data: price, isLoading: isLoadingPrice } = useEthUsdPrice();
  const { price: nativeCurrencyPrice, isLoading: isLoadingPrice } = useFetchNativeCurrencyPrice();

  const finalPrice = nativeCurrencyPrice ?? 0;

  /** display value shown in UI */
  const displayValue = useMemo(() => {
    const converted = etherToDisplay(usdMode, value, finalPrice);
    if (transitoryDisplayValue && parseFloat(converted) === parseFloat(transitoryDisplayValue)) {
      return transitoryDisplayValue;
    }
    setTransitoryDisplayValue(undefined);
    return converted;
  }, [value, usdMode, finalPrice, transitoryDisplayValue]);

  /** input change handler */
  const handleChange = (newValue: string) => {
    if (newValue && !SIGNED_NUMBER_REGEX.test(newValue)) return;

    if (usdMode) {
      const decimals = newValue.split(".")[1];
      if (decimals && decimals.length > MAX_DECIMALS_USD) return;
    }

    if (newValue.endsWith(".") || newValue.endsWith(".0")) {
      setTransitoryDisplayValue(newValue);
    } else {
      setTransitoryDisplayValue(undefined);
    }

    const newEthValue = displayToEth(usdMode, newValue, finalPrice);
    onChange(newEthValue);
  };

  return (
    <div className="flex items-center gap-2 w-full">
      {/* Prefix symbol */}
      {/* <span className="font-semibold">{usdMode ? "$" : "Ξ"}</span> */}

      {/* Main input */}
      <InputGroup>
        <InputGroupInput
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          onChange={e => handleChange(e.target.value)}
          className={clsx("flex-1", className)}
          aria-invalid={ariaInvalid}
        />
        <InputGroupAddon>
          <InputGroupText>{usdMode ? "$" : "Ξ"}</InputGroupText>
        </InputGroupAddon>

        <InputGroupAddon align="inline-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <InputGroupButton
                type="button"
                variant="outline"
                className="hover:bg-accent/30 hover:border-accent"
                //size="icon"
                disabled={!usdMode && !finalPrice}
                onClick={() => setUsdMode(v => !v)}
              >
                <ArrowLeftRight className="h-4 w-4" />
              </InputGroupButton>
            </TooltipTrigger>

            <TooltipContent>
              {isLoadingPrice
                ? "Fetching price..."
                : finalPrice === 0
                  ? "Unable to fetch ETH price"
                  : usdMode
                    ? "Switch to ETH"
                    : "Switch to USD"}
            </TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      </InputGroup>

      {/* Toggle Button w/ Tooltip */}
    </div>
  );
};

export default EtherInput;
