"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { sepolia, mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

// Define Lisk Sepolia chain
const liskSepolia = {
  id: 4202,
  name: 'Lisk Sepolia',
  network: 'lisk-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc.sepolia-api.lisk.com'] },
    public: { http: ['https://rpc.sepolia-api.lisk.com'] },
  },
  blockExplorers: {
    default: { 
      name: 'Lisk Sepolia Explorer', 
      url: 'https://sepolia-blockscout.lisk.com' 
    },
  },
  testnet: true,
} as const;

const config = getDefaultConfig({
  appName: "meProject",
  projectId: "94160308b32ab0edf2db07fd3d2552c6", 
  chains: [liskSepolia, sepolia, mainnet], 
  ssr: true,
});

const queryClient = new QueryClient();

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
        <Toaster richColors={true}/>
      </WagmiProvider>
    </QueryClientProvider>
  );
}