/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DashboardNavbar from "@/components/DashboardNavbar";
import { apiClient, WalletResponse } from "@/lib/api";

type TradeResult = "PENDING" | "WIN" | "LOSS";

function TradeContent() {
  const searchParams = useSearchParams();
  const couponCode = searchParams.get("coupon") || "COUPON-A";
  const [timeRemaining, setTimeRemaining] = useState(30); // 30 seconds session
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [tradeResult, setTradeResult] = useState<TradeResult>("PENDING");
  const [wallet, setWallet] = useState<WalletResponse["wallet"] | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  // For now, use a fixed coupon percentage; later this can come from backend
  const couponPercentage = 10;

  const movementBalance = wallet?.movementBalance ?? 0;
  const betAmount = useMemo(
    () => movementBalance * (couponPercentage / 100),
    [movementBalance, couponPercentage]
  );

  // Fetch real wallet (movement balance)
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setLoadingWallet(true);
        setWalletError(null);
        const res = await apiClient.getWallet();
        if (res.success && res.data) {
          setWallet(res.data.wallet);
        }
      } catch (err: unknown) {
        setWalletError(
          err instanceof Error ? err.message : "Failed to load wallet balance."
        );
      } finally {
        setLoadingWallet(false);
      }
    };
    void fetchWallet();
  }, []);

  // Load TradingView BTC chart
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Avoid injecting the script multiple times
    if (document.getElementById("tradingview-widget-script")) {
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
      return;
    }

    const script = document.createElement("script");
    script.id = "tradingview-widget-script";
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
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
    };
    document.body.appendChild(script);

    return () => {
      // We do not remove tv.js to allow reuse across navigations
    };
  }, []);

  // Countdown timer and result calculation
  useEffect(() => {
    if (!isConfirmed || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isConfirmed, timeRemaining]);

  // When timer finishes, generate a mock result (for UI)
  useEffect(() => {
    if (isConfirmed && timeRemaining === 0 && tradeResult === "PENDING") {
      const win = Math.random() < 0.6; // 60% chance win, just for demo
      const result: TradeResult = win ? "WIN" : "LOSS";
      setTradeResult(result);
      setShowResultModal(true);
    }
  }, [isConfirmed, timeRemaining, tradeResult]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleUseCoupon = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmTrade = () => {
    setShowConfirmModal(false);
    setIsConfirmed(true);
    setTimeRemaining(30);
    setTradeResult("PENDING");
    // TODO: call backend to lock amount & create trade session
  };

  const handleCancelTrade = () => {
    setShowConfirmModal(false);
  };

  const handleCloseResultModal = () => {
    setShowResultModal(false);
  };

  return (
    <>
      <DashboardNavbar />
      <div className="min-h-screen bg-grid pt-24 pb-8 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* <Link
            href="/dashboard/coupons"
            className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block transition-colors"
          >
            ← Back to Coupons
          </Link> */}
          {/* <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Trading Session
            </span>
          </h1> */}
          {/* <p className="text-zinc-400">Use your coupon to trade BTC/USDT</p> */}
        </motion.div>

        {/* BTC Live Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-zinc-400">BTC/USDT Live Chart</p>
              <p className="text-lg font-semibold text-white">TradingView</p>
            </div>
          </div>
          <div className="relative h-[460px] w-full overflow-hidden  bg-black/40">
            <div id="tv-btc-chart" className="h-full w-full" />
          </div>
        </motion.div>

        {!isConfirmed ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl"
          >
          {/* Coupon Info */}
          <div className="mb-6">
            <p className="text-sm text-zinc-400 mb-2">Available Coupon</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                <p className="text-xs uppercase tracking-wide text-blue-300 mb-1">
                  Coupon
                </p>
                <p className="text-lg font-semibold text-white mb-1">{couponCode}</p>
                <p className="text-sm text-blue-200 mb-3">
                  Uses <span className="font-semibold">{couponPercentage}%</span> of your Movement
                  Account balance.
                </p>
                <button
                  onClick={handleUseCoupon}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400 transition-colors"
                >
                  Use Coupon
                </button>
              </div>
            </div>
          </div>

          {/* Trading Details */}
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-zinc-400 text-sm mb-1">Movement Account Balance</p>
                  <p className="text-2xl font-bold text-white">
                  {loadingWallet
                    ? "Loading..."
                    : walletError
                    ? "Error"
                    : `$${movementBalance.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
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
                    ${betAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
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
                    <span className="font-medium">30 seconds</span>
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
                  ⚠️ Once confirmed, the amount will be locked and results will be credited after 30 seconds.
                  You cannot cancel the trade after confirmation.
                </p>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleUseCoupon}
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
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl grid gap-8 md:grid-cols-[2fr,1.3fr]"
          >
          {/* Left side: progress & timer */}
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-4xl">⏳</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {timeRemaining > 0 ? "Trading in Progress" : "Trade Completed"}
              </h2>
              <p className="text-zinc-400">
                {timeRemaining > 0
                  ? "Your trade is being processed"
                  : "Your result has been calculated"}
              </p>
            </div>

            {/* Timer */}
            <div className="mb-6">
              <div className="text-6xl font-bold text-blue-400 mb-2">
                {formatTime(timeRemaining)}
              </div>
              <p className="text-zinc-400 text-sm">
                {timeRemaining > 0 ? "Time remaining until results" : "Session finished"}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/5 rounded-full h-2 mb-6">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((30 - timeRemaining) / 30) * 100}%` }}
              />
            </div>

            {/* Locked Amount Info */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-zinc-400 text-sm mb-1">Locked Amount</p>
              <p className="text-2xl font-bold text-white">
                ${betAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          {/* Right side: Result card */}
          <div className="rounded-2xl bg-black/40 border border-white/10 p-6 flex flex-col justify-between">
            <div>
              <p className="text-sm text-zinc-400 mb-2">Trade Result</p>
              {tradeResult === "PENDING" || timeRemaining > 0 ? (
                <p className="text-lg text-zinc-300">
                  Result will be available once the session ends.
                </p>
              ) : tradeResult === "WIN" ? (
                <>
                  <p className="text-3xl font-bold text-green-400 mb-2">WIN</p>
                  <p className="text-sm text-green-300 mb-4">
                    Congratulations! Your coupon trade finished in profit.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-red-400 mb-2">LOSS</p>
                  <p className="text-sm text-red-300 mb-4">
                    This time the trade closed at a loss. Your locked amount has been
                    deducted.
                  </p>
                </>
              )}
            </div>

            <div className="mt-4 space-y-2 text-sm text-zinc-300">
              <div className="flex justify-between">
                <span>Amount used:</span>
                <span className="font-semibold">
                  ${betAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Trade Type:</span>
                <span className="font-semibold">Coupon ({couponCode})</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/dashboard"
                className="w-full inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-black hover:bg-green-400 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
          </motion.div>
        )}
      </div>
    </div>

    {/* Confirm coupon modal */}
    <AnimatePresence>
      {showConfirmModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="w-full max-w-md rounded-2xl bg-zinc-950/90 border border-white/10 shadow-2xl p-6 backdrop-blur-xl"
          >
            <div className="mb-4 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-400 mb-2">
                Confirm Coupon
              </p>
              <h3 className="text-xl font-semibold text-white mb-1">
                Use {couponCode} for this trade?
              </h3>
              <p className="text-sm text-zinc-400">
                This will lock{" "}
                <span className="font-semibold text-blue-300">
                  {couponPercentage}% of your Movement balance
                </span>{" "}
                ({movementBalance > 0
                  ? `$${betAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "balance not loaded yet"}
                ) for a 30 second session.
              </p>
            </div>

            <div className="flex items-center justify-between mb-6 rounded-xl bg-black/40 border border-white/10 px-4 py-3">
              <div>
                <p className="text-xs text-zinc-500">Movement Balance</p>
                <p className="text-sm font-semibold text-white">
                  {loadingWallet || !wallet
                    ? "Loading..."
                    : `$${movementBalance.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">Amount to lock</p>
                <p className="text-sm font-semibold text-blue-300">
                  ${betAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelTrade}
                className="w-1/2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTrade}
                className="w-1/2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/30"
              >
                Confirm &amp; Start
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Result modal */}
      {showResultModal && tradeResult !== "PENDING" && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.8,
              y: 30,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              boxShadow:
                tradeResult === "WIN"
                  ? "0 0 40px rgba(34,197,94,0.55)"
                  : "0 0 40px rgba(248,113,113,0.4)",
            }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/40 shadow-2xl p-6 md:p-8 backdrop-blur-2xl text-left relative overflow-hidden"
          >
            {/* Glow background */}
            <div
              className={`pointer-events-none absolute inset-x-0 -top-32 h-64 blur-3xl opacity-60 ${
                tradeResult === "WIN"
                  ? "bg-emerald-500/40"
                  : "bg-red-500/30"
              }`}
            />

            {/* Content */}
            <div className="relative flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80 mb-2">
                  Trade Result
                </p>
                <motion.p
                  key={tradeResult}
                  initial={{ scale: 0.9, opacity: 0, y: -10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`text-4xl md:text-5xl font-extrabold mb-1 ${
                    tradeResult === "WIN"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {tradeResult === "WIN" ? "WIN" : "LOSS"}
                </motion.p>
                <p
                  className={`text-sm md:text-base mb-4 ${
                    tradeResult === "WIN"
                      ? "text-emerald-300"
                      : "text-red-300"
                  }`}
                >
                  {tradeResult === "WIN"
                    ? "+60% Profit (Demo)"
                    : "-100% of committed amount"}
                </p>

                <div className="space-y-1 text-sm text-zinc-300 mb-5">
                  <div className="flex justify-between">
                    <span>Amount used:</span>
                    <span className="font-semibold">
                      ${betAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trade Type:</span>
                    <span className="font-semibold">
                      Long (Coupon {couponCode})
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                  {/* <button
                    type="button"
                    onClick={handleCloseResultModal}
                    className="flex-1 rounded-xl bg-zinc-900/80 px-4 py-2.5 text-sm font-medium text-zinc-100 hover:bg-zinc-800 transition-colors border border-zinc-700/70"
                  >
                    Back to Trade
                  </button> */}
                  <Link
                    href="/dashboard"
                    className="flex-1 inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/40"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </div>

              {/* Mini chart visual */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full md:w-56 rounded-2xl bg-slate-950/70 border border-emerald-500/30 p-3 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">
                      <span className="text-amber-300 font-semibold">₿</span>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Asset</p>
                      <p className="text-sm font-semibold text-white">
                        BTC / USDT
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative h-28 w-full overflow-hidden rounded-xl bg-slate-900">
                  <img
                    src="/chart.png"
                    alt="BTC result chart"
                    className="object-cover opacity-90"
                  />
                </div>
              </motion.div>
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
    <Suspense fallback={
      <>
        <DashboardNavbar />
        <div className="min-h-screen bg-grid pt-24 pb-8 px-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-zinc-400">Loading trade session...</p>
          </div>
        </div>
      </>
    }>
      <TradeContent />
    </Suspense>
  );
}
