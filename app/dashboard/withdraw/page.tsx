"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardNavbar from "@/components/DashboardNavbar";
import DashboardFooter from "@/components/DashboardFooter";
import { apiClient } from "@/lib/api";
import {
  LuWallet,
  LuClock,
  LuCircleCheck,
  LuCircleX,
  LuTriangleAlert,
  LuSend,
  LuCalendar,
  LuInfo,
  LuX,
  LuExternalLink,
  LuArrowRight,
  LuInbox,
  LuRefreshCw,
  LuBan,
} from "react-icons/lu";

interface WithdrawalSettings {
  isWithdrawalOpen: boolean;
  isWithdrawalEnabled: boolean;
  nextWithdrawalDate: string | null;
  withdrawalEndDate: string | null;
  minAmount: number;
  maxAmount: number;
  feePercent: number;
  flatFee: number;
  message: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;
  walletAddress: string;
  network: string;
  token: string;
  status: string;
  adminNote: string | null;
  rejectionReason: string | null;
  transactionHash: string | null;
  createdAt: string;
  approvedAt: string | null;
}

interface Wallet {
  mainBalance: number;
  movementBalance: number;
  totalBalance: number;
}

export default function WithdrawPage() {
  const [settings, setSettings] = useState<WithdrawalSettings | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, historyRes, walletRes] = await Promise.all([
        apiClient.getWithdrawalSettings(),
        apiClient.getWithdrawalHistory(1, 10),
        apiClient.getWallet(),
      ]);

      if (settingsRes.success && settingsRes.data) {
        setSettings(settingsRes.data.settings);
      }
      if (historyRes.success && historyRes.data) {
        setWithdrawals(historyRes.data.withdrawals);
      }
      if (walletRes.success && walletRes.data) {
        setWallet(walletRes.data.wallet);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!walletAddress.trim()) {
      setError("Please enter a wallet address");
      return;
    }

    setSubmitting(true);

    try {
      const res = await apiClient.createWithdrawal(
        parseFloat(amount),
        walletAddress.trim()
      );

      if (res.success) {
        setSuccess("Withdrawal request submitted successfully!");
        setAmount("");
        setWalletAddress("");
        fetchData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit withdrawal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!cancellingId) return;

    try {
      await apiClient.cancelWithdrawal(cancellingId);
      setShowCancelModal(false);
      setCancellingId(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel withdrawal");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateFee = () => {
    if (!settings || !amount) return 0;
    const amountNum = parseFloat(amount) || 0;
    const percentFee = (amountNum * settings.feePercent) / 100;
    return percentFee + settings.flatFee;
  };

  const calculateNetAmount = () => {
    const amountNum = parseFloat(amount) || 0;
    return Math.max(0, amountNum - calculateFee());
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <LuClock size={18} className="text-yellow-400" />;
      case "completed":
      case "approved":
        return <LuCircleCheck size={18} className="text-green-400" />;
      case "rejected":
        return <LuCircleX size={18} className="text-red-400" />;
      default:
        return <LuClock size={18} className="text-zinc-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "completed":
      case "approved":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  if (loading) {
    return (
      <>
        <DashboardNavbar />
        <div className="min-h-screen bg-grid pt-24 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  const hasPendingWithdrawal = withdrawals.some((w) => w.status === "pending");

  return (
    <>
      <DashboardNavbar />
      <div className="min-h-screen bg-grid pt-36 sm:pt-24 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
            <h1 className="text-3xl font-bold text-white mb-2">Withdraw</h1>
            <p className="text-zinc-400">
              Withdraw USDT to your TRC20 wallet
            </p>
        </motion.div>

          {/* Withdrawal Schedule Banner - Always show if dates are set */}
          {settings && (settings.nextWithdrawalDate || settings.withdrawalEndDate) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-xl ${
                settings.isWithdrawalOpen
                  ? "bg-green-500/10 border border-green-500/20"
                  : "bg-yellow-500/10 border border-yellow-500/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <LuCalendar
                  size={24}
                  className={`flex-shrink-0 mt-0.5 ${
                    settings.isWithdrawalOpen ? "text-green-400" : "text-yellow-400"
                  }`}
                />
                <div>
                  <h3
                    className={`font-semibold mb-1 ${
                      settings.isWithdrawalOpen ? "text-green-400" : "text-yellow-400"
                    }`}
                  >
                    {settings.isWithdrawalOpen
                      ? "Withdrawal Window Open"
                      : "Withdrawals are currently closed"}
                  </h3>
                  {settings.isWithdrawalOpen ? (
                    <p className="text-zinc-300 text-sm">
                      {settings.nextWithdrawalDate && (
                        <>
                          Opened on{" "}
                          <span className="text-white font-medium">
                            {formatDate(settings.nextWithdrawalDate)}
                          </span>
                        </>
                      )}
                      {settings.withdrawalEndDate && (
                        <>
                          {settings.nextWithdrawalDate ? " • " : ""}Closes on{" "}
                          <span className="text-white font-medium">
                            {formatDate(settings.withdrawalEndDate)}
                          </span>
                        </>
                      )}
                    </p>
                  ) : settings.nextWithdrawalDate ? (
                    <p className="text-zinc-300 text-sm">
                      Next withdrawal window opens on{" "}
                      <span className="text-white font-medium">
                        {formatDate(settings.nextWithdrawalDate)}
                      </span>
                      {settings.withdrawalEndDate && (
                        <>
                          {" "}and closes on{" "}
                          <span className="text-white font-medium">
                            {formatDate(settings.withdrawalEndDate)}
                          </span>
                        </>
                      )}
                    </p>
                  ) : (
                    <p className="text-zinc-300 text-sm">
                      Please check back later for the next withdrawal window.
                    </p>
                  )}
                  {settings.message && (
                    <p className="text-zinc-400 text-sm mt-2">{settings.message}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Withdrawal Disabled Banner */}
          {settings && !settings.isWithdrawalEnabled && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <LuTriangleAlert size={24} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-400 mb-1">
                    Withdrawals Disabled
                  </h3>
                  <p className="text-zinc-300 text-sm">
                    Withdrawals are currently disabled. Please check back later.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Withdrawal Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <LuSend size={20} className="text-blue-400" />
                  Withdrawal Request
                </h2>

                {error && (
                  <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                    <LuTriangleAlert size={18} />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400">
                    <LuCircleCheck size={18} />
                    {success}
                  </div>
                )}

                {hasPendingWithdrawal && (
                  <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-3 text-yellow-400">
                    <LuInfo size={18} />
                    You have a pending withdrawal. Please wait for it to be processed.
            </div>
          )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Available Balance */}
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-sm">Available Balance (Main Wallet)</span>
                      <span className="text-white font-semibold">
                        ${wallet?.mainBalance.toFixed(2) || "0.00"}
                      </span>
                    </div>
          </div>

                  {/* Amount */}
            <div>
                    <label className="block text-sm text-zinc-400 mb-2">
                      Amount (USD)
              </label>
              <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                        $
                      </span>
                <input
                  type="number"
                        step="0.01"
                        min={settings?.minAmount || 1}
                        max={Math.min(settings?.maxAmount || 10000, wallet?.mainBalance || 0)}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                        disabled={!settings?.isWithdrawalOpen || hasPendingWithdrawal}
                        className="w-full pl-8 pr-20 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                  <button
                    type="button"
                        onClick={() => setAmount(String(wallet?.mainBalance || 0))}
                        disabled={!settings?.isWithdrawalOpen || hasPendingWithdrawal}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 rounded-lg disabled:opacity-50"
                      >
                        MAX
                  </button>
              </div>
                    {settings && (
                      <p className="text-zinc-500 text-xs mt-1">
                        Min: ${settings.minAmount} • Max: ${settings.maxAmount}
                      </p>
                    )}
            </div>

                  {/* TRC20 Address */}
            <div>
                    <label className="block text-sm text-zinc-400 mb-2">
                      TRC20 Wallet Address (USDT)
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="T..."
                      disabled={!settings?.isWithdrawalOpen || hasPendingWithdrawal}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
                    />
                    <p className="text-zinc-500 text-xs mt-1">
                      Only TRC20 network is supported. Make sure your address is correct.
              </p>
            </div>

                  {/* Fee Breakdown */}
                  {amount && parseFloat(amount) > 0 && (
                    <div className="p-4 bg-white/5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Withdrawal Amount</span>
                        <span className="text-white">${parseFloat(amount).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">
                          Fee ({settings?.feePercent}% + ${settings?.flatFee})
                        </span>
                        <span className="text-red-400">-${calculateFee().toFixed(2)}</span>
                      </div>
                      <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                        <span className="text-zinc-300 font-medium">You will receive</span>
                        <span className="text-green-400 font-semibold">
                          ${calculateNetAmount().toFixed(2)} USDT
                        </span>
                      </div>
            </div>
                  )}

            {/* Submit Button */}
            <button
              type="submit"
                    disabled={
                      submitting ||
                      !settings?.isWithdrawalOpen ||
                      hasPendingWithdrawal ||
                      !amount ||
                      !walletAddress
                    }
                    className="w-full py-4 bg-[#3e82f0] rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <LuSend size={18} />
                        Submit Withdrawal Request
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>

            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <LuInfo size={18} className="text-blue-400" />
                  Important Info
                </h3>
                <ul className="space-y-3 text-sm text-zinc-300">
                  <li className="flex items-start gap-2">
                    <LuArrowRight size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Only <strong className="text-white">USDT TRC20</strong> withdrawals are supported.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <LuArrowRight size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Withdrawals are processed manually and may take up to 24 hours.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <LuArrowRight size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Double-check your wallet address. Funds sent to wrong addresses cannot be recovered.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <LuArrowRight size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>You will receive an email notification when your withdrawal is processed.</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Withdrawal History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Withdrawal History</h2>
              <button
                onClick={fetchData}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <LuRefreshCw size={18} />
              </button>
            </div>

            {withdrawals.length === 0 ? (
              <div className="p-12 text-center">
                <LuInbox size={40} className="text-zinc-500 mx-auto mb-4" />
                <p className="text-zinc-400">No withdrawal history</p>
                <p className="text-zinc-500 text-sm mt-1">
                  Your withdrawal requests will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {withdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <LuWallet size={20} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            ${withdrawal.amount.toFixed(2)}
                            <span className="text-zinc-500 text-sm ml-2">
                              (Net: ${withdrawal.netAmount.toFixed(2)} USDT)
                            </span>
                          </p>
                          <p className="text-zinc-500 text-sm">
                            {formatDate(withdrawal.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(
                            withdrawal.status
                          )}`}
                        >
                          {getStatusIcon(withdrawal.status)}
                          {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                        </span>
                        {withdrawal.status === "pending" && (
                          <button
                            onClick={() => {
                              setCancellingId(withdrawal.id);
                              setShowCancelModal(true);
                            }}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Cancel withdrawal"
                          >
                            <LuBan size={16} />
            </button>
                        )}
                      </div>
                    </div>
                    <div className="ml-13 pl-13 text-sm">
                      <p className="text-zinc-400 font-mono text-xs truncate">
                        To: {withdrawal.walletAddress}
                      </p>
                      {withdrawal.transactionHash && (
                        <a
                          href={`https://tronscan.org/#/transaction/${withdrawal.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 mt-1"
                        >
                          <LuExternalLink size={12} />
                          View Transaction
                        </a>
                      )}
                      {withdrawal.rejectionReason && (
                        <p className="text-red-400 text-xs mt-1">
                          Reason: {withdrawal.rejectionReason}
                        </p>
                      )}
                      {withdrawal.adminNote && (
                        <p className="text-zinc-400 text-xs mt-1">
                          Note: {withdrawal.adminNote}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </motion.div>
      </div>
    </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Cancel Withdrawal</h2>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <LuX size={20} />
                </button>
              </div>

              <p className="text-zinc-300 mb-6">
                Are you sure you want to cancel this withdrawal request? The funds will be
                returned to your main wallet.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-medium text-white hover:bg-white/10 transition-colors"
                >
                  Keep Request
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 bg-red-500 rounded-xl font-medium text-white hover:bg-red-600 transition-colors"
                >
                  Cancel Withdrawal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <DashboardFooter />
    </>
  );
}
