"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { ethers } from "ethers";

type WalletContextType = {
  account: string | null;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Auto-reconnect on mount
  useEffect(() => {
    const lastConnected = localStorage.getItem("wallet.connected");
    if (lastConnected === "true" && typeof window !== "undefined" && window.ethereum) {
      reconnect();
    }
  }, []);

  const reconnect = async () => {
    if (typeof window === "undefined" || !window.ethereum) return;

    try {
      const prov = new ethers.BrowserProvider(window.ethereum);
      const accounts = await prov.send("eth_accounts", []);
      
      if (accounts.length > 0) {
        const network = await prov.getNetwork();
        const sig = await prov.getSigner();
        
        setProvider(prov);
        setSigner(sig);
        setAccount(accounts[0]);
        setChainId(Number(network.chainId));
      }
    } catch (e) {
      console.error("Reconnect failed:", e);
    }
  };

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      setIsConnecting(true);
      const prov = new ethers.BrowserProvider(window.ethereum);
      
      await prov.send("eth_requestAccounts", []);
      const sig = await prov.getSigner();
      const addr = await sig.getAddress();
      const network = await prov.getNetwork();

      setProvider(prov);
      setSigner(sig);
      setAccount(addr);
      setChainId(Number(network.chainId));

      localStorage.setItem("wallet.connected", "true");
      localStorage.setItem("wallet.lastAccounts", JSON.stringify([addr]));
    } catch (e: any) {
      console.error("Connection failed:", e);
      alert(e.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    localStorage.removeItem("wallet.connected");
    localStorage.removeItem("wallet.lastAccounts");
  }, []);

  // Listen to account/chain changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        localStorage.setItem("wallet.lastAccounts", JSON.stringify(accounts));
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = Number(chainIdHex);
      setChainId(newChainId);
      window.location.reload(); // Recommended by MetaMask
    };

    const handleDisconnect = () => {
      disconnect();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    window.ethereum.on("disconnect", handleDisconnect);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
        window.ethereum.removeListener("disconnect", handleDisconnect);
      }
    };
  }, [account, disconnect]);

  return (
    <WalletContext.Provider
      value={{ account, chainId, provider, signer, isConnecting, connect, disconnect }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}


