export interface Market {
  id: string;
  title: string;
  endDate: bigint;
  openDate: bigint;
  settledAt: bigint;
  category: number;
  outcome: number;
  status: number;
  volume: bigint;
  criteria: string;
  liquidity: bigint;
  yesShares: bigint;
  noShares: bigint;
  resolution_type: number;
  active_predictions: bigint;
}

export interface MarketsReturnType {
  id: string;
  question: string;
  marketOpen: bigint;
  marketClose: bigint;
  category: number;
  outcome: number;
  status: number;
  settledAt: bigint;
  confidenceBps: number;
  yesShares: bigint;
  noShares: bigint;
  criteria: string;
  liquidity: bigint;
  resolutionChannel: number;
  totalParticipants: bigint;
}

export interface MarketSelection {
  all: TransformedMarket[];
  stats: {
    active: MarketsReturnType[];
    resolved: MarketsReturnType[];
    inconclusive: MarketsReturnType[];
    pending: MarketsReturnType[];
    manualResolved: MarketsReturnType[];
    aiResolved: MarketsReturnType[];
  };
  totalVolumeUSD: string;
  totalLiquidityUSD: string;
}

export interface TransformedMarket {
  id: string;
  title: string;
  category: number;
  outcome: number;
  status: number;
  endDate: bigint;
  settledAt: bigint;
  volume: bigint;
  criteria: string;
  liquidity: bigint;
  yesShares: bigint;
  noShares: bigint;
  resolution_type: number;
  active_predictions: bigint;
  isClosed: boolean;
}

export interface TradeEntry {
  side: string;
  amount: string;
  yesPriceUsd: number;
  noPriceUsd: number;
  timestamp: number;
}

export interface ChartPoint {
  time: string;
  yes: number;
  no: number;
  yesProb: string;
}

export interface MarketHistory {
  chartData: ChartPoint[];
  tradeHistory: TradeEntry[];
}
