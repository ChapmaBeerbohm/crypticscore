"use client";

import { ReactNode } from "react";
import { WalletProvider } from "@/hooks/useWallet";
import { FhevmProvider } from "@/hooks/useFhevm";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <FhevmProviderWrapper>{children}</FhevmProviderWrapper>
    </WalletProvider>
  );
}

function FhevmProviderWrapper({ children }: { children: ReactNode }) {
  if (typeof window === "undefined") {
    return <>{children}</>;
  }

  const provider = window.ethereum;
  const mockChains = { 31337: "http://localhost:8545" };

  return (
    <FhevmProvider provider={provider} mockChains={mockChains}>
      {children}
    </FhevmProvider>
  );
}


