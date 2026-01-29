/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useBalance,
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { bsc } from "wagmi/chains";
import {
  LuWallet,
  LuCircleCheck,
  LuTriangleAlert,
  LuLoader,
  LuCopy,
  LuArrowRight,
  LuShieldCheck,
  LuZap,
} from "react-icons/lu";
import { apiClient } from "@/lib/api";
import { parseUnits } from "viem";

// USDT contract address for BSC
const USDT_ADDRESS_BSC = "0x55d398326f99059fF775485246999027B3197955" as `0x${string}`;

// Platform wallet address (BSC BEP20)
const PLATFORM_ADDRESS = "0x1156B06A4387cD653af745D5Cf6082c613348Ff0";

interface WalletConnectDepositProps {
  platformAddress?: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function WalletConnectDeposit({
  onSuccess,
  onError,
}: WalletConnectDepositProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync, isPending: isSending } = useWriteContract();

  const [amount, setAmount] = useState("");
  const [pendingHash, setPendingHash] = useState<`0x${string}` | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { isLoading: isWaitingReceipt } = useWaitForTransactionReceipt({
    hash: pendingHash ?? undefined,
    chainId: bsc.id,
    confirmations: 1,
    query: { enabled: !!pendingHash },
  });

  const { data: nativeBalance } = useBalance({ address });
  const { data: usdtBalance } = useBalance({ address, token: USDT_ADDRESS_BSC });

  const isOnBsc = chainId === bsc.id;
  
  // Check if user has USDT balance
  const usdtBalanceNum = usdtBalance?.formatted ? parseFloat(usdtBalance.formatted) : 0;
  const hasUsdtBalance = usdtBalanceNum > 0;

