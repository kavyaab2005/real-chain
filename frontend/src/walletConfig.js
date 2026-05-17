import { createWeb3Modal, defaultWagmiConfig } from "@web3modal/wagmi";
import { createConfig } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const projectId = "e05001f37bb1dbea2a5712166e81ec42";

const metadata = {
  name:        "RealChain",
  description: "Real Estate Analysis using Blockchain",
  url:         "https://real-chain-lilac.vercel.app",
  icons:       ["https://real-chain-lilac.vercel.app/favicon.ico"],
};

const chains = [sepolia];

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
});

export const web3Modal = createWeb3Modal({
  wagmiConfig: config,
  projectId,
  chains,
  defaultChain: sepolia,
  themeMode: "light",
  themeVariables: {
    "--w3m-color-mix":          "#7c3aed",
    "--w3m-color-mix-strength": 40,
    "--w3m-accent":             "#7c3aed",
    "--w3m-border-radius-master": "8px",
  },
  featuredWalletIds: [],
});