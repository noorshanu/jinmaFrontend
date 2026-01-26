"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardNavbar from "@/components/DashboardNavbar";
import { apiClient } from "@/lib/api";
import {
  LuSquarePen,
  LuLink,
  LuCopy,
  LuTriangleAlert,
  LuCamera,
  LuClock,
  LuCircleCheck,
  LuX
} from "react-icons/lu";

type Tab = "manual" | "walletconnect";
type Token = "USDT" | "USDC";

export default function DepositPage() {
  const [activeTab, setActiveTab] = useState<Tab>("manual");
  const [platformAddress, setPlatformAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Manual deposit form
  const [selectedToken, setSelectedToken] = useState<Token>("USDT");
  const [amount, setAmount] = useState("");
  const [transactionUrl, setTransactionUrl] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch platform wallet address
  useEffect(() => {
    const fetchPlatformWallet = async () => {
      try {
        const res = await apiClient.getPlatformWallet();
        if (res.success && res.data) {
          setPlatformAddress(res.data.address);
        }
      } catch {
        console.error("Failed to fetch platform wallet");
      }
    };
    fetchPlatformWallet();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      setScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!amount || parseFloat(amount) < 1) {
      setError("Minimum deposit amount is $1");
      return;
    }

    if (!transactionUrl) {
      setError("Transaction URL is required");
      return;
    }

    if (!screenshot) {
      setError("Screenshot is required");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("token", selectedToken);
      formData.append("amount", amount);
      formData.append("transactionUrl", transactionUrl);
      formData.append("screenshot", screenshot);

      const res = await apiClient.createManualDeposit(formData);
      if (res.success) {
        setSuccess("Deposit request submitted! Awaiting admin approval.");
        setAmount("");
        setTransactionUrl("");
        setScreenshot(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit deposit");
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(platformAddress);
    setSuccess("Address copied to clipboard!");
    setTimeout(() => setSuccess(""), 3000);
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
              <LuLink size={18} />
              WalletConnect
            </button>
          </motion.div>

          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Manual Deposit */}
          <AnimatePresence mode="wait">
            {activeTab === "manual" && (
              <motion.div
                key="manual"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                {/* Step 1: Copy Address */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-sm">
                      1
                    </span>
                    Send to this address (BEP20 - BSC)
                  </h3>
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-4">
                      <code className="text-sm text-zinc-300 break-all">
                        {platformAddress || "Loading..."}
                      </code>
                      <button
                        onClick={copyAddress}
                        className="shrink-0 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <LuCopy size={16} />
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-3 flex items-start gap-2">
                      <LuTriangleAlert size={14} className="shrink-0 mt-0.5 text-yellow-500" />
                      <span>
                        Only send <strong>USDT</strong> or <strong>USDC</strong> on{" "}
                        <strong>BEP20 (BSC)</strong> network. Sending other tokens may result
                        in permanent loss.
                      </span>
                    </p>
                  </div>
                </div>

                {/* Step 2: Fill Form */}
                <form onSubmit={handleManualSubmit}>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-sm">
                      2
                    </span>
                    Submit deposit details
                  </h3>

                  <div className="space-y-4">
                    {/* Token Selection */}
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">
                        Select Token
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedToken("USDT")}
                          className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                            selectedToken === "USDT"
                              ? "bg-green-500/20 border-2 border-green-500 text-green-400"
                              : "bg-white/5 border-2 border-transparent text-zinc-400 hover:bg-white/10"
                          }`}
                        >
                          USDT
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedToken("USDC")}
                          className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                            selectedToken === "USDC"
                              ? "bg-blue-500/20 border-2 border-blue-500 text-blue-400"
                              : "bg-white/5 border-2 border-transparent text-zinc-400 hover:bg-white/10"
                          }`}
                        >
                          USDC
                        </button>
                      </div>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">
                        Amount (USD)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      />
                    </div>

                    {/* Transaction URL */}
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">
                        Transaction URL (BSCScan link)
                      </label>
                      <input
                        type="url"
                        value={transactionUrl}
                        onChange={(e) => setTransactionUrl(e.target.value)}
                        placeholder="https://bscscan.com/tx/..."
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      />
                    </div>

                    {/* Screenshot Upload */}
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">
                        Transaction Screenshot
                      </label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500/50 transition-colors"
                      >
                        {previewUrl ? (
                          <div className="relative">
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="max-h-48 mx-auto rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setScreenshot(null);
                                setPreviewUrl(null);
                                if (fileInputRef.current)
                                  fileInputRef.current.value = "";
                              }}
                              className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center"
                            >
                              <LuX size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <LuCamera size={40} className="text-zinc-500 mx-auto mb-2" />
                            <p className="text-zinc-400">
                              Click to upload screenshot
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                              PNG, JPG, WEBP (max 5MB)
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-primary rounded-xl px-6 py-4 font-semibold text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {loading ? "Submitting..." : "Submit Deposit Request"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* WalletConnect */}
            {activeTab === "walletconnect" && (
              <motion.div
                key="walletconnect"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                    <LuLink size={36} className="text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    WalletConnect Coming Soon
                  </h3>
                  <p className="text-zinc-400 mb-6 max-w-sm mx-auto">
                    Connect your wallet (MetaMask, Trust Wallet, etc.) to deposit
                    directly. This feature is under development.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-sm">
                    <LuClock size={16} />
                    <span>Under Development</span>
                  </div>
                </div>

                {/* Coming Soon Features */}
                <div className="mt-8 space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <LuCircleCheck size={20} className="text-green-400" />
                    <span className="text-zinc-300">
                      Connect any WalletConnect-compatible wallet
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <LuCircleCheck size={20} className="text-green-400" />
                    <span className="text-zinc-300">
                      Direct USDT/USDC transfers on BSC
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <LuCircleCheck size={20} className="text-green-400" />
                    <span className="text-zinc-300">
                      Automatic balance updates after confirmation
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
