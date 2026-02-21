export interface Market {
  id: string;
  title: string;
  category: string;
  volume: number;
  liquidity: number;
  endDate: string;
  yesPrice: number;
  noPrice: number;
  priceHistory: { time: string; yes: number }[];
  description: string;
  resolved: boolean;
  outcome?: "yes" | "no";
  trending?: boolean;
  isNew?: boolean;
}

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
  "All",
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

export const MOCK_MARKETS: Market[] = [
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

export function formatVolume(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function formatPrice(p: number): string {
  return `${Math.round(p * 100)}¢`;
}
