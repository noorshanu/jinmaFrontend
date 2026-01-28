import type { Metadata } from "next";
import Web3Provider from "@/components/web3/Web3Provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jinma BTC/USDT Marketplace",
  description: "Your trusted platform for BTC/USDT trading. Experience seamless transactions, secure trading, and powerful tools to maximize your crypto potential.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
