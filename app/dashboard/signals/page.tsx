"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import DashboardNavbar from "@/components/DashboardNavbar";
import DashboardFooter from "@/components/DashboardFooter";
import { apiClient, Signal, SignalLimits, SignalHistoryItem } from "@/lib/api";
import { LuRefreshCw, LuClock, LuTrendingUp, LuTrendingDown } from "react-icons/lu";

export default function SignalsPage() {
  const [activeTab, setActiveTab] = useState<"daily" | "referral" | "history">("daily");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [limits, setLimits] = useState<SignalLimits | null>(null);
  const [history, setHistory] = useState<SignalHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSignals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [signalsRes, historyRes] = await Promise.all([
        apiClient.getAvailableSignals(),
        apiClient.getSignalHistory(1, 50),
      ]);

      if (signalsRes.success && signalsRes.data) {
        setSignals(signalsRes.data.signals);
        setLimits(signalsRes.data.limits);
      }

      if (historyRes.success && historyRes.data) {
        setHistory(historyRes.data.history);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load signals";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSignals();
    // Refresh every 30 seconds to update time remaining
    const interval = setInterval(fetchSignals, 30000);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  const handleConfirmSignal = async (signalId: string) => {
    try {
      setConfirming(signalId);
      setError(null);
      const res = await apiClient.confirmSignal(signalId);

      if (res.success) {
        setSuccessMessage(`Signal confirmed! Committed $${res.data?.committedAmount.toFixed(2)}. Results in 20 minutes.`);
        // Refresh signals
        await fetchSignals();
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to confirm signal";
      setError(errorMessage);
    } finally {
      setConfirming(null);
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  // Filter signals by type
  const dailySignals = signals.filter((s) => s.type === "DAILY");
  const referralSignals = signals.filter((s) => s.type === "REFERRAL");

  // Filter history
  const pendingHistory = history.filter((h) => h.outcome === "PENDING");
  const settledHistory = history.filter((h) => h.outcome !== "PENDING");

  // Loading state
  if (loading && signals.length === 0 && !error) {
    return (
      <>
        <DashboardNavbar />
        <div className="min-h-screen bg-grid pt-24 pb-8 px-4 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <LuRefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Loading signals...</p>
          </motion.div>
        </div>
      </>
    );
  }

  // Error state when no data could be loaded
  if (!limits && error) {
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
            <h2 className="text-xl font-semibold text-white mb-2">
              Connection Issue
            </h2>
            <p className="text-zinc-400 mb-6">
              We&apos;re having trouble connecting to the server. This is usually temporary - please try again in a moment.
            </p>
            <button
              onClick={fetchSignals}
              className="px-6 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/dashboard"
              className="block mt-4 text-zinc-500 hover:text-zinc-400 text-sm transition-colors"
            >
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
        <div className="max-w-7xl mx-auto">
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    Trading Signals
                  </span>
                </h1>
                <p className="text-zinc-400">Manage your daily and referral signals</p>
              </div>
              <button
                onClick={fetchSignals}
                disabled={loading}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <LuRefreshCw className={`w-5 h-5 text-zinc-400 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <p className="text-orange-400">{error}</p>
                  </div>
                  <button
                    onClick={() => {
                      setError(null);
                      fetchSignals();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 text-sm font-medium hover:bg-orange-500/30 transition-colors whitespace-nowrap"
                  >
                    Retry
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">✅</span>
                  <p className="text-green-400">{successMessage}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Usage Limits */}
          {limits && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <p className="text-zinc-400 text-sm">Daily Used</p>
                <p className="text-2xl font-bold text-white">
                  {limits.dailySignalsUsed}/{limits.maxDailySignals}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <p className="text-zinc-400 text-sm">Daily Remaining</p>
                <p className="text-2xl font-bold text-green-400">{limits.dailySignalsRemaining}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <p className="text-zinc-400 text-sm">Referral Used</p>
                <p className="text-2xl font-bold text-white">
                  {limits.referralSignalsUsed}/{limits.maxReferralSignals}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <p className="text-zinc-400 text-sm">Referral Remaining</p>
                <p className="text-2xl font-bold text-cyan-400">{limits.referralSignalsRemaining}</p>
              </div>
            </motion.div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-white/5 rounded-xl p-1 max-w-lg">
            <button
              onClick={() => setActiveTab("daily")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === "daily"
                  ? "bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Daily ({dailySignals.length})
            </button>
            <button
              onClick={() => setActiveTab("referral")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === "referral"
                  ? "bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Referral ({referralSignals.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === "history"
                  ? "bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              History ({history.length})
            </button>
          </div>

          {/* Daily Signals Tab */}
          {activeTab === "daily" && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
              >
                <h2 className="text-xl font-semibold text-white mb-4">Available Daily Signals</h2>
                {dailySignals.length === 0 ? (
                  <p className="text-zinc-400 text-center py-8">No daily signals available right now</p>
                ) : (
                  <div className="space-y-3">
                    {dailySignals.map((signal) => (
                      <div
                        key={signal.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">🎫</span>
                            <div>
                              <p className="text-white font-medium">{signal.title}</p>
                              <p className="text-zinc-400 text-sm">
                                {signal.timeSlot === "MORNING" ? "9:00 AM GMT" : "7:00 PM GMT"} • {signal.commitPercent}% of balance
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded flex items-center gap-1">
                              <LuClock className="w-3 h-3" />
                              {formatTimeRemaining(signal.timeRemaining)} remaining
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleConfirmSignal(signal.id)}
                          disabled={confirming === signal.id || (limits !== null && limits.dailySignalsRemaining === 0)}
                          className="btn-primary rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                        >
                          {confirming === signal.id ? (
                            <LuRefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            "Confirm Signal"
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Schedule Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-blue-300 mb-3">📅 Daily Schedule</h3>
                <div className="space-y-2 text-sm text-blue-400/80">
                  <div className="flex items-center justify-between">
                    <span>9:00 AM GMT</span>
                    <span>1 signal (after 15-min training)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>7:00 PM GMT</span>
                    <span>2 signals (direct confirmation)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>3:00 PM GMT</span>
                    <span>Referral signals (if available)</span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Referral Signals Tab */}
          {activeTab === "referral" && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
              >
                <h2 className="text-xl font-semibold text-white mb-4">Referral Signals</h2>
                {referralSignals.length === 0 ? (
                  <p className="text-zinc-400 text-center py-8">No referral signals available right now</p>
                ) : (
                  <div className="space-y-3">
                    {referralSignals.map((signal) => (
                      <div
                        key={signal.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">🎁</span>
                            <div>
                              <p className="text-white font-medium">{signal.title}</p>
                              <p className="text-zinc-400 text-sm">
                                3:00 PM GMT • {signal.commitPercent}% of balance
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded flex items-center gap-1">
                              <LuClock className="w-3 h-3" />
                              {formatTimeRemaining(signal.timeRemaining)} remaining
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleConfirmSignal(signal.id)}
                          disabled={confirming === signal.id || (limits !== null && limits.referralSignalsRemaining === 0)}
                          className="btn-primary rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                        >
                          {confirming === signal.id ? (
                            <LuRefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            "Confirm Signal"
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Referral Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-cyan-300 mb-3">💎 Referral Signal Tiers</h3>
                <div className="space-y-2 text-sm text-cyan-400/80">
                  <div className="flex items-center justify-between">
                    <span>$550 - $1,250</span>
                    <span>6 signals (3/day for 2 days)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>$3,000 - $10,000</span>
                    <span>15 signals (3/day for 5 days)</span>
                  </div>
                  <p className="text-xs text-cyan-500/60 mt-3">
                    Signals are issued at 3 PM GMT and can be accumulated over time.
                  </p>
                </div>
              </motion.div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="space-y-6">
              {/* Pending Signals */}
              {pendingHistory.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6 shadow-xl"
                >
                  <h2 className="text-xl font-semibold text-yellow-300 mb-4 flex items-center gap-2">
                    <LuClock className="w-5 h-5" />
                    Pending Results ({pendingHistory.length})
                  </h2>
                  <div className="space-y-3">
                    {pendingHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-yellow-500/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-yellow-500/20">
                            <LuClock className="w-5 h-5 text-yellow-400" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">
                              {item.signal?.title || "Signal"}
                            </p>
                            <p className="text-zinc-400 text-xs">{formatDate(item.confirmedAt)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-yellow-400 font-semibold">
                            ${item.committedAmount.toFixed(2)} committed
                          </p>
                          <p className="text-zinc-500 text-xs">Awaiting results...</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Settled Signals */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
              >
                <h2 className="text-xl font-semibold text-white mb-4">Trade History</h2>
                {settledHistory.length === 0 ? (
                  <p className="text-zinc-400 text-center py-8">No completed trades yet</p>
                ) : (
                  <div className="space-y-3">
                    {settledHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              item.outcome === "PROFIT" ? "bg-green-500/20" : "bg-red-500/20"
                            }`}
                          >
                            {item.outcome === "PROFIT" ? (
                              <LuTrendingUp className="w-5 h-5 text-green-400" />
                            ) : (
                              <LuTrendingDown className="w-5 h-5 text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">
                              {item.signal?.title || "Signal"}
                            </p>
                            <p className="text-zinc-400 text-xs">
                              {item.settledAt ? formatDate(item.settledAt) : formatDate(item.confirmedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-semibold ${
                              item.outcome === "PROFIT" ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {item.outcome === "PROFIT" ? "+" : ""}${item.resultAmount.toFixed(2)}
                          </p>
                          <p className="text-zinc-500 text-xs">
                            Committed: ${item.committedAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </div>
      </div>
      <DashboardFooter />
    </>
  );
}
