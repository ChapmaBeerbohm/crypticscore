"use client";

import { useWallet } from "@/hooks/useWallet";
import { useRatingManager } from "@/hooks/useRatingManager";
import { useFhevm } from "@/hooks/useFhevm";

export function NetworkDebug() {
  const { account, chainId, provider } = useWallet();
  const { contractAddress, isReady } = useRatingManager();
  const { instance, isLoading: fhevmLoading, error: fhevmError } = useFhevm();

  if (!account) {
    return (
      <div className="fixed bottom-4 right-4 glass-card p-4 max-w-sm text-xs">
        <div className="font-semibold mb-2">🔌 Not Connected</div>
        <p className="text-gray-600">Please connect your wallet</p>
      </div>
    );
  }

  const isLocalhost = chainId === 31337;
  const hasCorrectNetwork = isLocalhost;

  return (
    <div className="fixed bottom-4 right-4 glass-card p-4 max-w-sm text-xs space-y-2">
      <div className="font-semibold mb-2">🐛 Debug Info</div>
      
      {/* Network Status */}
      <div className="flex justify-between">
        <span className="text-gray-500">Network:</span>
        <span className={hasCorrectNetwork ? "text-green-600" : "text-red-600"}>
          {chainId === 31337 ? "Localhost ✅" : `Chain ${chainId} ⚠️`}
        </span>
      </div>

      {/* Account */}
      <div className="flex justify-between">
        <span className="text-gray-500">Account:</span>
        <span className="font-mono text-xs">
          {account.slice(0, 6)}...{account.slice(-4)}
        </span>
      </div>

      {/* Contract */}
      <div className="flex justify-between">
        <span className="text-gray-500">Contract:</span>
        <span className={contractAddress ? "text-green-600" : "text-red-600"}>
          {contractAddress ? `${contractAddress.slice(0, 6)}... ✅` : "Not found ❌"}
        </span>
      </div>

      {/* FHEVM */}
      <div className="flex justify-between">
        <span className="text-gray-500">FHEVM:</span>
        <span className={instance && !fhevmLoading ? "text-green-600" : "text-yellow-600"}>
          {fhevmLoading ? "Loading..." : instance ? "Ready ✅" : "Not ready ⏳"}
        </span>
      </div>

      {fhevmError && (
        <div className="text-red-600 text-xs mt-2">
          FHEVM Error: {fhevmError}
        </div>
      )}

      {/* Warning */}
      {!hasCorrectNetwork && (
        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
          <div className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
            ⚠️ Wrong Network
          </div>
          <p className="text-yellow-700 dark:text-yellow-400 text-xs">
            Please switch MetaMask to:
            <br />
            <strong>Localhost 8545 (Chain ID: 31337)</strong>
          </p>
          <button
            onClick={async () => {
              if (window.ethereum) {
                try {
                  await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: "0x7A69" }], // 31337 in hex
                  });
                } catch (error: any) {
                  if (error.code === 4902) {
                    // Network not added, add it
                    await window.ethereum.request({
                      method: "wallet_addEthereumChain",
                      params: [
                        {
                          chainId: "0x7A69",
                          chainName: "Localhost 8545",
                          rpcUrls: ["http://127.0.0.1:8545"],
                          nativeCurrency: {
                            name: "ETH",
                            symbol: "ETH",
                            decimals: 18,
                          },
                        },
                      ],
                    });
                  }
                }
              }
            }}
            className="mt-2 w-full px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-all text-xs"
          >
            Switch Network
          </button>
        </div>
      )}

      {!contractAddress && hasCorrectNetwork && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
          <div className="font-semibold text-red-800 dark:text-red-300 mb-1">
            ❌ Contract Not Found
          </div>
          <p className="text-red-700 dark:text-red-400 text-xs">
            Please deploy the contract:
            <br />
            <code className="bg-gray-800 text-white px-1 rounded">
              npx hardhat deploy --network localhost
            </code>
          </p>
        </div>
      )}
    </div>
  );
}


