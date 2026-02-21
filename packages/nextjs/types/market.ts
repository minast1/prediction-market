export interface Market {
  id: string;
  title: string;
  endDate: bigint;
  settledAt: bigint;
  category: number;
  outcome: number;
  status: number;
  volume: bigint;
  criteria: string;
}
