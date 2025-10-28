import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navigation } from "@/components/Navigation";
import { ClientOnly } from "@/components/ClientOnly";
import { NetworkDebug } from "@/components/NetworkDebug";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CrypticScore - Privacy-Preserving Rating System",
  description: "Multi-dimensional encrypted rating platform powered by FHEVM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientOnly>
          <Providers>
            <div className="min-h-screen flex flex-col">
              <Navigation />
              <main className="flex-1">{children}</main>
              <footer className="glass border-t border-gray-200 dark:border-gray-700 py-6 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600 dark:text-gray-400">
                  <p>CrypticScore - Built with FHEVM | Private Ratings, Public Trust</p>
                </div>
              </footer>
            </div>
            <NetworkDebug />
          </Providers>
        </ClientOnly>
      </body>
    </html>
  );
}

