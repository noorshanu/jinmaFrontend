"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardNavbar from "@/components/DashboardNavbar";
import WalletConnectDeposit from "@/components/deposit/WalletConnectDeposit";

export default function DepositPage() {
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

          {/* Deposit: Wallet Connect only (manual deposit hidden) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <WalletConnectDeposit
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </motion.div>
        </div>
      </div>
    </>
  );
}
