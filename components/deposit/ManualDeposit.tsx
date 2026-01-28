/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { apiClient } from "@/lib/api";
import {
  LuCopy,
  LuTriangleAlert,
  LuCamera,
  LuX,
  LuCircleCheck,
  LuCircleDollarSign
} from "react-icons/lu";
import Image from "next/image";

type Network = "BEP20" | "TRC20";

// Platform wallet addresses
const WALLET_ADDRESSES = {
  BEP20: "0x1156B06A4387cD653af745D5Cf6082c613348Ff0",
  TRC20: "TFQ36CEmXtbcmw4SR2AA959DhCa6UscMxh",
};

interface ManualDepositProps {
  platformAddress: string; // kept for backward compatibility
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
        onSuccess("Deposit request submitted! Awaiting admin approval.");
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
    onSuccess("Address copied to clipboard!");
  };

  const clearScreenshot = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScreenshot(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      {/* Step 1: Select Network */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-sm">
            1
          </span>
          Select Network
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSelectedNetwork("BEP20")}
            className={`p-4 rounded-xl font-medium transition-all duration-300 flex flex-col items-center gap-2 ${
              selectedNetwork === "BEP20"
                ? "bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400"
                : "bg-white/5 border-2 border-transparent text-zinc-400 hover:bg-white/10"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center overflow-hidden">
              <img
                src="/bnb.png"
                alt="BNB"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <span>BEP20 (BSC)</span>
            {selectedNetwork === "BEP20" && (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <LuCircleCheck size={12} /> Selected
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setSelectedNetwork("TRC20")}
            className={`p-4 rounded-xl font-medium transition-all duration-300 flex flex-col items-center gap-2 ${
              selectedNetwork === "TRC20"
                ? "bg-red-500/20 border-2 border-red-500 text-red-400"
                : "bg-white/5 border-2 border-transparent text-zinc-400 hover:bg-white/10"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center overflow-hidden">
              <img
                src="/tron.png"
                alt="Tron"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <span>TRC20 (Tron)</span>
            {selectedNetwork === "TRC20" && (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <LuCircleCheck size={12} /> Selected
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Step 2: Copy Address */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-sm">
            2
          </span>
          Send USDT to this address ({selectedNetwork})
        </h3>
        <div className="bg-black/30 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between gap-4">
            <code className="text-sm text-zinc-300 break-all font-mono">
              {currentAddress}
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
              Only send <strong>USDT</strong> on{" "}
              <strong>{selectedNetwork}</strong> network. Sending other tokens or using wrong network may result
              in permanent loss.
            </span>
          </p>
        </div>
      </div>

      {/* Step 3: Fill Form */}
      <form onSubmit={handleSubmit}>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-sm">
            3
          </span>
          Submit deposit details
        </h3>

        <div className="space-y-4">
          {/* Token Display (fixed to USDT) */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Token
            </label>
            <div className="px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 font-medium flex items-center gap-2">
              <LuCircleDollarSign size={20} />
              <span>USDT</span>
              <span className="text-xs text-zinc-500 ml-auto">({selectedNetwork})</span>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Amount (USDT)
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
              Transaction URL ({selectedNetwork === "BEP20" ? "BSCScan" : "Tronscan"} link)
            </label>
            <input
              type="url"
              value={transactionUrl}
              onChange={(e) => setTransactionUrl(e.target.value)}
              placeholder={
                selectedNetwork === "BEP20"
                  ? "https://bscscan.com/tx/..."
                  : "https://tronscan.org/#/transaction/..."
              }
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
                    onClick={clearScreenshot}
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
  );
}
