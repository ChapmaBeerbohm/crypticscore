"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { shortenAddress } from "@/lib/utils";

export function Navigation() {
  const pathname = usePathname();
  const { account, chainId, connect, disconnect, isConnecting } = useWallet();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/create", label: "Create Rating" },
    { href: "/participate", label: "Participate" },
    { href: "/my-creations", label: "My Creations" },
    { href: "/my-ratings", label: "My Ratings" },
  ];

  const getChainName = (id: number | null) => {
    if (!id) return "";
    if (id === 31337) return "Localhost";
    if (id === 11155111) return "Sepolia";
    return `Chain ${id}`;
  };

  return (
    <nav className="glass sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold gradient-text">
              CrypticScore
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  pathname === item.href
                    ? "bg-primary text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Wallet Button */}
          <div className="flex items-center space-x-4">
            {chainId && (
              <div className="hidden sm:block px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium">
                {getChainName(chainId)}
              </div>
            )}
            
            {account ? (
              <div className="flex items-center space-x-2">
                <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-medium">
                  {shortenAddress(account)}
                </div>
                <button
                  onClick={disconnect}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  pathname === item.href
                    ? "bg-primary text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}


