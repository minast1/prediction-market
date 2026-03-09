# 🏗 PredictX

🧪 This is an autonomous, decentralized prediction market built on Base/Sepolia using Scaffold-ETH 2. The platform uses a Logarithmic Market Scoring Rule (LMSR) AMM for instant liquidity and Gemini 2.5 Flash for automated, factual market resolution.

⚙️ Built using NextJS, RainbowKit, Foundry, Wagmi, Viem, and Typescript.

- ✅ **Contract Hot Reload**: Your frontend auto-adapts to your smart contract as you edit it.
- 🪝 **[Custom hooks](https://docs.scaffoldeth.io/hooks/)**: Collection of React hooks wrapper around [wagmi](https://wagmi.sh/) to simplify interactions with smart contracts with typescript autocompletion.
- 🧱 [**Components**](https://docs.scaffoldeth.io/components/): Collection of common web3 components to quickly build your frontend.
- 🔥 **Burner Wallet & Local Faucet**: Quickly test your application with a burner wallet and local faucet.
- 🔐 **Integration with Wallet Providers**: Connect to different wallet providers and interact with the Ethereum network.

<img width="1834" height="1109" alt="predictx" src="https://github.com/user-attachments/assets/f065c0fb-fe3b-4424-a0f0-3da376310d4e" />

## 🚀 Key Features

- Autonomous AMM (LMSR): High-efficiency liquidity is provided by a native PRBMath implementation of the LMSR algorithm. No order books are needed—instant buy/sell occurs directly against the contract.

- AI Fact-Check Resolution: Markets are resolved using a custom Vercel AI SDK route that uses Google's Gemini models to research real-world outcomes.
- Zero-Sum Payouts: Winners split the total pool of losers proportionally, ensuring the protocol remains solvent and decentralized.
- Dynamic UI/UX: Real-time price charts, live P&L tracking, and "Last Minute" FOMO indicators are built with Recharts and Tailstack Query.
- Portfolio Management: Efficient "Swap and Pop" on-chain tracking for active positions with a unified history reconstructed from event logs.

## 🏗️ Architecture

1. Smart Contracts (packages/foundry)

   PredictionMarket.sol: This is the core engine.
   Fixed-Point Math: It uses PRBMathUD60x18 for 18-decimal precision exponentials and logarithms.
   Weight-Based Model: It tracks yesShares and noShares as ETH-weighted values.
   Efficiency: It implements userActiveMarkets with O(1) removal logic to keep frontend queries fast.

2. AI Resolution (packages/nextjs/api)

   Model: gemini-3-flash-preview
   Grounding: Uses the google_search tool to verify real-world events.
   Schema: It strictly enforces JSON output for automated contract calls.

3. Frontend Hooks (packages/nextjs/hooks)

   useMarketData: This is a unified React-Query hook for all market filtering (Active, Pending, Trending).
   useMarketPriceHistory: Reconstructs price curves from PriceAction event logs.
   useCalculateSellPayout: Mirrors Solidity math in TypeScript using Decimal.js to prevent slippage reverts.
   useUserActivePositions: Batch-fetches user portfolio data using Multicall3.

## 📈 Math & Mechanics

LMSR Cost Function
The contract determines the price based on the current "weight" of the pools:
Where
is the initial liquidity provided at market creation.
Profit & Loss (P&L)
The UI displays two distinct metrics:

1.  Potential Profit:
    . (What you win if correct).
2.  Unrealized P&L:
    . (What you get if you exit immediately via the AMM).

To get started with Scaffold-ETH 2, follow the steps below:

1. Install dependencies if it was skipped in CLI:

```
cd my-dapp-example
yarn install
```

2. Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Ethereum network using Foundry. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `packages/foundry/foundry.toml`.

3. On a second terminal, deploy the test contract:

```
yarn deploy
```

This command deploys a test smart contract to the local network. The contract is located in `packages/foundry/contracts` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/foundry/script` to deploy the contract to the network. You can also customize the deploy script.

4. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the `Debug Contracts` page. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

Run smart contract test with `yarn foundry:test`

- Edit your smart contracts in `packages/foundry/contracts`
- Edit your frontend homepage at `packages/nextjs/app/page.tsx`. For guidance on [routing](https://nextjs.org/docs/app/building-your-application/routing/defining-routes) and configuring [pages/layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) checkout the Next.js documentation.
- Edit your deployment scripts in `packages/foundry/script`

## Documentation

Visit our [docs](https://docs.scaffoldeth.io) to learn how to start building with Scaffold-ETH 2.

To know more about its features, check out our [website](https://scaffoldeth.io).

## Contributing to Scaffold-ETH 2

We welcome contributions to Scaffold-ETH 2!

Please see [CONTRIBUTING.MD](https://github.com/scaffold-eth/scaffold-eth-2/blob/main/CONTRIBUTING.md) for more information and guidelines for contributing to Scaffold-ETH 2.
