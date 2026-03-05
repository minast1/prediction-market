import { useMemo } from "react";
import Decimal from "decimal.js";
import { MarketsReturnType } from "~~/types/market";

Decimal.set({
  precision: 60,
  rounding: Decimal.ROUND_FLOOR,
});

const WAD = new Decimal("1000000000000000000"); // 10^18
const useCalculateSellPayout = (
  market: MarketsReturnType | undefined,
  isYes: boolean,
  sellAmountWei: bigint,
  slippageBps = 50,
) => {
  return useMemo(() => {
    if (!market || market.liquidity === 0n || sellAmountWei === 0n) {
      return { minPayout: 0n, formattedPayout: "0" };
    }
    try {
      const b = new Decimal(market.liquidity.toString()).div(WAD);
      const y = new Decimal(market.yesShares.toString()).div(WAD);
      const n = new Decimal(market.noShares.toString()).div(WAD);
      const amount = new Decimal(sellAmountWei.toString()).div(WAD);

      /**
       * 🛡️ LMSR COST: C = b * ln(e^(y/b) + e^(n/b))
       */
      const getCost = (yVal: Decimal, nVal: Decimal, bVal: Decimal): Decimal => {
        const expY = yVal.div(bVal).exp();
        const expN = nVal.div(bVal).exp();
        return bVal.mul(Decimal.ln(expY.plus(expN)));
      };

      // 1. Current Cost
      const currentCost = getCost(y, n, b);

      // 2. Next Cost
      const nextY = isYes ? Decimal.max(0, y.minus(amount)) : y;
      const nextN = !isYes ? Decimal.max(0, n.minus(amount)) : n;

      // console.log({ nextY: nextY.isNegative(), nextN: nextN.isNegative() });
      if (nextY.isNegative() || nextN.isNegative()) return { minPayout: 0n, formattedPayout: "0" };

      const nextCost = getCost(nextY, nextN, b);

      // 3. Payout in ETH (Difference in Costs)
      const actualPayoutEth = currentCost.minus(nextCost);

      // 4. Convert back to BigInt (Wei)
      const actualPayoutWei = BigInt(actualPayoutEth.mul(WAD).toFixed(0));

      // 5. Apply Slippage Buffer (minPayout = Actual * 0.995)
      const minPayout = (actualPayoutWei * (10000n - BigInt(slippageBps))) / 10000n;

      return {
        minPayout,
        formattedPayout: actualPayoutEth.toFixed(6), // Human readable ETH
      };
    } catch (e) {
      console.error("LMSR Math Error:", e);
      return { minPayout: 0n, formattedPayout: "0" };
    }
  }, [market, isYes, sellAmountWei, slippageBps]);
};

export default useCalculateSellPayout;
