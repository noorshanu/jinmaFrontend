"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import DashboardNavbar from "@/components/DashboardNavbar";
import { apiClient, WalletResponse } from "@/lib/api";

export default function TransferPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [wallet, setWallet] = useState<WalletResponse["wallet"] | null>(null);
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"toMovement" | "toMain">("toMovement");
  const [showTradingNotice, setShowTradingNotice] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.getWallet();
      if (res.success && res.data) {
        setWallet(res.data.wallet);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !amount) return;

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await apiClient.transferBetweenWallets(
        direction === "toMovement" ? "main_to_movement" : "movement_to_main",
        transferAmount
      );

      if (res.success && res.data) {
        const data = res.data;
        let message = `Successfully transferred $${transferAmount.toFixed(2)}`;
        
        if (data.fee && data.fee > 0) {
          message += ` (Fee: $${data.fee.toFixed(2)}, Net: $${data.netAmount.toFixed(2)})`;
        }
        
        if (data.lockTriggered) {
          message += `. ${data.lockDurationDays}-day lock activated for Movement → Main transfers.`;
        }
        
        setSuccessMessage(message);
        setAmount("");
        await fetchWallet();
        
        // Show trading activation notice after Main → Movement transfer
        if (direction === "toMovement") {
          setShowTradingNotice(true);
        }
        
        setTimeout(() => setSuccessMessage(null), 8000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatTimeRemaining = (ms: number) => {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ${hours > 0 ? `${hours}h` : ""}`;
    }
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  };

  const isLocked = wallet?.transferLock?.isLocked || false;
  const mainBalance = wallet?.mainBalance || 0;
  const movementBalance = wallet?.movementBalance || 0;
  const feePercent = wallet?.transferFee?.feePercent || 0;
  const flatFee = wallet?.transferFee?.flatFee || 0;
  const minAmount = wallet?.transferFee?.minAmount || 0;
  const isTransferEnabled = wallet?.transferFee?.isEnabled !== false;

  // Calculate estimated fee for Movement → Main
  const estimatedFee = direction === "toMain" && amount 
    ? (parseFloat(amount) * feePercent / 100) + flatFee 
    : 0;
  const estimatedNet = direction === "toMain" && amount 
    ? parseFloat(amount) - estimatedFee 
    : parseFloat(amount) || 0;

  // Loading state
  if (loading) {
    return (
      <>
        <DashboardNavbar />
        <div className="min-h-screen bg-grid pt-24 pb-8 px-4 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-zinc-400">Loading wallet...</p>
          </motion.div>
        </div>
      </>
    );
  }

  // Error state when no wallet
  if (!wallet && error) {
    return (
      <>
        <DashboardNavbar />
        <div className="min-h-screen bg-grid pt-24 pb-8 px-4 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto"
          >
            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔄</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Connection Issue</h2>
            <p className="text-zinc-400 mb-6">
              We&apos;re having trouble connecting to the server. Please try again.
            </p>
            <button
              onClick={fetchWallet}
              className="px-6 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
            <Link href="/dashboard" className="block mt-4 text-zinc-500 hover:text-zinc-400 text-sm">
              ← Back to Dashboard
            </Link>
          </motion.div>
        </div>
      </>
    );
  }

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

          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <p className="text-orange-400">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-orange-400 hover:text-orange-300"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            )}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">✅</span>
                  <p className="text-green-400">{successMessage}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl"
          >
            {/* Account Balances */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-zinc-400 text-sm mb-1">Main Account</p>
                <p className="text-xl font-bold text-white">${formatCurrency(mainBalance)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-zinc-400 text-sm mb-1">Movement Account</p>
                <p className="text-xl font-bold text-white">${formatCurrency(movementBalance)}</p>
              </div>
            </div>

            {/* Lock Warning */}
            {isLocked && direction === "toMain" && wallet?.transferLock && (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-yellow-400 text-sm font-medium mb-1">🔒 Transfer Lock Active</p>
                <p className="text-yellow-500/70 text-xs">
                  Transfers from Movement Account to Main Account are locked for{" "}
                  <strong>{formatTimeRemaining(wallet.transferLock.lockRemainingMs)}</strong>.
                  {wallet.transferLock.lockEndsAt && (
                    <span className="block mt-1">
                      Lock ends: {new Date(wallet.transferLock.lockEndsAt).toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Transfers Disabled Warning */}
            {!isTransferEnabled && direction === "toMain" && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm font-medium mb-1">⛔ Transfers Disabled</p>
                <p className="text-red-500/70 text-xs">
                  Transfers from Movement to Main Account are currently disabled by admin.
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
                    disabled={isLocked || !isTransferEnabled}
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      isLocked || !isTransferEnabled
                        ? "bg-zinc-500/10 border-zinc-500/20 text-zinc-500 cursor-not-allowed"
                        : direction === "toMain"
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                        : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-2xl mb-2">{isLocked ? "🔒" : "⬆️"}</div>
                    <div className="font-semibold text-sm">To Main</div>
                    <div className="text-xs text-zinc-400 mt-1">
                      {isLocked ? "Locked" : "Movement → Main"}
                    </div>
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-zinc-300 mb-2">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min={direction === "toMain" ? minAmount : 0.01}
                  step="0.01"
                  max={direction === "toMovement" ? mainBalance : movementBalance}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-semibold focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  placeholder="0.00"
                />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-zinc-500">
                    Available: ${formatCurrency(direction === "toMovement" ? mainBalance : movementBalance)}
                  </p>
                  {direction === "toMain" && minAmount > 0 && (
                    <p className="text-xs text-zinc-500">Min: ${formatCurrency(minAmount)}</p>
                  )}
                </div>
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
                      max
                    ].filter((a, i, arr) => a > 0 && arr.indexOf(a) === i);
                    return quickAmounts.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAmount(value.toFixed(2))}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-zinc-300 hover:bg-white/10 transition-all duration-300 text-sm font-medium"
                      >
                        {value === max ? "Max" : `$${value.toFixed(0)}`}
                      </button>
                    ));
                  })()}
                </div>
              </div>

              {/* Fee Preview for Movement → Main */}
              {direction === "toMain" && amount && parseFloat(amount) > 0 && (feePercent > 0 || flatFee > 0) && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-sm text-zinc-300 font-medium mb-2">Transfer Summary</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-zinc-400">
                      <span>Amount:</span>
                      <span>${formatCurrency(parseFloat(amount) || 0)}</span>
                    </div>
                    <div className="flex justify-between text-yellow-400">
                      <span>Fee ({feePercent}% + ${flatFee}):</span>
                      <span>-${formatCurrency(estimatedFee)}</span>
                    </div>
                    <div className="flex justify-between text-white font-semibold pt-1 border-t border-white/10">
                      <span>You&apos;ll Receive:</span>
                      <span>${formatCurrency(estimatedNet > 0 ? estimatedNet : 0)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Important Info */}
              {direction === "toMovement" && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-sm text-blue-300 mb-2">
                    <strong>⚠️ Important:</strong>
                  </p>
                  <ul className="text-xs text-blue-400/80 space-y-1 list-disc list-inside">
                    <li>
                      Transferring to Movement Account will activate a{" "}
                      <strong>{wallet?.transferLock?.lockDurationDays || 15}-day lock</strong>
                    </li>
                    <li>You cannot transfer back to Main Account during the lock period</li>
                    <li>Your referrer will receive a bonus on your first transfer</li>
                    <li>You will receive referral trading coupons</li>
                  </ul>
                </div>
              )}

              {direction === "toMain" && !isLocked && isTransferEnabled && (
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                  <p className="text-sm text-cyan-300 mb-2">
                    <strong>Transfer Fee Info:</strong>
                  </p>
                  <p className="text-xs text-cyan-400/80">
                    {feePercent > 0 || flatFee > 0 ? (
                      <>A fee of <strong>{feePercent}%</strong>{flatFee > 0 && <> + <strong>${flatFee}</strong></>} will be applied.</>
                    ) : (
                      <>No transfer fee is currently applied.</>
                    )}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || (isLocked && direction === "toMain") || !isTransferEnabled && direction === "toMain"}
                className={`w-full rounded-xl px-6 py-4 font-semibold text-center transition-all duration-300 ${
                  submitting || (isLocked && direction === "toMain") || (!isTransferEnabled && direction === "toMain")
                    ? "bg-zinc-500/20 text-zinc-500 cursor-not-allowed"
                    : "btn-primary hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
                }`}
              >
                {submitting
                  ? "Processing..."
                  : isLocked && direction === "toMain"
                  ? "Transfer Locked"
                  : !isTransferEnabled && direction === "toMain"
                  ? "Transfers Disabled"
                  : "Confirm Transfer"}
              </button>
            </form>

            {/* Trading Activation Notice */}
            <AnimatePresence>
              {showTradingNotice && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-6 p-5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">📢</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-300 mb-2">
                        Trading Activation Required
                      </h3>
                      <p className="text-blue-400/80 text-sm mb-3">
                        Your funds have been transferred to your Movement Account. To start trading,
                        please <strong>contact admin to activate your trading status</strong>.
                      </p>
                      <div className="flex items-center gap-3">
                        <Link
                          href="/dashboard"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors"
                        >
                          Go to Dashboard
                        </Link>
                        <button
                          onClick={() => setShowTradingNotice(false)}
                          className="text-blue-400/60 hover:text-blue-400 text-sm transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </>
  );
}
