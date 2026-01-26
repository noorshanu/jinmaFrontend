import type { Metadata } from "next";

import "./globals.css";



export const metadata: Metadata = {
  title: "jinma Marketplace",
  description: "Your trusted platform for BTC/USDT trading. Experience seamless transactions, secure trading, and powerful tools to maximize your crypto potential.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
