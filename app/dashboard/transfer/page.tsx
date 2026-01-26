"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import DashboardNavbar from "@/components/DashboardNavbar";

export default function TransferPage() {
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"toMovement" | "toMain">("toMovement");
  const [mainBalance] = useState(5000.00);
  const [movementBalance] = useState(2500.00);
  const [isLocked] = useState(false);
  const [lockDaysRemaining] = useState(12);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Transfer:", direction, amount);
  };

  return (
    <>
      <DashboardNavbar />
      <div className="min-h-screen bg-grid pt-24 pb-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/dashboard"
            className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Transfer Funds
            </span>
          </h1>
          <p className="text-zinc-400">Move funds between your accounts</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl"
        >
          {/* Account Balances */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-zinc-400 text-sm mb-1">Main Account</p>
              <p className="text-xl font-bold text-white">
                ${mainBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-zinc-400 text-sm mb-1">Movement Account</p>
              <p className="text-xl font-bold text-white">
                ${movementBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Lock Warning */}
          {isLocked && direction === "toMain" && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-yellow-400 text-sm font-medium mb-1">
                ⚠️ Transfer Lock Active
              </p>
              <p className="text-yellow-500/70 text-xs">
                Transfers from Movement Account to Main Account are locked for {lockDaysRemaining} more days.
                This lock was activated when you transferred funds to your Movement Account.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transfer Direction */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                Transfer Direction
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDirection("toMovement")}
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    direction === "toMovement"
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                      : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                  }`}
                >
                  <div className="text-2xl mb-2">⬇️</div>
                  <div className="font-semibold text-sm">To Movement</div>
                  <div className="text-xs text-zinc-400 mt-1">Main → Movement</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("toMain")}
                  disabled={isLocked}
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    isLocked
                      ? "bg-zinc-500/10 border-zinc-500/20 text-zinc-500 cursor-not-allowed"
                      : direction === "toMain"
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                      : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                  }`}
                >
                  <div className="text-2xl mb-2">⬆️</div>
                  <div className="font-semibold text-sm">To Main</div>
                  <div className="text-xs text-zinc-400 mt-1">Movement → Main</div>
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-zinc-300 mb-2">
                Amount (USDT)
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1"
                step="0.01"
                max={direction === "toMovement" ? mainBalance : movementBalance}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-semibold focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                placeholder="0.00"
              />
              <p className="text-xs text-zinc-500 mt-2">
                Available: ${direction === "toMovement" ? mainBalance : movementBalance}
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <p className="text-sm text-zinc-400 mb-2">Quick Amount</p>
              <div className="grid grid-cols-4 gap-2">
                {(() => {
                  const max = direction === "toMovement" ? mainBalance : movementBalance;
                  const quickAmounts = [
                    Math.min(100, max),
                    Math.min(500, max),
                    Math.min(1000, max),
                    Math.min(max * 0.5, max)
                  ].filter(a => a > 0);
                  return quickAmounts.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAmount(value.toFixed(2))}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-zinc-300 hover:bg-white/10 transition-all duration-300 text-sm font-medium"
                    >
                      ${value.toFixed(0)}
                    </button>
                  ));
                })()}
              </div>
            </div>

            {/* Important Info */}
            {direction === "toMovement" && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-300 mb-2">
                  <strong>⚠️ Important:</strong>
                </p>
                <ul className="text-xs text-blue-400/80 space-y-1 list-disc list-inside">
                  <li>Transferring to Movement Account will activate a 15-day lock</li>
                  <li>You cannot transfer back to Main Account during the lock period</li>
                  <li>Your referrer will receive a 10% bonus on your first transfer</li>
                  <li>You will receive referral trading coupons</li>
                </ul>
              </div>
            )}

            {direction === "toMain" && !isLocked && (
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                <p className="text-sm text-cyan-300 mb-2">
                  <strong>Transfer Fee:</strong>
                </p>
                <p className="text-xs text-cyan-400/80">
                  A transfer fee will be applied when moving funds from Movement Account to Main Account.
                  The fee amount is set by the admin.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLocked && direction === "toMain"}
              className={`w-full rounded-xl px-6 py-4 font-semibold text-center transition-all duration-300 ${
                isLocked && direction === "toMain"
                  ? "bg-zinc-500/20 text-zinc-500 cursor-not-allowed"
                  : "btn-primary hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
              }`}
            >
              {isLocked && direction === "toMain" ? "Transfer Locked" : "Confirm Transfer"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
    </>
  );
}
