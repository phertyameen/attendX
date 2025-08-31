// hooks/useChainSwitcher.ts
"use client";

import { useEffect } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { toast } from "sonner";

const LISK_SEPOLIA_CHAIN_ID = 4202;

export function useChainSwitcher() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  useEffect(() => {
    if (isConnected && chainId !== LISK_SEPOLIA_CHAIN_ID) {
      // Automatically prompt user to switch to Lisk Sepolia
      const switchToLiskSepolia = async () => {
        try {
          await switchChain({ chainId: LISK_SEPOLIA_CHAIN_ID });
          toast.success("Successfully switched to Lisk Sepolia!");
        } catch (error) {
          console.error("Failed to switch chain:", error);
          toast.error("Please manually switch to Lisk Sepolia network to use this app.");
        }
      };

      // Add a small delay to avoid immediate popup
      const timer = setTimeout(switchToLiskSepolia, 1000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, chainId, switchChain]);

  const isCorrectChain = chainId === LISK_SEPOLIA_CHAIN_ID;

  return {
    isCorrectChain,
    isOnLiskSepolia: isCorrectChain,
    switchToLiskSepolia: () => switchChain({ chainId: LISK_SEPOLIA_CHAIN_ID }),
    isSwitching: isPending,
  };
}