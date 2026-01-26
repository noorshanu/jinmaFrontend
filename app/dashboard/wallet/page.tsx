"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import DashboardNavbar from "@/components/DashboardNavbar";
import { apiClient } from "@/lib/api";
import {
  LuWallet,
  LuRocket,
  LuArrowLeftRight,
  LuCircleDollarSign,
  LuUpload,
  LuArrowRight,
  LuArrowLeft,
  LuX,
  LuRefreshCw
} from "react-icons/lu";
import DashboardFooter from "@/components/DashboardFooter";

interface Wallet {
  id: string;
  mainBalance: number;
  movementBalance: number;
  totalBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalTransferred: number;
}

interface Transfer {
  id: string;
  direction: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Transfer modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferDirection, setTransferDirection] = useState<"main_to_movement" | "movement_to_main">("main_to_movement");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [walletRes, transfersRes] = await Promise.all([
        apiClient.getWallet(),
        apiClient.getTransferHistory(1, 5)
      ]);

      if (walletRes.success && walletRes.data) {
        setWallet(walletRes.data.wallet);
      }
      if (transfersRes.success && transfersRes.data) {
        setTransfers(transfersRes.data.transfers);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setTransferLoading(true);
    setError("");

    try {
      const res = await apiClient.transferBetweenWallets(
        transferDirection,
        parseFloat(transferAmount)
      );

      if (res.success && res.data) {
        setTransferSuccess(res.message || "Transfer successful!");
        setTransferAmount("");
        
        // Update wallet balances
        if (wallet && res.data.newBalances) {
          setWallet({
            ...wallet,
            mainBalance: res.data.newBalances.mainBalance,
            movementBalance: res.data.newBalances.movementBalance,
            totalBalance: res.data.newBalances.mainBalance + res.data.newBalances.movementBalance
          });
        }

        // Refresh data
        fetchData();
        
        setTimeout(() => {
          setShowTransferModal(false);
          setTransferSuccess("");
        }, 2000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setTransferLoading(false);
    }
  };

  const getMaxAmount = () => {
    if (!wallet) return 0;
    return transferDirection === "main_to_movement" ? wallet.mainBalance : wallet.movementBalance;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
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

  return (
    <>
      <DashboardNavbar />
      <div className="min-h-screen bg-grid pt-36 sm:pt-24 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Wallet</h1>
              <p className="text-zinc-400">Manage your USD balance :    ${wallet?.totalBalance.toFixed(2) || "0.00"}</p>
            </div>
            <button
              onClick={() => setShowTransferModal(true)}
              className="px-6 py-3 bg-[#3e82f0] rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 flex items-center gap-2"
            >
              <LuArrowLeftRight size={18} />
              Transfer
            </button>
          </motion.div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              {error}
            </div>
          )}

          {/* Two Wallet Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Main Wallet */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-600/20 to-cyan-600/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <LuWallet size={28} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Main Wallet</h2>
                  <p className="text-zinc-400 text-sm">Deposits go here</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6 text-center">
                <p className="text-zinc-400 text-sm mb-1">Available Balance</p>
                <p className="text-4xl font-bold text-white">
                  ${wallet?.mainBalance.toFixed(2) || "0.00"}
                </p>
                <p className="text-blue-400 text-sm mt-1">USD</p>
              </div>
            </motion.div>

            {/* Movement Wallet */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-600/20 to-pink-600/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <LuRocket size={28} className="text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Movement Wallet</h2>
                  <p className="text-zinc-400 text-sm">For trading & spending</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6 text-center">
                <p className="text-zinc-400 text-sm mb-1">Available Balance</p>
                <p className="text-4xl font-bold text-white">
                  ${wallet?.movementBalance.toFixed(2) || "0.00"}
                </p>
                <p className="text-purple-400 text-sm mt-1">USD</p>
              </div>
            </motion.div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center"
            >
              <p className="text-zinc-400 text-sm mb-1">Total Deposited</p>
              <p className="text-xl font-bold text-green-400">
                ${wallet?.totalDeposited.toFixed(2) || "0.00"}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center"
            >
              <p className="text-zinc-400 text-sm mb-1">Total Withdrawn</p>
              <p className="text-xl font-bold text-orange-400">
                ${wallet?.totalWithdrawn.toFixed(2) || "0.00"}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center"
            >
              <p className="text-zinc-400 text-sm mb-1">Total Transferred</p>
              <p className="text-xl font-bold text-purple-400">
                ${wallet?.totalTransferred.toFixed(2) || "0.00"}
              </p>
            </motion.div>
          </div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex gap-4 mb-8"
          >
            <Link
              href="/dashboard/deposit"
              className="flex-1 btn-primary rounded-xl px-6 py-4 font-semibold text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              <LuCircleDollarSign size={20} />
              Deposit
            </Link>
            <Link
              href="/dashboard/withdraw"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 py-4 font-semibold text-white text-center transition-all duration-300 hover:bg-white/10 flex items-center justify-center gap-2"
            >
              <LuUpload size={20} />
              Withdraw
            </Link>
          </motion.div>

          {/* Recent Transfers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Recent Transfers</h2>
            </div>

            {transfers.length === 0 ? (
              <div className="p-12 text-center">
                <LuRefreshCw size={40} className="text-zinc-500 mx-auto mb-4" />
                <p className="text-zinc-400">No transfers yet</p>
                <p className="text-zinc-500 text-sm mt-2">Transfer funds between wallets to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {transfers.map((transfer) => (
                  <div
                    key={transfer.id}
                    className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                        {transfer.direction === "main_to_movement" ? (
                          <LuArrowRight size={20} className="text-purple-400" />
                        ) : (
                          <LuArrowLeft size={20} className="text-blue-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {transfer.direction === "main_to_movement"
                            ? "Main → Movement"
                            : "Movement → Main"}
                        </p>
                        <p className="text-zinc-500 text-sm">
                          {formatDate(transfer.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">
                        ${transfer.amount.toFixed(2)}
                      </p>
                      <span className="text-green-400 text-sm">{transfer.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Transfer Modal */}
      <AnimatePresence>
        {showTransferModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowTransferModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Transfer Funds</h2>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <LuX size={20} />
                </button>
              </div>

              {transferSuccess && (
                <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
                  {transferSuccess}
                </div>
              )}

              <div className="space-y-4">
                {/* Direction */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Direction</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTransferDirection("main_to_movement")}
                      className={`p-4 rounded-xl text-sm font-medium transition-all ${
                        transferDirection === "main_to_movement"
                          ? "bg-purple-500/20 border-2 border-purple-500 text-purple-400"
                          : "bg-white/5 border-2 border-transparent text-zinc-400 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <LuWallet size={18} />
                        <LuArrowRight size={14} />
                        <LuRocket size={18} />
                      </div>
                      Main → Movement
                    </button>
                    <button
                      onClick={() => setTransferDirection("movement_to_main")}
                      className={`p-4 rounded-xl text-sm font-medium transition-all ${
                        transferDirection === "movement_to_main"
                          ? "bg-blue-500/20 border-2 border-blue-500 text-blue-400"
                          : "bg-white/5 border-2 border-transparent text-zinc-400 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <LuRocket size={18} />
                        <LuArrowRight size={14} />
                        <LuWallet size={18} />
                      </div>
                      Movement → Main
                    </button>
                  </div>
                </div>

                {/* Available Balance */}
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-zinc-400 text-sm">Available to transfer:</p>
                  <p className="text-2xl font-bold text-white">${getMaxAmount().toFixed(2)}</p>
                </div>

                {/* Amount */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-zinc-400">Amount (USD)</label>
                    <button
                      onClick={() => setTransferAmount(String(getMaxAmount()))}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Use Max
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={getMaxAmount()}
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 text-lg"
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleTransfer}
                  disabled={transferLoading || !transferAmount || parseFloat(transferAmount) > getMaxAmount()}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {transferLoading ? "Processing..." : "Transfer"}
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
