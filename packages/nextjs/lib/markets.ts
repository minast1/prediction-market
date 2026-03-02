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

function generatePriceHistory(finalPrice: number): { time: string; yes: number }[] {
  const points: { time: string; yes: number }[] = [];
  let price = 0.5;
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    price += (Math.random() - 0.48) * 0.08;
    price = Math.max(0.02, Math.min(0.98, price));
    if (i === 0) price = finalPrice;
    points.push({
      time: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      yes: Math.round(price * 100) / 100,
    });
  }
  return points;
}

export const MOCK_MARKETS: any[] = [
  {
    id: "1",
    title: "Will Bitcoin exceed $150K by end of 2026?",
    category: "Crypto",
    volume: 12500000,
    liquidity: 3200000,
    endDate: "2026-12-31",
    yesPrice: 0.62,
    noPrice: 0.38,
    priceHistory: generatePriceHistory(0.62),
    description:
      "This market resolves YES if the price of Bitcoin (BTC) exceeds $150,000 USD on any major exchange before December 31, 2026 11:59 PM ET.",
    resolved: false,
    trending: true,
  },
  {
    id: "2",
    title: "Will AI pass the Turing Test by 2027?",
    category: "Tech",
    volume: 8900000,
    liquidity: 2100000,
    endDate: "2027-01-01",
    yesPrice: 0.45,
    noPrice: 0.55,
    priceHistory: generatePriceHistory(0.45),
    description:
      "Resolves YES if a generally accepted independent evaluation confirms an AI system passes the Turing Test.",
    resolved: false,
    trending: true,
  },
  {
    id: "3",
    title: "US Presidential Election 2028 - Democratic nominee?",
    category: "Politics",
    volume: 24000000,
    liquidity: 8500000,
    endDate: "2028-08-01",
    yesPrice: 0.33,
    noPrice: 0.67,
    priceHistory: generatePriceHistory(0.33),
    description:
      "This market resolves based on the official Democratic Party nominee for the 2028 presidential election.",
    resolved: false,
  },
  {
    id: "4",
    title: "Will SpaceX Starship reach orbit in Q1 2026?",
    category: "Science",
    volume: 5600000,
    liquidity: 1400000,
    endDate: "2026-03-31",
    yesPrice: 0.78,
    noPrice: 0.22,
    priceHistory: generatePriceHistory(0.78),
    description: "s",
    resolved: false,
    isNew: true,
  },
  {
    id: "5",
    title: "Super Bowl LXII Winner - Chiefs?",
    category: "Sports",
    volume: 18000000,
    liquidity: 6200000,
    endDate: "2026-02-08",
    yesPrice: 0.28,
    noPrice: 0.72,
    priceHistory: generatePriceHistory(0.28),
    description: "Resolves YES if the Kansas City Chiefs win Super Bowl LXII.",
    resolved: true,
    outcome: "no",
  },
  {
    id: "6",
    title: "Ethereum ETF net inflows exceed $10B in 2026?",
    category: "Crypto",
    volume: 7800000,
    liquidity: 2800000,
    endDate: "2026-12-31",
    yesPrice: 0.54,
    noPrice: 0.46,
    priceHistory: generatePriceHistory(0.54),
    description:
      "Resolves YES if cumulative net inflows into all US-listed spot Ethereum ETFs exceed $10 billion in calendar year 2026.",
    resolved: false,
  },
  {
    id: "7",
    title: "Fed rate cuts total ≥100bps in 2026?",
    category: "Economics",
    volume: 15200000,
    liquidity: 5100000,
    endDate: "2026-12-31",
    yesPrice: 0.41,
    noPrice: 0.59,
    priceHistory: generatePriceHistory(0.41),
    description:
      "Resolves YES if the Federal Reserve cuts the federal funds rate by a cumulative 100 basis points or more during 2026.",
    resolved: false,
    trending: true,
  },
  {
    id: "8",
    title: "Will a Marvel movie gross $2B+ in 2026?",
    category: "Entertainment",
    volume: 3200000,
    liquidity: 900000,
    endDate: "2026-12-31",
    yesPrice: 0.18,
    noPrice: 0.82,
    priceHistory: generatePriceHistory(0.18),
    description: "Resolves YES if any Marvel Cinematic Universe film grosses over $2 billion worldwide in 2026.",
    resolved: false,
    isNew: true,
  },
  {
    id: "9",
    title: "Tesla delivers 2M+ vehicles in 2026?",
    category: "Tech",
    volume: 9400000,
    liquidity: 3100000,
    endDate: "2026-12-31",
    yesPrice: 0.67,
    noPrice: 0.33,
    priceHistory: generatePriceHistory(0.67),
    description:
      "Resolves YES if Tesla Inc. reports total vehicle deliveries of 2 million or more for the calendar year 2026.",
    resolved: false,
  },
  {
    id: "10",
    title: "US GDP growth > 3% in 2026?",
    category: "Economics",
    volume: 6700000,
    liquidity: 2200000,
    endDate: "2027-02-01",
    yesPrice: 0.35,
    noPrice: 0.65,
    priceHistory: generatePriceHistory(0.35),
    description: "Resolves YES if the final BEA estimate of US real GDP growth for 2026 exceeds 3.0%.",
    resolved: false,
  },
];

export const MOCK_POSITIONS: Position[] = [
  {
    marketId: "1",
    marketTitle: "Will Bitcoin exceed $150K by end of 2026?",
    side: "yes",
    shares: 500,
    avgPrice: 0.45,
    currentPrice: 0.62,
    pnl: 85,
    pnlPercent: 37.78,
  },
  {
    marketId: "4",
    marketTitle: "Will SpaceX Starship reach orbit in Q1 2026?",
    side: "yes",
    shares: 200,
    avgPrice: 0.6,
    currentPrice: 0.78,
    pnl: 36,
    pnlPercent: 30.0,
  },
  {
    marketId: "7",
    marketTitle: "Fed rate cuts total ≥100bps in 2026?",
    side: "no",
    shares: 300,
    avgPrice: 0.5,
    currentPrice: 0.59,
    pnl: 27,
    pnlPercent: 18.0,
  },
  {
    marketId: "5",
    marketTitle: "Super Bowl LXII Winner - Chiefs?",
    side: "no",
    shares: 150,
    avgPrice: 0.55,
    currentPrice: 1.0,
    pnl: 67.5,
    pnlPercent: 81.82,
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
  userStake: bigint,
  userSide: number,
  market: Pick<Market, "yesShares" | "noShares">,
) => {
  if (userStake === 0n) return "0.00";
  const isYes = userSide === 1;
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
