"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { createFhevmInstance } from "@/fhevm/fhevm";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { ethers } from "ethers";

type FhevmContextType = {
  instance: FhevmInstance | undefined;
  isLoading: boolean;
  error: string | null;
  getDecryptionSignature: (
    contractAddresses: `0x${string}`[],
    signer: ethers.JsonRpcSigner
  ) => Promise<FhevmDecryptionSignature | null>;
};

const FhevmContext = createContext<FhevmContextType | undefined>(undefined);

export function FhevmProvider({
  children,
  provider,
  mockChains,
}: {
  children: ReactNode;
  provider: any;
  mockChains?: Record<number, string>;
}) {
  const [instance, setInstance] = useState<FhevmInstance | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storage] = useState(() => new GenericStringStorage());

  useEffect(() => {
    if (!provider) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const inst = await createFhevmInstance({
          provider,
          mockChains,
          onStatusChange: (status) => {
            console.log("[FHEVM] Status:", status);
          },
        });

        if (!cancelled) {
          setInstance(inst);
          setIsLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error("[FHEVM] Init error:", e);
          setError(e.message || "Failed to initialize FHEVM");
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [provider, mockChains]);

  const getDecryptionSignature = useCallback(
    async (
      contractAddresses: `0x${string}`[],
      signer: ethers.JsonRpcSigner
    ): Promise<FhevmDecryptionSignature | null> => {
      if (!instance) {
        console.error("FHEVM instance not ready");
        return null;
      }
      return FhevmDecryptionSignature.loadOrSign(instance, contractAddresses, signer, storage);
    },
    [instance, storage]
  );

  return (
    <FhevmContext.Provider value={{ instance, isLoading, error, getDecryptionSignature }}>
      {children}
    </FhevmContext.Provider>
  );
}

export function useFhevm() {
  const context = useContext(FhevmContext);
  if (!context) {
    throw new Error("useFhevm must be used within FhevmProvider");
  }
  return context;
}