  const copyAddress = () => {
    navigator.clipboard.writeText(PLATFORM_ADDRESS);
    setCopied(true);
    onSuccess("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const verifyDepositByHash = async (hash: string) => {
    setIsVerifying(true);
    setVerifyMessage(null);
    setVerifyError(null);

    try {
      if (!address) throw new Error("Connect your wallet first.");
      const res = await apiClient.createWalletConnectDeposit(hash, address);
      const deposit = res.data?.deposit;
      const creditedAmount = (deposit?.approvedAmount ?? deposit?.requestedAmount ?? 0).toFixed(2);
      setVerifyMessage(`$${creditedAmount} credited to your Main Wallet`);
      onSuccess("Deposit verified and credited.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Verification failed";
      setVerifyError(message);
      onError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendAndVerify = async () => {
    if (!address) return onError("Connect your wallet first.");
    if (!isOnBsc) return onError("Switch to BNB Chain");

    const value = parseFloat(amount);
    if (!value || value <= 0) return onError("Enter a valid amount");
    
    // Check if user has enough USDT balance
    if (value > usdtBalanceNum) {
      return onError(`Insufficient USDT balance. You have ${usdtBalanceNum.toFixed(2)} USDT`);
    }

    try {
      setVerifyMessage(null);
      setVerifyError(null);

      const hash = await writeContractAsync({
        address: USDT_ADDRESS_BSC,
        abi: [{
          type: "function",
          stateMutability: "nonpayable",
          outputs: [],
          name: "transfer",
          inputs: [
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
          ],
        }],
        functionName: "transfer",
        args: [PLATFORM_ADDRESS as `0x${string}`, parseUnits(amount, 18)],
        chainId: bsc.id,
      });

      setPendingHash(hash);
      onSuccess("Transaction submitted...");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      setVerifyError(message);
      onError(message);
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!pendingHash || !isConnected || isWaitingReceipt) return;
      await verifyDepositByHash(pendingHash);
      setPendingHash(null);
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingHash, isConnected, isWaitingReceipt]);

  const formatBalance = (balance: string | undefined) => {
    if (!balance) return "0.00";
    const num = parseFloat(balance);
    if (num >= 1000) return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-zinc-900/80 to-black/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
    >
      {/* Header with Network & Connect */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <img
              src="https://cryptologos.cc/logos/bnb-bnb-logo.png?v=040"
              alt="BNB"
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">BNB Chain</p>
            <p className="text-xs text-zinc-500">USDT BEP20</p>
          </div>
        </div>
        <ConnectButton 
          showBalance={false}
          chainStatus="none"
          accountStatus={{ smallScreen: "avatar", largeScreen: "address" }}
        />
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Wallet Balances - Compact Row */}
        {isConnected && (
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <div className="flex-1 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img
                  src="https://cryptologos.cc/logos/bnb-bnb-logo.png?v=040"
                  alt="BNB"
                  width={16}
                  height={16}
                  className="opacity-70"
                />
                <span className="text-sm text-zinc-400">BNB</span>
                <span className="text-sm font-semibold text-white">
                  {formatBalance(nativeBalance?.formatted)}
                </span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-[10px] text-green-400">$</span>
                </div>
                <span className="text-sm text-zinc-400">USDT</span>
                <span className="text-sm font-semibold text-green-400">
                  {formatBalance(usdtBalance?.formatted)}
                </span>
              </div>
            </div>
            {!isOnBsc && (
              <span className="text-xs text-orange-400 flex items-center gap-1">
                <LuTriangleAlert size={12} /> Switch network
              </span>
            )}
          </div>
        )}

        {/* Not Connected State */}
        {!isConnected && (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-3 bg-yellow-500/10 rounded-full flex items-center justify-center">
              <LuWallet size={24} className="text-yellow-400" />
            </div>
            <p className="text-zinc-400 text-sm">Connect your wallet to deposit</p>
          </div>
        )}

        {/* Platform Address - Compact */}
        {isConnected && (
          <div className="flex items-center gap-2 p-3 bg-black/40 rounded-xl border border-white/5">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Deposit to</p>
              <code className="text-xs text-zinc-300 font-mono truncate block">
                {PLATFORM_ADDRESS}
              </code>
            </div>
            <button
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
        )}

        {/* Send Form - Compact */}
        {isConnected && (
          <div className="space-y-3">
            {/* No USDT Balance Warning */}
            {!hasUsdtBalance && (
              <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                <LuTriangleAlert size={16} className="text-orange-400 shrink-0" />
                <p className="text-sm text-orange-400">
                  No USDT balance. Please add USDT to your wallet first.
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={!hasUsdtBalance}
                  className="w-full h-11 rounded-xl border border-white/10 bg-black/40 pl-4 pr-16 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                  USDT
                </span>
              </div>
              <button
                type="button"
                onClick={handleSendAndVerify}
                disabled={isSending || isWaitingReceipt || !amount.trim() || !isOnBsc || !hasUsdtBalance}
                className="h-11 px-5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-sm font-semibold hover:from-yellow-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                title={!hasUsdtBalance ? "Add USDT to your wallet first" : undefined}
              >
                {(isSending || isWaitingReceipt) ? (
                  <LuLoader size={16} className="animate-spin" />
                ) : (
                  <>
                    Send <LuArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Status Messages - Compact */}
        {(verifyMessage || verifyError || isVerifying) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
              verifyMessage ? "bg-green-500/10 text-green-400" : 
              verifyError ? "bg-red-500/10 text-red-400" : 
              "bg-yellow-500/10 text-yellow-400"
            }`}
          >
            {isVerifying ? (
              <LuLoader className="animate-spin shrink-0" size={16} />
            ) : verifyMessage ? (
              <LuCircleCheck className="shrink-0" size={16} />
            ) : (
              <LuTriangleAlert className="shrink-0" size={16} />
            )}
            <span className="truncate">
              {isVerifying ? "Verifying on-chain..." : verifyMessage || verifyError}
            </span>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/5 space-y-2">
        <div className="flex items-center justify-center gap-6 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <LuShieldCheck size={14} className="text-green-500" /> Secure
          </span>
          <span className="flex items-center gap-1.5">
            <LuZap size={14} className="text-yellow-500" /> Instant
          </span>
          <span className="flex items-center gap-1.5">
            <LuCircleCheck size={14} className="text-blue-500" /> Auto-verify
          </span>
        </div>
        <p className="text-center text-[11px] text-zinc-600">
          Instantly credited to your Main Wallet
        </p>
      </div>
    </motion.div>
  );
}
