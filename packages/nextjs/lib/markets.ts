import Decimal from "decimal.js";
import { formatEther } from "viem";
import { Market } from "~~/types/market";

export interface Position {
  marketId: string;
  marketTitle: string;
  side: "yes" | "no";
  shares: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}
export const Category = {
  Crypto: 0,
  Sports: 1,
  Politics: 2,
  Weather: 3,
  Tech: 4,
  Entertainment: 5,
  Economics: 6,
  Science: 7,
  All: 8,
};

export const CATEGORIES = [
  "Crypto",
  "Sports",
  "Politics",
  "Weather",
  "Tech",
  "Entertainment",
  "Economics",
  "Science",
  "All Categories",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const MOCK_MARKETS: any[] = [
  // {
  //   title: "Will SpaceX successfully land a Starship on Mars by 2027?",
  //   category: "Science",
  //   endDate: "2026-06-15",
  //   description:
  //     "Resolves YES if SpaceX confirms a successful touchdown of any Starship vehicle on the Martian surface before Jan 1, 2027.",
  // },
  // {
  //   title: "Will Bitcoin's market cap exceed $3 Trillion by year-end 2026?",
  //   category: "Crypto",
  //   endDate: "2026-12-31",
  //   description:
  //     "Resolves YES if CoinGecko or CoinMarketCap reports a BTC market capitalization above $3T at any point before the end of 2026.",
  // },
  // {
  //   title: "Will an African nation reach the FIFA World Cup Final in 2026?",
  //   category: "Sports",
  //   endDate: "2026-07-10",
  //   description:
  //     "Resolves YES if any team from the CAF confederation competes in the final match of the 2026 FIFA World Cup.",
  // },
  // {
  //   title: "Will the Digital Euro be officially launched by July 2026?",
  //   category: "Economics",
  //   endDate: "2026-07-01",
  //   description:
  //     "Resolves YES if the European Central Bank announces the official public rollout of the Digital Euro for retail use.",
  // },
  {
    title: "Will a non-English language film win Best Picture at the 2026 Oscars?",
    category: "Entertainment",
    endDate: "2026-03-15",
    description:
      "Resolves YES if the Academy of Motion Picture Arts and Sciences awards 'Best Picture' to a film primarily in a language other than English.",
  },
  {
    title: "Will 2026 be recorded as the hottest year in history?",
    category: "Weather",
    endDate: "2027-01-20",
    description:
      "Resolves YES if NASA or NOAA data confirms 2026 global surface temperatures were the highest on record.",
  },
  {
    title: "Will a private fusion company achieve 'Net Energy Gain' by 2027?",
    category: "Science",
    endDate: "2026-11-15",
    description:
      "Resolves YES if a peer-reviewed report confirms a private company produced more energy from fusion than was used to trigger the reaction.",
  },
  // {
  //   title: "Will the Democratic Party retain control of the US Senate in the 2026 Midterms?",
  //   category: "Politics",
  //   endDate: "2026-11-05",
  //   description:
  //     "Resolves YES if, following the 2026 elections, the Democratic caucus holds at least 50 seats plus the tie-breaking vote.",
  // },
  {
    title: "Will Neuralink receive FDA approval for wide-scale consumer use by 2027?",
    category: "Tech",
    endDate: "2026-09-30",
    description:
      "Resolves YES if the FDA grants a de novo request or premarket approval for Neuralink's brain-computer interface for non-experimental use.",
  },
  {
    title: "Will Ethereum staking rewards stay above 3% APR through 2026?",
    category: "Crypto",
    endDate: "2026-12-31",
    description:
      "Resolves YES if the average annual percentage rate for ETH stakers remains ≥ 3.0% as reported by Beaconcha.in throughout the calendar year.",
  },
];

export function formatPrice(n: bigint, ethPrice: number): string {
  if (!ethPrice || !n) return "0.00";
  return (parseFloat(formatEther(n)) * ethPrice).toFixed(2);
}

export const getTrendingScore = (market: Market) => {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const ageInSeconds = now - market.openDate;

  // Prevent division by zero and provide a minimum age of 1 hour for fair scoring
  const effectiveAge = ageInSeconds > 3600n ? ageInSeconds : 3600n;

  // Score = Volume / Age (multiplied by 3600 to get "Volume per Hour")
  return (market.volume * 3600n) / effectiveAge;
};

/**
 * Calculates how much ETH a user stands to win based on current pool weights.
 * @param userStake The amount the user has bet (BigInt)
 * @param userSide The side the user is on (1 for YES, 2 for NO)
 * @param market The market object from your contract
 */
export const calculatePotentialPayout = (
  userStake: bigint, // This is the amount the user has on the WINNING side
  winningSide: number,
  market: Pick<Market, "yesShares" | "noShares">,
) => {
  if (userStake === 0n) return "0.00";
  const isYes = winningSide === 2;
  const winnnigPool = isYes ? market.yesShares : market.noShares;
  const loosingPool = isYes ? market.noShares : market.yesShares;

  //If there are no losers yet, you should get your stake back
  if (winnnigPool === 0n) return formatEther(userStake);
  const profit = (userStake * loosingPool) / winnnigPool;
  const totalPayoutWei = userStake + profit;
  return formatEther(totalPayoutWei);
};

export const timeLeftLabel = (diff: bigint) => {
  let timeLeftLabel = "";

  if (diff === 0n) {
    timeLeftLabel = "Ended";
  } else if (diff >= 86400n) {
    const days = Number(diff / 86400n);
    timeLeftLabel = `${days}d left`;
  } else if (diff >= 3600n) {
    // 🚀 The Fix: Calculate Hours AND Minutes
    const hours = Number(diff / 3600n);
    const mins = Number((diff % 3600n) / 60n); // Get the remainder minutes

    timeLeftLabel = `${hours}h ${mins}m left`;
  } else {
    const mins = Number(diff / 60n);
    timeLeftLabel = `${mins}m left`;
  }
  return timeLeftLabel;
};

Decimal.set({ precision: 60, rounding: Decimal.ROUND_FLOOR });
const WAD = new Decimal("1000000000000000000");

export const calculateInstantValue = (market: any, isYes: boolean, amountWei: bigint) => {
  if (!market || market.liquidity === 0n || amountWei === 0n) return 0n;

  const b = new Decimal(market.liquidity.toString()).div(WAD);
  const y = new Decimal(market.yesShares.toString()).div(WAD);
  const n = new Decimal(market.noShares.toString()).div(WAD);
  const amount = new Decimal(amountWei.toString()).div(WAD);

  const getCost = (yV: Decimal, nV: Decimal, bV: Decimal) => {
    const expY = yV.div(bV).exp();
    const expN = nV.div(bV).exp();
    return bV.mul(Decimal.ln(expY.plus(expN)));
  };

  const currentCost = getCost(y, n, b);
  const nextY = isYes ? Decimal.max(0, y.minus(amount)) : y;
  const nextN = !isYes ? Decimal.max(0, n.minus(amount)) : n;
  const nextCost = getCost(nextY, nextN, b);

  const payoutEth = currentCost.minus(nextCost);
  return BigInt(payoutEth.mul(WAD).toFixed(0));
};

export const isNumericStrict = (val: any) => {
  return !isNaN(val) && val.trim() !== "" && isFinite(val);
};

export const calculateCurrentPrice = (market: any) => {
  if (!market || market.liquidity === 0n) return { yes: 0.5, no: 0.5 };

  const b = new Decimal(market.liquidity.toString());
  const y = new Decimal(market.yesShares.toString());
  const n = new Decimal(market.noShares.toString());

  // LMSR: P = e^(q/b) / (e^(y/b) + e^(n/b))
  const expY = y.div(b).exp();
  const expN = n.div(b).exp();
  const total = expY.plus(expN);

  return {
    yes: expY.div(total).toNumber(),
    no: expN.div(total).toNumber(),
  };
};
