"use client";

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DashboardNavbar from "@/components/DashboardNavbar";

export default function TradePage() {
  const searchParams = useSearchParams();
  const couponCode = searchParams.get("coupon");
  const [timeRemaining, setTimeRemaining] = useState(1200); // 20 minutes in seconds
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [movementBalance] = useState(2500.00);
  const [couponPercentage] = useState(10); // 10% of balance
  const [betAmount] = useState(movementBalance * (couponPercentage / 100));

  useEffect(() => {
    if (isConfirmed && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isConfirmed, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleConfirm = () => {
    setIsConfirmed(true);
    // Lock the amount
  };

  return (
    <>
      <DashboardNavbar />
      <div className="min-h-screen bg-grid pt-24 pb-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/dashboard/coupons"
            className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block transition-colors"
          >
            ← Back to Coupons
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Trading Session
            </span>
          </h1>
          <p className="text-zinc-400">Use your coupon to trade BTC/USDT</p>
        </motion.div>

        {!isConfirmed ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl"
          >
            {/* Coupon Info */}
            {couponCode && (
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-sm text-blue-300 mb-1">Coupon Code</p>
                <code className="text-lg font-mono text-blue-400">{couponCode}</code>
              </div>
            )}

            {/* Trading Details */}
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-zinc-400 text-sm mb-1">Movement Account Balance</p>
                  <p className="text-2xl font-bold text-white">
                    ${movementBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-zinc-400 text-sm mb-1">Coupon Percentage</p>
                  <p className="text-2xl font-bold text-white">{couponPercentage}%</p>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-blue-300 font-medium">Bet Amount</p>
                  <p className="text-3xl font-bold text-blue-400">
                    ${betAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <p className="text-xs text-blue-400/70">
                  This amount will be locked from your Movement Account during the trading session
                </p>
              </div>

              {/* Trading Info */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-3">Trading Details</h3>
                <div className="space-y-2 text-sm text-zinc-300">
                  <div className="flex justify-between">
                    <span>Pair:</span>
                    <span className="font-medium">BTC/USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Session Duration:</span>
                    <span className="font-medium">20 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Possible Profit:</span>
                    <span className="font-medium text-green-400">+50% to +70%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Possible Loss:</span>
                    <span className="font-medium text-red-400">-100%</span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-yellow-400 text-sm">
                  ⚠️ Once confirmed, the amount will be locked and results will be credited after 20 minutes.
                  You cannot cancel the trade after confirmation.
                </p>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleConfirm}
                className="w-full btn-primary rounded-xl px-6 py-4 font-semibold text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
              >
                Confirm Trade
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl text-center"
          >
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-4xl">⏳</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Trading in Progress</h2>
              <p className="text-zinc-400">Your trade is being processed</p>
            </div>

            {/* Timer */}
            <div className="mb-6">
              <div className="text-6xl font-bold text-blue-400 mb-2">
                {formatTime(timeRemaining)}
              </div>
              <p className="text-zinc-400 text-sm">Time remaining until results</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/5 rounded-full h-2 mb-6">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((1200 - timeRemaining) / 1200) * 100}%` }}
              />
            </div>

            {/* Locked Amount Info */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-zinc-400 text-sm mb-1">Locked Amount</p>
              <p className="text-2xl font-bold text-white">
                ${betAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {timeRemaining === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <Link
                  href="/dashboard"
                  className="btn-primary rounded-xl px-6 py-4 font-semibold text-center transition-all duration-300 hover:scale-105 inline-block"
                >
                  View Results
                </Link>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
    </>
  );
}
