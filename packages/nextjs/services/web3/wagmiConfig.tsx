import { wagmiConnectors } from "./wagmiConnectors";
import { Chain, createClient, fallback, http, webSocket } from "viem";
import { hardhat, mainnet } from "viem/chains";
import { createConfig } from "wagmi";
import scaffoldConfig from "~~/scaffold.config";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";

const { targetNetworks } = scaffoldConfig;

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains = targetNetworks.find((network: Chain) => network.id === 1)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);

export const wagmiConfig = createConfig({
  chains: enabledChains,
  connectors: wagmiConnectors(),
  ssr: true,
  client: ({ chain }) => {
    const alchemyHttpUrl = getAlchemyHttpUrl(chain.id);
    const alchemyWsUrl = alchemyHttpUrl?.replace("https", "wss");
    const mainnetFallbackWithDefaultRPC = [http("https://mainnet.rpc.buidlguidl.com")];
    const rpcFallbacks = [];
    // const rpcOverrideUrl = (scaffoldConfig.rpcOverrides as ScaffoldConfig["rpcOverrides"])?.[chain.id];

    if (alchemyWsUrl) {
      rpcFallbacks.push(webSocket(alchemyWsUrl));
    }

    if (alchemyHttpUrl) {
      rpcFallbacks.push(http(alchemyHttpUrl));
    }

    rpcFallbacks.push(...(chain.id === mainnet.id ? mainnetFallbackWithDefaultRPC : []), http());

    return createClient({
      chain,
      transport: fallback(rpcFallbacks),
      ...(chain.id !== (hardhat as Chain).id ? { pollingInterval: scaffoldConfig.pollingInterval } : {}),
    });
  },
});
