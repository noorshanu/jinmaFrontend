"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardNavbar from "@/components/DashboardNavbar";
import ManualDeposit from "@/components/deposit/ManualDeposit";
import WalletConnectDeposit from "@/components/deposit/WalletConnectDeposit";
import { LuSquarePen, LuWallet } from "react-icons/lu";

type Tab = "manual" | "walletconnect";

export default function DepositPage() {
  const [activeTab, setActiveTab] = useState<Tab>("manual");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSuccess = (message: string) => {
    setError("");
    setSuccess(message);
    setTimeout(() => setSuccess(""), 5000);
  };

  const handleError = (message: string) => {
    setSuccess("");
    setError(message);
  };

  return (
    <>
      <DashboardNavbar />
      <div className="min-h-screen bg-grid pt-24 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2">Deposit</h1>
            <p className="text-zinc-400">Add funds to your wallet</p>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 mb-6"
          >
            <button
              onClick={() => setActiveTab("manual")}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === "manual"
                  ? "bg-blue-500 text-white"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              <LuSquarePen size={18} />
              Manual Transfer
            </button>
            <button
              onClick={() => setActiveTab("walletconnect")}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === "walletconnect"
                  ? "bg-blue-500 text-white"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              <LuWallet size={18} />
              Connect Wallet
            </button>
          </motion.div>

          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center justify-between"
              >
                <span>{error}</span>
                <button 
                  onClick={() => setError("")}
                  className="text-red-400 hover:text-red-300 text-sm underline"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 flex items-center gap-2"
              >
                <span>✓</span>
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "manual" && (
              <ManualDeposit
                key="manual"
                platformAddress=""
                onSuccess={handleSuccess}
                onError={handleError}
              />
            )}

            {activeTab === "walletconnect" && (
              <WalletConnectDeposit
                key="walletconnect"
                onSuccess={handleSuccess}
                onError={handleError}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
