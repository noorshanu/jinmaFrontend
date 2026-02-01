/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { apiClient } from "@/lib/api";
import {
  LuCopy,
  LuTriangleAlert,
  LuUpload,
  LuX,
  LuCircleCheck,
  LuClock,
  LuShieldCheck,
  LuSend,
} from "react-icons/lu";

type Network = "BEP20" | "TRC20";

const WALLET_ADDRESSES = {
  BEP20: "0x86775b9926cd91C40e46aE6DFa7750a8b76fA83B",
  TRC20: "TFQ36CEmXtbcmw4SR2AA959DhCa6UscMxh",
};

interface ManualDepositProps {
  platformAddress: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function ManualDeposit({ 
  onSuccess, 
  onError 
}: ManualDepositProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<Network>("BEP20");
  const [amount, setAmount] = useState("");
  const [transactionUrl, setTransactionUrl] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentAddress = WALLET_ADDRESSES[selectedNetwork];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        onError("File size must be less than 5MB");
        return;
      }
      setScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) < 1) {
      onError("Minimum deposit amount is $1");
      return;
    }

    if (!transactionUrl) {
      onError("Transaction URL is required");
      return;
    }

    if (!screenshot) {
      onError("Screenshot is required");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("token", "USDT");
      formData.append("network", selectedNetwork);
      formData.append("amount", amount);
      formData.append("transactionUrl", transactionUrl);
      formData.append("screenshot", screenshot);

      const res = await apiClient.createManualDeposit(formData);
      if (res.success) {
        onSuccess("Deposit submitted! Awaiting approval.");
        setAmount("");
        setTransactionUrl("");
        setScreenshot(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Failed to submit deposit");
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(currentAddress);
    setCopied(true);
    onSuccess("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const clearScreenshot = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScreenshot(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-zinc-900/80 to-black/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
    >
      {/* Header - Network Selection */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Network</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedNetwork("BEP20")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedNetwork === "BEP20"
                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                  : "bg-white/5 text-zinc-400 border border-transparent hover:bg-white/10"
              }`}
            >
              <img
                src="https://cryptologos.cc/logos/bnb-bnb-logo.png?v=040"
                alt="BNB"
                width={16}
                height={16}
              />
              BSC
            </button>
            <button
              type="button"
              onClick={() => setSelectedNetwork("TRC20")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedNetwork === "TRC20"
                  ? "bg-red-500/20 text-red-400 border border-red-500/50"
                  : "bg-white/5 text-zinc-400 border border-transparent hover:bg-white/10"
              }`}
            >
              <img
                src="https://cryptologos.cc/logos/tron-trx-logo.png?v=040"
                alt="TRON"
                width={16}
                height={16}
              />
              TRON
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Deposit Address */}
        <div className="p-3 bg-black/40 rounded-xl border border-white/5">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              Send USDT ({selectedNetwork}) to
            </p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              selectedNetwork === "BEP20" 
                ? "bg-yellow-500/20 text-yellow-400" 
                : "bg-red-500/20 text-red-400"
            }`}>
              {selectedNetwork}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-zinc-300 font-mono truncate">
              {currentAddress}
            </code>
            <button
              type="button"
              onClick={copyAddress}
              className={`shrink-0 p-2 rounded-lg transition-all ${
                copied 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              {copied ? <LuCircleCheck size={16} /> : <LuCopy size={16} />}
            </button>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 p-2 bg-yellow-500/5 rounded-lg border border-yellow-500/10">
          <LuTriangleAlert size={14} className="text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-yellow-500/80">
            Only send <strong>USDT</strong> on <strong>{selectedNetwork}</strong>. Wrong network = permanent loss.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Amount */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5 block">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-11 rounded-xl border border-white/10 bg-black/40 pl-4 pr-16 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                USDT
              </span>
            </div>
          </div>

          {/* Transaction URL */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5 block">
              Transaction URL
            </label>
            <input
              type="url"
              value={transactionUrl}
              onChange={(e) => setTransactionUrl(e.target.value)}
              placeholder={selectedNetwork === "BEP20" ? "bscscan.com/tx/..." : "tronscan.org/#/transaction/..."}
              className="w-full h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
            />
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5 block">
              Screenshot
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative border border-dashed rounded-xl cursor-pointer transition-all ${
                previewUrl 
                  ? "border-green-500/30 bg-green-500/5" 
                  : "border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5"
              }`}
            >
              {previewUrl ? (
                <div className="p-2 flex items-center gap-3">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-green-400 flex items-center gap-1.5">
                      <LuCircleCheck size={14} /> Image attached
                    </p>
                    <p className="text-xs text-zinc-500 truncate">{screenshot?.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearScreenshot}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                  >
                    <LuX size={16} />
                  </button>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <LuUpload size={24} className="text-zinc-500 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">Upload screenshot</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">PNG, JPG, WEBP • Max 5MB</p>
                </div>
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !amount || !transactionUrl || !screenshot}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold hover:from-blue-400 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              <>
                <LuSend size={16} /> Submit Deposit
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/5 space-y-2">
        <div className="flex items-center justify-center gap-6 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <LuShieldCheck size={14} className="text-green-500" /> Secure
          </span>
          <span className="flex items-center gap-1.5">
            <LuClock size={14} className="text-blue-500" /> 24h Review
          </span>
          <span className="flex items-center gap-1.5">
            <LuCircleCheck size={14} className="text-purple-500" /> Manual Verify
          </span>
        </div>
        <p className="text-center text-[11px] text-zinc-600">
          Credited to Main Wallet after admin approval
        </p>
      </div>
    </motion.div>
  );
}
