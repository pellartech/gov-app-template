import {
  polygon,
  mainnet,
  sepolia,
  arbitrum,
  arbitrumSepolia,
  polygonMumbai,
  Chain,
  optimismSepolia,
  zkSync,
  zkSyncSepoliaTestnet,
} from "@wagmi/core/chains";

export const pegasus: Chain = {
  id: 1891,
  name: "Lightlink Pegasus",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://replica-pegasus.lightlink.io"],
    },
    public: {
      http: ["https://replica-pegasus.lightlink.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Lightlink Explorer",
      url: "https://pegasus.lightlink.io",
    },
  },
  testnet: true,
};

export const phoenix: Chain = {
  id: 1890,
  name: "Lightlink Phoenix",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://replica-phoenix.lightlink.io"],
    },
    public: {
      http: ["https://replica-phoenix.lightlink.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Lightlink Explorer",
      url: "https://phoenix.lightlink.io",
    },
  },
  testnet: false,
};
const chainNames = [
  "mainnet",
  "polygon",
  "sepolia",
  "mumbai",
  "arbitrum",
  "arbitrumSepolia",
  "optimismSepolia",
  "zkSync",
  "zkSyncSepolia",
  "pegasus",
  "phoenix",
] as const;
export type ChainName = (typeof chainNames)[number];

export function readableChainName(chainName: ChainName): string {
  switch (chainName) {
    case "mainnet":
      return "Ethereum";
    case "polygon":
      return "Polygon";
    case "sepolia":
      return "Sepolia";
    case "mumbai":
      return "Polygon Mumbai";
    case "arbitrum":
      return "Arbitrum One";
    case "arbitrumSepolia":
      return "Arbitrum Sepolia";
    case "optimismSepolia":
      return "Optimism Sepolia";
    case "zkSync":
      return "ZkSync Era";
    case "zkSyncSepolia":
      return "ZkSync Sepolia";
    case "pegasus":
      return "Lightlink Pegasus";
    case "phoenix":
      return "Lightlink Phoenix";
    default:
      throw new Error("Unknown chain");
  }
}

// as const prevents using includes check
const testnets = ["sepolia", "mumbai", "arbitrumSepolia", "optimismSepolia", "pegasus"];

export function getChain(chainName: ChainName): Chain {
  switch (chainName) {
    case "mainnet":
      return mainnet;
    case "polygon":
      return polygon;
    case "arbitrum":
      return arbitrum;
    case "sepolia":
      return sepolia;
    case "arbitrumSepolia":
      return arbitrumSepolia;
    case "mumbai":
      return polygonMumbai;
    case "optimismSepolia":
      return optimismSepolia;
    case "zkSync":
      return zkSync;
    case "zkSyncSepolia":
      return zkSyncSepoliaTestnet;
    case "pegasus":
      return pegasus;
    case "phoenix":
      return phoenix;
    default:
      throw new Error("Unknown chain");
  }
}

export const isTestnet = (chainName: ChainName) => testnets.includes(chainName);
