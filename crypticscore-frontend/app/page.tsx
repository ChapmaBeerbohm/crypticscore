"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";

export default function HomePage() {
  const { account, connect } = useWallet();

  const features = [
    {
      icon: "🔒",
      title: "Complete Privacy",
      description: "All ratings are encrypted end-to-end using FHEVM technology. Your scores remain private on-chain.",
    },
    {
      icon: "📊",
      title: "Multi-Dimension",
      description: "Rate products across multiple dimensions like quality, service, value, and more.",
    },
    {
      icon: "🎯",
      title: "Fair Results",
      description: "Prevent rating manipulation with encrypted scores that only authorized parties can decrypt.",
    },
    {
      icon: "⚡",
      title: "On-Chain Verified",
      description: "Blockchain guarantees data immutability and transparency while preserving privacy.",
    },
  ];

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 gradient-primary opacity-10"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center fade-in">
            <h1 className="text-5xl sm:text-6xl font-bold mb-6">
              <span className="gradient-text">Private Ratings,</span>
              <br />
              <span className="text-gray-900 dark:text-white">Public Trust</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              The first privacy-preserving rating platform powered by Fully Homomorphic Encryption.
              Rate products without revealing your scores.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {account ? (
                <>
                  <Link
                    href="/create"
                    className="btn-primary inline-block text-center"
                  >
                    Create Rating Project
                  </Link>
                  <Link
                    href="/participate"
                    className="btn-secondary inline-block text-center"
                  >
                    Participate in Ratings
                  </Link>
                </>
              ) : (
                <button onClick={connect} className="btn-primary">
                  Connect Wallet to Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Why Choose <span className="gradient-text">CrypticScore</span>?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Built on cutting-edge FHEVM technology for truly private and secure ratings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-50 dark:bg-gray-900 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Project</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Set up a rating project with custom dimensions and parameters.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Collect Ratings</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Users submit encrypted ratings that remain private on-chain.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Decrypt Results</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Authorized users decrypt and view statistical insights.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="glass-card text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Connect your wallet and create your first privacy-preserving rating project.
          </p>
          {!account && (
            <button onClick={connect} className="btn-primary">
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


