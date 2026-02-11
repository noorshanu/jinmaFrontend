/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DashboardNavbar from "@/components/DashboardNavbar";
import {
  apiClient,
  WalletResponse,
  UserProfileResponse,
  SignalUsageResponse,
  Signal,
  SignalHistoryItem,
} from "@/lib/api";
import {
  LuTrendingUp,
  LuTrendingDown,
  LuRefreshCw,
  LuArrowRight,
  LuTicket,
  LuX,
} from "react-icons/lu";

type TradePhase = "READY" | "CONFIRMED" | "WAITING" | "SETTLED";

interface SignalData {
  signalId: string;
  signalTitle: string;
  signalType: "DAILY" | "REFERRAL" | "WELCOME";
  commitPercent: number;
  timeSlot: string;
  customTime?: string;
}

function TradeContent() {
  const searchParams = useSearchParams();

  // Signal from URL (when coming from Signals page)
  const signalDataFromUrl: SignalData | null = useMemo(() => {
    const signalId = searchParams.get("signalId");
    const signalTitle = searchParams.get("signalTitle");
    const signalType = searchParams.get("signalType") as "DAILY" | "REFERRAL" | "WELCOME" | null;
    const commitPercent = searchParams.get("commitPercent");
    const timeSlot = searchParams.get("timeSlot") || "";
    const customTime = searchParams.get("customTime") || undefined;
    if (!signalId || !signalTitle || !commitPercent) return null;
    const type = signalType === "WELCOME" || signalType === "REFERRAL" || signalType === "DAILY" ? signalType : "DAILY";
    return {
      signalId,
      signalTitle,
      signalType: type,
      commitPercent: parseFloat(commitPercent),
      timeSlot: timeSlot || (type === "WELCOME" ? "WELCOME" : ""),
      customTime,
    };
  }, [searchParams]);

  // Current trade signal (from URL or set after confirm from list)
  const [signalData, setSignalData] = useState<SignalData | null>(signalDataFromUrl);

  // Sync URL params to state when they change
  useEffect(() => {
    if (signalDataFromUrl) setSignalData(signalDataFromUrl);
  }, [signalDataFromUrl]);

  // Available signals & history (for main view)
  const [availableSignals, setAvailableSignals] = useState<Signal[]>([]);
  const [limits, setLimits] = useState<{ dailySignalsUsed?: number; referralSignalsRemaining?: number } | null>(null);
  const [loadingSignals, setLoadingSignals] = useState(true);
  const [history, setHistory] = useState<SignalHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Confirm modal: which signal user wants to use
  const [selectedSignalForConfirm, setSelectedSignalForConfirm] = useState<Signal | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Wallet & profile
  const [wallet, setWallet] = useState<WalletResponse["wallet"] | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Trade in progress
  const [phase, setPhase] = useState<TradePhase>("READY");
  const [usageId, setUsageId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [committedAmount, setCommittedAmount] = useState<number>(0);
  const [tradeResult, setTradeResult] = useState<SignalUsageResponse | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [pollingResult, setPollingResult] = useState(false);
  const [tradeBlockHidden, setTradeBlockHidden] = useState(false);

  // Live UTC time: set only on client to avoid hydration mismatch (server vs client would render different seconds)
  const [currentUTCTime, setCurrentUTCTime] = useState<string>("—");
  useEffect(() => {
    const format = () => {
      const now = new Date();
      return (
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "UTC",
          hour12: true,
        }) + " UTC"
      );
    };
    setCurrentUTCTime(format());
    const t = setInterval(() => setCurrentUTCTime(format()), 1000);
    return () => clearInterval(t);
  }, []);

  // Reset "block hidden" when trade is done so next trade shows the block again
  useEffect(() => {
    if (phase === "READY" && !usageId) setTradeBlockHidden(false);
  }, [phase, usageId]);

  const movementBalance = wallet?.movementBalance ?? 0;
  const betAmount = useMemo(
    () =>
      selectedSignalForConfirm
        ? movementBalance * (selectedSignalForConfirm.commitPercent / 100)
        : signalData
          ? movementBalance * (signalData.commitPercent / 100)
          : 0,
    [movementBalance, selectedSignalForConfirm, signalData]
  );

  /** Format time for display: use customTime (HH:mm) from admin or fallback by timeSlot */
  const getTradingTime = (slot: string, custom?: string | null) => {
    const ct = custom?.trim();
    if (ct && /^\d{1,2}:\d{2}$/.test(ct)) {
      const [h, m] = ct.split(":").map(Number);
      const hour = h % 24;
      const am = hour < 12;
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${hour12}:${m.toString().padStart(2, "0")} ${am ? "AM" : "PM"} UTC`;
    }
    switch (slot) {
      case "MORNING":
        return "9:00 AM UTC";
      case "EVENING":
        return "7:00 PM UTC";
      case "AFTERNOON":
      case "REFERRAL":
        return "3:00 PM UTC";
      case "WELCOME":
      case "CUSTOM":
        return "WELCOME SWING SIGNALS";
      default:
        return currentUTCTime;
    }
  };

  const getSignalTypeLabel = (type: string) => {
    if (type === "WELCOME") return "WELCOME SWING SIGNALS (from admin)";
    if (type === "REFERRAL") return "Referral";
    return "CORE SIGNALS";
  };

  const formatTimeRemaining = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) + " UTC";

  // Fetch wallet & profile
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingWallet(true);
        setLoadingProfile(true);
        const [walletRes, profileRes] = await Promise.all([
          apiClient.getWallet(),
          apiClient.getUserProfile(),
        ]);
        if (walletRes.success && walletRes.data) setWallet(walletRes.data.wallet);
        if (profileRes.success && profileRes.data) setUserProfile(profileRes.data);
      } catch {
        // ignore
      } finally {
        setLoadingWallet(false);
        setLoadingProfile(false);
      }
    };
    void fetchData();
  }, []);

  // Fetch available signals & history (when not in trade-in-progress)
  useEffect(() => {
    if (phase !== "READY" || usageId) return;
    const fetchSignalsAndHistory = async () => {
      setLoadingSignals(true);
      setLoadingHistory(true);
      try {
        const [signalsRes, historyRes] = await Promise.all([
          apiClient.getAvailableSignals(),
          apiClient.getSignalHistory(1, 20),
        ]);
        if (signalsRes.success && signalsRes.data) {
          setAvailableSignals(signalsRes.data.signals);
          setLimits(signalsRes.data.limits);
        }
        if (historyRes.success && historyRes.data) {
          setHistory(historyRes.data.history);
        }
      } catch {
        // ignore
      } finally {
        setLoadingSignals(false);
        setLoadingHistory(false);
      }
    };
    void fetchSignalsAndHistory();
  }, [phase, usageId]);

  // Load TradingView BTC chart (always)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("tradingview-widget-script")) {
      try {
        // @ts-expect-error TradingView injected by external script
        if (window.TradingView) {
          // @ts-expect-error TradingView injected by external script
          new window.TradingView.widget({
            container_id: "tv-btc-chart",
            symbol: "BINANCE:BTCUSDT",
            interval: "15",
            theme: "dark",
            style: "1",
            locale: "en",
            hide_top_toolbar: false,
            hide_legend: false,
            withdateranges: true,
            allow_symbol_change: false,
            autosize: true,
          });
        }
      } catch {
        // ignore
      }
      return;
    }
    const script = document.createElement("script");
    script.id = "tradingview-widget-script";
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      try {
        // @ts-expect-error TradingView injected by external script
        if (window.TradingView) {
          // @ts-expect-error TradingView injected by external script
          new window.TradingView.widget({
            container_id: "tv-btc-chart",
            symbol: "BINANCE:BTCUSDT",
            interval: "15",
            theme: "dark",
            style: "1",
            locale: "en",
            hide_top_toolbar: false,
            hide_legend: false,
            withdateranges: true,
            allow_symbol_change: false,
            autosize: true,
          });
        }
      } catch {
        // ignore
      }
    };
    document.body.appendChild(script);
  }, []);

  // Countdown
  useEffect(() => {
    if (!expiresAt || phase === "SETTLED") return;
    const update = () => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setTimeRemaining(remaining);
      if (remaining === 0 && phase === "WAITING") setPhase("SETTLED");
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, phase]);

  // Poll for result (interval kept slow to avoid 429; backend settles on first poll after expiry)
  const pollForResult = useCallback(async (): Promise<{ done: boolean; isRateLimited?: boolean }> => {
    if (!usageId) return { done: false };
    setPollingResult(true);
    try {
      const res = await apiClient.getSignalUsage(usageId);
      if (res.success && res.data && res.data.outcome !== "PENDING") {
        setTradeResult(res.data);
        setShowResultModal(true);
        return { done: true };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Too many requests") || msg === "Failed to fetch") return { done: false, isRateLimited: true };
    } finally {
      setPollingResult(false);
    }
    return { done: false };
  }, [usageId]);

  useEffect(() => {
    if (phase !== "SETTLED" || !usageId) return;
    let cancelled = false;
    let attempts = 0;
    const POLL_INTERVAL_MS = 5000;   // 5 sec normal
    const POLL_INTERVAL_429_MS = 15000; // 15 sec after rate limit
    const poll = async () => {
      if (cancelled || attempts >= 40) return; // ~3 min max at 5s
      const { done, isRateLimited } = await pollForResult();
      if (cancelled) return;
      if (done) return;
      attempts++;
      const delay = isRateLimited ? POLL_INTERVAL_429_MS : POLL_INTERVAL_MS;
      setTimeout(poll, delay);
    };
    poll();
    return () => { cancelled = true; };
  }, [phase, usageId]); // intentionally omit pollForResult to avoid restarting loop

  const isTradingActive = userProfile?.isTradingActive ?? false;
  const hasMinBalance = movementBalance >= 250;
  const canTrade = hasMinBalance && isTradingActive;
  const restriction = !hasMinBalance
    ? { type: "balance" as const, title: "Insufficient Balance", message: "Movement balance below $250. Add balance to trade." }
    : !isTradingActive
      ? { type: "inactive" as const, title: "Trading account not activated", message: "Please deposit and contact admin to activate your trading account to unlock all benefits." }
      : null;

  const handleConfirmTrade = async () => {
    const signal = selectedSignalForConfirm;
    if (!signal) return;
    setConfirming(true);
    setConfirmError(null);
    try {
      const res = await apiClient.confirmSignal(signal.id);
      if (res.success && res.data) {
        setSignalData({
          signalId: signal.id,
          signalTitle: signal.title,
          signalType: signal.type,
          commitPercent: signal.commitPercent,
          timeSlot: signal.timeSlot,
          customTime: signal.customTime ?? undefined,
        });
        setUsageId(res.data.id);
        setCommittedAmount(res.data.committedAmount);
        setExpiresAt(new Date(res.data.settlesAt));
        setSelectedSignalForConfirm(null);
        setPhase("WAITING");
      }
    } catch (err: unknown) {
      setConfirmError(err instanceof Error ? err.message : "Failed to confirm trade");
    } finally {
      setConfirming(false);
    }
  };

  const pendingHistory = history.filter((h) => h.outcome === "PENDING");
  const settledHistory = history.filter((h) => h.outcome !== "PENDING");

  const totalProfitLoss = useMemo(() => {
    let profit = 0;
    let loss = 0;
    for (const h of history) {
      if (h.outcome === "PROFIT" && h.resultAmount != null) profit += h.resultAmount;
      if (h.outcome === "LOSS" && h.resultAmount != null) loss += Math.abs(h.resultAmount);
    }
    return { totalProfit: profit, totalLoss: loss };
  }, [history]);

  return (
    <>
      <DashboardNavbar />
      <div className="min-h-screen bg-grid pt-24 pb-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Page title */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Trade
            </h1>
            <p className="text-zinc-400 text-sm mt-1">BTC/USDT • Use a signal to start a trade</p>
          </motion.div>

          {/* 1. BTC Live Chart - always visible */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-zinc-400">BTC/USDT Live Chart</p>
                <p className="text-lg font-semibold text-white">TradingView</p>
              </div>
              <p className="text-xs text-zinc-500">{currentUTCTime}</p>
            </div>
            <div className="relative h-[400px] w-full overflow-hidden bg-black/40 rounded-xl">
              <div id="tv-btc-chart" className="h-full w-full" />
            </div>
          </motion.div>

          {/* Restriction warning */}
          {restriction && (
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
                <span className="text-2xl">{restriction.type === "balance" ? "💰" : "⚠️"}</span>
                <div>
                  <h3 className={`font-semibold ${restriction.type === "balance" ? "text-yellow-300" : "text-orange-300"}`}>
                    {restriction.title}
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">{restriction.message}</p>
                  {restriction.type === "balance" && (
                    <Link
                      href="/dashboard/transfer"
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg text-sm font-medium"
                    >
                      Add Balance →
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. Trade in progress (countdown / result section) - hide on close, trade runs in background */}
          {(phase === "WAITING" || phase === "SETTLED") && signalData && !tradeBlockHidden && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {timeRemaining > 0 ? "⏳" : !tradeResult ? "₿" : "✅"}
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {timeRemaining > 0
                        ? "Trade in progress"
                        : !tradeResult
                          ? "Result on the way..."
                          : "Trade completed"}
                    </h2>
                    <p className="text-zinc-400 text-sm">
                      {signalData.signalTitle} • ${committedAmount.toFixed(2)} locked
                      {timeRemaining > 0 && ` • ${formatTime(timeRemaining)} left`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTradeBlockHidden(true)}
                  className="shrink-0 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Minimize – trade continues in background"
                >
                  <LuX className="w-5 h-5" aria-hidden />
                </button>
              </div>
              <div className="border-t border-white/10 p-6 pt-2 text-center">
                {timeRemaining > 0 && (
                  <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
                    {formatTime(timeRemaining)}
                  </div>
                )}
                {!tradeResult && timeRemaining <= 0 && (
                  <p className="text-amber-400/90 text-sm mb-2">Settling your trade</p>
                )}
                <div className="w-full max-w-md mx-auto bg-white/5 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                    animate={{
                      width: `${timeRemaining <= 0 ? 100 : Math.max(0, 100 - (timeRemaining / 900) * 100)}%`,
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. Signals to use (when READY with no active trade, or WAITING so user sees list with "Trade running" disabled) */}
          {((phase === "READY" && !usageId) || phase === "WAITING") && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
              >
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <LuTicket className="w-5 h-5 text-blue-400" />
                  Signals to use
                  {phase === "WAITING" && (
                    <span className="ml-2 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                      Trade running
                    </span>
                  )}
                </h2>
                {loadingSignals ? (
                  <div className="flex items-center justify-center py-12">
                    <LuRefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                  </div>
                ) : availableSignals.length === 0 ? (
                  <div className="text-center py-12 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-zinc-400 font-medium">No signal</p>
                    <p className="text-sm text-zinc-500 mt-1">There are no signals available to use right now.</p>
                    <Link
                      href="/dashboard/signals"
                      className="mt-4 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                    >
                      View Signals page <LuArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableSignals.map((s) => {
                      const isRunningTrade = phase === "WAITING" && signalData && s.id === signalData.signalId;
                      return (
                        <div
                          key={s.id}
                          className={`flex items-center justify-between p-4 rounded-xl border ${
                            s.type === "WELCOME" ? "bg-violet-500/5 border-violet-500/20" : "bg-white/5 border-white/10"
                          }`}
                        >
                          <div>
                            <p className="font-medium text-white">{s.title}</p>
                            <p className="text-sm text-zinc-400">
                              {getSignalTypeLabel(s.type)} • {getTradingTime(s.timeSlot, s.customTime)} • {s.commitPercent}% of balance • {formatTimeRemaining(s.timeRemaining)} left
                            </p>
                          </div>
                          <button
                            onClick={() => !isRunningTrade && phase === "READY" && setSelectedSignalForConfirm(s)}
                            disabled={isRunningTrade || !canTrade}
                            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isRunningTrade ? "Trade running" : !canTrade ? restriction?.message : undefined}
                          >
                            {isRunningTrade ? "Trade running" : "Use"} <LuArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* 4. Trade history */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
              >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-white">Trade history</h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-400">
              Profit: ${totalProfitLoss.totalProfit.toFixed(2)}
            </span>
            <span className="text-red-400">
              Loss: ${totalProfitLoss.totalLoss.toFixed(2)}
            </span>
            <span className="text-zinc-400">
              Movement: ${(wallet?.movementBalance ?? 0).toFixed(2)}
            </span>
          </div>
          </div>
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <LuRefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-zinc-400 text-center py-8">No trades yet</p>
                ) : (
                  <div className="space-y-3">
                    {pendingHistory.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-yellow-400 mb-2">Pending</p>
                        {pendingHistory.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-2"
                          >
                            <div>
                              <p className="text-white text-sm font-medium">{item.signal?.title || "Signal"}</p>
                              <p className="text-zinc-400 text-xs">{formatDate(item.confirmedAt)}</p>
                            </div>
                            <span className="text-yellow-400 text-sm font-medium">
                              ${item.committedAmount.toFixed(2)} • Awaiting result
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-zinc-500 mb-2">Settled</p>
                    {settledHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10"
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
                            <p className="text-white text-sm font-medium">{item.signal?.title || "Signal"}</p>
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
                              <span className="text-green-300/80 text-xs ml-1">(+{Number(item.profitPercent).toFixed(2)}%)</span>
                            )}
                          </p>
                          <p className="text-zinc-500 text-xs">Committed: ${item.committedAmount.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* If user came from Signals page with URL params */}
              {signalDataFromUrl && availableSignals.some((x) => x.id === signalDataFromUrl.signalId) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-6 rounded-2xl p-6 ${
                    signalDataFromUrl.signalType === "WELCOME"
                      ? "bg-violet-500/10 border border-violet-500/20"
                      : "bg-blue-500/10 border border-blue-500/20"
                  }`}
                >
                  <p className="text-zinc-300 text-sm mb-2">You selected from Signals page</p>
                  <p className="text-white font-medium">{signalDataFromUrl.signalTitle}</p>
                  <p className="text-zinc-400 text-sm mt-1">
                    {getSignalTypeLabel(signalDataFromUrl.signalType)} • {getTradingTime(signalDataFromUrl.timeSlot, signalDataFromUrl.customTime)} • {signalDataFromUrl.commitPercent}% of balance
                  </p>
                  {(() => {
                    const isRunningTrade = phase === "WAITING" && signalData && signalDataFromUrl.signalId === signalData.signalId;
                    return (
                      <button
                        onClick={() => {
                          if (isRunningTrade) return;
                          const s = availableSignals.find((x) => x.id === signalDataFromUrl.signalId);
                          if (s) setSelectedSignalForConfirm(s);
                        }}
                        disabled={isRunningTrade || !canTrade}
                        className="mt-4 flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                      >
                        {isRunningTrade ? "Trade running" : "Use"} <LuArrowRight className="w-4 h-4" />
                      </button>
                    );
                  })()}
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirm use signal modal */}
      <AnimatePresence>
        {selectedSignalForConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-white/10 p-6 shadow-2xl"
            >
              <div className="text-center mb-4">
                <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                  <LuTrendingUp className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Confirm trade</h3>
                <p className="text-zinc-400 text-sm mt-1">
                  Use this signal to start a trade. Amount will be locked until result.
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Signal</span>
                  <span className="text-white font-medium">{selectedSignalForConfirm.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Type</span>
                  <span className="text-white">{getSignalTypeLabel(selectedSignalForConfirm.type)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Time (UTC)</span>
                  <span className="text-white">{getTradingTime(selectedSignalForConfirm.timeSlot, selectedSignalForConfirm.customTime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Commit</span>
                  <span className="text-white">{selectedSignalForConfirm.commitPercent}% of balance</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                  <span className="text-zinc-400">Amount to lock</span>
                  <span className="text-green-400 font-bold">
                    ${betAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              {confirmError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 text-sm">{confirmError}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedSignalForConfirm(null);
                    setConfirmError(null);
                  }}
                  disabled={confirming}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmTrade}
                  disabled={confirming || !canTrade}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 py-3 text-sm font-semibold text-white hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {confirming ? (
                    <>
                      <LuRefreshCw className="w-4 h-4 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      Confirm & start trade <LuArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result modal */}
      <AnimatePresence>
        {showResultModal && tradeResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.6, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`w-full max-w-lg rounded-3xl border shadow-2xl p-8 ${
                tradeResult.outcome === "PROFIT"
                  ? "bg-gradient-to-b from-emerald-950/90 to-slate-950 border-emerald-500/40"
                  : "bg-gradient-to-b from-red-950/90 to-slate-950 border-red-500/40"
              }`}
            >
              <div className="text-center">
                <span className="text-6xl">{tradeResult.outcome === "PROFIT" ? "🎉" : "📉"}</span>
                <p
                  className={`text-4xl font-extrabold mt-4 ${
                    tradeResult.outcome === "PROFIT" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {tradeResult.outcome === "PROFIT" ? "WIN!" : "LOSS"}
                </p>
                <p className="text-lg text-zinc-300 mt-2">
                  {tradeResult.outcome === "PROFIT"
                    ? `+${Number(tradeResult.profitPercent).toFixed(2)}% profit`
                    : "-100% of committed amount"}
                </p>
                <p className={`text-2xl font-bold mt-2 ${tradeResult.outcome === "PROFIT" ? "text-emerald-400" : "text-red-400"}`}>
                  {tradeResult.outcome === "PROFIT" ? "+" : ""}
                  ${Math.abs(tradeResult.resultAmount).toFixed(2)}
                </p>
                <div className="mt-6 space-y-2 text-sm text-zinc-400">
                  <p>Committed: ${tradeResult.committedAmount.toFixed(2)}</p>
                  <p>New balance: ${tradeResult.movementBalanceAfter.toFixed(2)}</p>
                </div>
                <div className="flex gap-3 mt-8">
                  <Link
                    href="/dashboard/trade"
                    className="flex-1 rounded-xl bg-white/10 py-3 text-sm font-medium text-white hover:bg-white/20 text-center"
                    onClick={() => setShowResultModal(false)}
                  >
                    Trade again
                  </Link>
                  <Link
                    href="/dashboard"
                    className={`flex-1 rounded-xl py-3 text-sm font-semibold text-center ${
                      tradeResult.outcome === "PROFIT"
                        ? "bg-emerald-500 text-black hover:bg-emerald-400"
                        : "bg-blue-500 text-white hover:bg-blue-400"
                    }`}
                  >
                    Dashboard
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function TradePage() {
  return (
    <Suspense
      fallback={
        <>
          <DashboardNavbar />
          <div className="min-h-screen bg-grid pt-24 pb-8 px-4 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4" />
              <p className="text-zinc-400">Loading...</p>
            </div>
          </div>
        </>
      }
    >
      <TradeContent />
    </Suspense>
  );
}
