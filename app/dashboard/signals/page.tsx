"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/DashboardNavbar";
import DashboardFooter from "@/components/DashboardFooter";
import { apiClient, Signal, SignalLimits, SignalHistoryItem, UserProfileResponse, WalletResponse } from "@/lib/api";
import { LuRefreshCw, LuClock, LuTrendingUp, LuTrendingDown, LuArrowRight } from "react-icons/lu";

/** Format admin-set time (HH:mm) to "9:00 AM UTC" for display */
function formatSignalTimeUtc(signal: { timeSlot: string; customTime?: string | null }): string {
  const ct = signal.customTime?.trim();
  if (ct && /^\d{1,2}:\d{2}$/.test(ct)) {
    const [h, m] = ct.split(":").map(Number);
    const hour = h % 24;
    const am = hour < 12;
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${m.toString().padStart(2, "0")} ${am ? "AM" : "PM"} UTC`;
  }
  if (signal.timeSlot === "MORNING") return "9:00 AM UTC";
  if (signal.timeSlot === "EVENING") return "7:00 PM UTC";
  if (signal.timeSlot === "REFERRAL") return "3:00 PM UTC";
  if (signal.timeSlot === "WELCOME" || signal.timeSlot === "CUSTOM") return "—";
  return "—";
}

export default function SignalsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"daily" | "referral" | "welcome" | "history">("daily");
  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [limits, setLimits] = useState<SignalLimits | null>(null);
  const [history, setHistory] = useState<SignalHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    signal: Signal | null;
  }>({ isOpen: false, signal: null });
  
  // Trading status
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);
  const [wallet, setWallet] = useState<WalletResponse["wallet"] | null>(null);
  const [loadingTradingStatus, setLoadingTradingStatus] = useState(true);

  const fetchTradingStatus = useCallback(async () => {
    try {
      setLoadingTradingStatus(true);
      const [profileRes, walletRes] = await Promise.all([
        apiClient.getUserProfile(),
        apiClient.getWallet(),
      ]);
      
      if (profileRes.success && profileRes.data) {
        setUserProfile(profileRes.data);
      }
      
      if (walletRes.success && walletRes.data) {
        setWallet(walletRes.data.wallet);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch trading status:", err);
    } finally {
      setLoadingTradingStatus(false);
    }
  }, []);

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
    fetchTradingStatus();
    fetchSignals();
    // No auto-refresh - user can manually refresh if needed
  }, [fetchTradingStatus, fetchSignals]);

  // Open confirmation modal
  const openConfirmModal = (signal: Signal) => {
    setConfirmModal({ isOpen: true, signal });
  };

  // Close confirmation modal
  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, signal: null });
  };

  // Navigate to trade page with signal data
  const handleTradeNow = () => {
    const signal = confirmModal.signal;
    if (!signal) return;

    closeConfirmModal();
    
    // Navigate to trade page with signal data as query params
    const params = new URLSearchParams({
      signalId: signal.id,
      signalTitle: signal.title,
      signalType: signal.type,
      commitPercent: signal.commitPercent.toString(),
      timeSlot: signal.timeSlot,
      ...(signal.customTime ? { customTime: signal.customTime } : {}),
    });
    
    router.push(`/dashboard/trade?${params.toString()}`);
  };

  // Calculate estimated commit amount for a signal
  const getEstimatedCommit = (signal: Signal) => {
    if (!wallet) return 0;
    return (wallet.movementBalance * signal.commitPercent) / 100;
  };

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) + " UTC";
  };

  // Filter signals by type
  const dailySignals = signals.filter((s) => s.type === "DAILY");
  const referralSignals = signals.filter((s) => s.type === "REFERRAL");
  const welcomeSignals = signals.filter((s) => s.type === "WELCOME");

  // Filter history
  const pendingHistory = history.filter((h) => h.outcome === "PENDING");
  const settledHistory = history.filter((h) => h.outcome !== "PENDING");

  /** True if this signal has a pending (ongoing) trade */
  const isSignalOngoing = (signal: Signal) =>
    pendingHistory.some((h) => h.signal?.id === signal.id);

  // Trading restrictions
  const movementBalance = wallet?.movementBalance ?? 0;
  const isTradingActive = userProfile?.isTradingActive ?? false;
  const hasMinBalance = movementBalance >= 250;
  const canTrade = hasMinBalance && isTradingActive;
  
  // Restriction messages
  const getTradingRestrictionMessage = () => {
    if (!hasMinBalance) {
      return {
        type: "balance" as const,
        message: "Your Movement Wallet balance is below $250. Please add balance to start trading.",
      };
    }
    if (!isTradingActive) {
      return {
        type: "inactive" as const,
        message: "Trading account not activated. Please deposit and contact admin to activate your trading account to unlock all benefits.",
      };
    }
    return null;
  };
  
  const restriction = getTradingRestrictionMessage();

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

          {/* Trading Restriction Warning */}
          {!loadingTradingStatus && restriction && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-5 rounded-xl border ${
                restriction.type === "balance"
                  ? "bg-yellow-500/10 border-yellow-500/30"
                  : "bg-orange-500/10 border-orange-500/30"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  restriction.type === "balance"
                    ? "bg-yellow-500/20"
                    : "bg-orange-500/20"
                }`}>
                  <span className="text-2xl">{restriction.type === "balance" ? "💰" : "⚠️"}</span>
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-2 ${
                    restriction.type === "balance" ? "text-yellow-300" : "text-orange-300"
                  }`}>
                    {restriction.type === "balance" ? "Insufficient Balance" : "Trading Deactivated"}
                  </h3>
                  <p className={`text-sm ${
                    restriction.type === "balance" ? "text-yellow-400/80" : "text-orange-400/80"
                  }`}>
                    {restriction.message}
                  </p>
                  {restriction.type === "balance" && (
                    <Link
                      href="/dashboard/transfer"
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg text-sm font-medium hover:bg-yellow-500/30 transition-colors"
                    >
                      Add Balance →
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Usage Limits */}
          {limits && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-4"
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <p className="text-zinc-400 text-sm">CORE signals used today</p>
                <p className="text-2xl font-bold text-white">{limits.dailySignalsUsed}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <p className="text-zinc-400 text-sm">Referral used</p>
                <p className="text-2xl font-bold text-white">
                  {limits.referralSignalsUsed}/{limits.maxReferralSignals}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <p className="text-zinc-400 text-sm">Referral remaining</p>
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
              CORE SIGNALS ({dailySignals.length})
            </button>
            <button
              onClick={() => setActiveTab("referral")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === "referral"
                  ? "bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Referral ({referralSignals.length})
            </button>
            <button
              onClick={() => setActiveTab("welcome")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === "welcome"
                  ? "bg-violet-500/20 text-violet-400 shadow-lg shadow-violet-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              WELCOME SWING SIGNALS ({welcomeSignals.length})
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

          {/* CORE SIGNALS Tab */}
          {activeTab === "daily" && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
              >
                <h2 className="text-xl font-semibold text-white mb-4">Available CORE SIGNALS</h2>
                {dailySignals.length === 0 ? (
                  <p className="text-zinc-400 text-center py-8">No CORE signals available right now</p>
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
                                {formatSignalTimeUtc(signal)} • {signal.commitPercent}% of balance
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
                          onClick={() => !isSignalOngoing(signal) && openConfirmModal(signal)}
                          disabled={!canTrade || isSignalOngoing(signal)}
                          className="btn-primary rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center gap-2"
                          title={isSignalOngoing(signal) ? "Trade in progress" : !canTrade ? restriction?.message : undefined}
                        >
                          {isSignalOngoing(signal) ? (
                            "Ongoing"
                          ) : (
                            <>
                              Trade Now
                              <LuArrowRight className="w-4 h-4" />
                            </>
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
                <h3 className="text-lg font-semibold text-blue-300 mb-3">📅 CORE Schedule (UTC)</h3>
                <div className="space-y-2 text-sm text-blue-400/80">
                  <div className="flex items-center justify-between">
                    <span>9:00 AM UTC</span>
                    <span>1 signal (after 15-min training)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>7:00 PM UTC</span>
                    <span>2 signals (direct confirmation)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>3:00 PM UTC</span>
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
                                {formatSignalTimeUtc(signal)} • {signal.commitPercent}% of balance
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
                          onClick={() => !isSignalOngoing(signal) && openConfirmModal(signal)}
                          disabled={!canTrade || isSignalOngoing(signal)}
                          className="btn-primary rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center gap-2"
                          title={isSignalOngoing(signal) ? "Trade in progress" : !canTrade ? restriction?.message : undefined}
                        >
                          {isSignalOngoing(signal) ? (
                            "Ongoing"
                          ) : (
                            <>
                              Trade Now
                              <LuArrowRight className="w-4 h-4" />
                            </>
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
                <h3 className="text-lg font-semibold text-cyan-300 mb-3">💎 Referral Signals</h3>
                <p className="text-sm text-cyan-400/80">
                  Referral signals are sent by admin to selected users. You can use each signal once. No grant or allowance required.
                </p>
              </motion.div>
            </div>
          )}

          {/* WELCOME SWING SIGNALS Tab (from admin) */}
          {activeTab === "welcome" && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
              >
                <h2 className="text-xl font-semibold text-white mb-1">WELCOME SWING SIGNALS</h2>
                <p className="text-violet-400/90 text-sm mb-4">Sent by admin — use these to trade</p>
                {welcomeSignals.length === 0 ? (
                  <p className="text-zinc-400 text-center py-8">No WELCOME SWING SIGNALS from admin right now</p>
                ) : (
                  <div className="space-y-3">
                    {welcomeSignals.map((signal) => (
                      <div
                        key={signal.id}
                        className="flex items-center justify-between p-4 bg-violet-500/5 rounded-xl border border-violet-500/20"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">🎁</span>
                            <div>
                              <p className="text-white font-medium">{signal.title}</p>
                              <p className="text-violet-400/90 text-sm">
                                WELCOME SWING SIGNALS (from admin) • {formatSignalTimeUtc(signal) !== "—" ? `${formatSignalTimeUtc(signal)} • ` : ""}{signal.commitPercent}% of balance
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
                          onClick={() => !isSignalOngoing(signal) && openConfirmModal(signal)}
                          disabled={!canTrade || isSignalOngoing(signal)}
                          className="rounded-lg px-4 py-2 text-sm font-medium bg-violet-500 text-white hover:bg-violet-600 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center gap-2"
                          title={isSignalOngoing(signal) ? "Trade in progress" : !canTrade ? restriction?.message : undefined}
                        >
                          {isSignalOngoing(signal) ? (
                            "Ongoing"
                          ) : (
                            <>
                              Trade Now
                              <LuArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                            {item.outcome === "PROFIT" ? "+" : ""}${(item.resultAmount ?? 0).toFixed(2)}
                            {item.outcome === "PROFIT" && item.profitPercent != null && item.profitPercent > 0 && (
                              <span className="text-green-300/80 text-sm font-normal ml-1">
                                (+{Number(item.profitPercent).toFixed(2)}%)
                              </span>
                            )}
                          </p>
                          <p className="text-zinc-500 text-xs">
                            Committed: ${item.committedAmount.toFixed(2)}
                            {item.outcome === "LOSS" && " • Lost"}
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

      {/* Trade Now Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && confirmModal.signal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={closeConfirmModal}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <LuTrendingUp className="w-8 h-8 text-cyan-400" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white text-center mb-2">
                Start Trading?
              </h3>

              {/* Description */}
              <p className="text-zinc-400 text-center text-sm mb-6">
                You&apos;re about to start a trade using this signal. Make sure you&apos;re ready!
              </p>

              {/* Signal Details */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-sm">Signal</span>
                  <span className="text-white font-medium">{confirmModal.signal.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-sm">Type</span>
                  <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                    confirmModal.signal.type === "DAILY"
                      ? "bg-blue-500/20 text-blue-400"
                      : confirmModal.signal.type === "REFERRAL"
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "bg-violet-500/20 text-violet-400"
                  }`}>
                    {confirmModal.signal.type === "DAILY" ? "CORE" : confirmModal.signal.type === "REFERRAL" ? "REFERRAL" : "WELCOME"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-sm">Trading Time</span>
                  <span className="text-white font-medium">
                    {formatSignalTimeUtc(confirmModal.signal)} {confirmModal.signal.type}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-sm">Commit Amount</span>
                  <span className="text-white">{confirmModal.signal.commitPercent}% of balance</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                  <span className="text-zinc-400 text-sm">Estimated Trade</span>
                  <span className="text-green-400 font-bold text-lg">
                    ${getEstimatedCommit(confirmModal.signal).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-6">
                <span className="text-blue-400 text-lg">ℹ️</span>
                <p className="text-blue-400/80 text-xs">
                  You will be redirected to the trade page where you can confirm and execute your trade. Results will be available after ~30 seconds.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={closeConfirmModal}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-zinc-400 font-medium hover:bg-white/10 hover:text-white transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTradeNow}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  Trade Now
                  <LuArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
