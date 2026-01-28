/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useBalance,
  useSwitchChain,
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { mainnet, bsc } from "wagmi/chains";
import {
  LuWallet,
  LuArrowRightLeft,
  LuCircleCheck,
  LuTriangleAlert,
  LuLoader,
  LuCopy,
  LuCircleDollarSign
} from "react-icons/lu";
import { FaEthereum } from "react-icons/fa";
import { apiClient } from "@/lib/api";
import { parseUnits } from "viem";

type Network = "eth" | "bsc";

// USDT contract addresses
const USDT_ADDRESSES = {
  eth: "0xdAC17F958D2ee523a2206206994597C13D831ec7" as `0x${string}`,
  bsc: "0x55d398326f99059fF775485246999027B3197955" as `0x${string}`,
};

// Platform wallet address (BSC BEP20)
const PLATFORM_ADDRESS = "0x1156B06A4387cD653af745D5Cf6082c613348Ff0";

interface WalletConnectDepositProps {
  platformAddress?: string; // kept for backward compatibility
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function WalletConnectDeposit({
  onSuccess,
  onError,
}: WalletConnectDepositProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync, isPending: isSending } = useWriteContract();

  const [selectedNetwork, setSelectedNetwork] = useState<Network>("bsc");
  const [amount, setAmount] = useState("");
  const [pendingHash, setPendingHash] = useState<`0x${string}` | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const {
    isLoading: isWaitingReceipt,
  } = useWaitForTransactionReceipt({
    hash: pendingHash ?? undefined,
    chainId: bsc.id,
    confirmations: 1,
    query: {
      enabled: !!pendingHash,
    },
  });

  // Get native balance
  const { data: nativeBalance } = useBalance({
    address: address,
  });

  // Get USDT balance
  const { data: usdtBalance } = useBalance({
    address: address,
    token: USDT_ADDRESSES[selectedNetwork],
  });

  // Determine current network from chainId
  const currentNetwork: Network | null = 
    chainId === mainnet.id ? "eth" : 
    chainId === bsc.id ? "bsc" : null;

  // Sync selected network with actual chain
  useEffect(() => {
    if (currentNetwork && currentNetwork !== selectedNetwork) {
      setSelectedNetwork(currentNetwork);
    }
  }, [currentNetwork, selectedNetwork]);

  const handleNetworkSwitch = async (network: Network) => {
    const targetChainId = network === "eth" ? mainnet.id : bsc.id;
    
    if (chainId !== targetChainId) {
      try {
        switchChain({ chainId: targetChainId });
        setSelectedNetwork(network);
      } catch (err) {
        onError("Failed to switch network. Please try manually in your wallet.");
        console.error(err);
      }
    } else {
      setSelectedNetwork(network);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(PLATFORM_ADDRESS);
    onSuccess("Platform address copied!");
  };

  const verifyDepositByHash = async (hash: string) => {
    setIsVerifying(true);
    setVerifyMessage(null);
    setVerifyError(null);

    try {
      if (!address) {
        throw new Error("Connect your wallet first.");
      }

      const res = await apiClient.createWalletConnectDeposit(hash, address);
      const deposit = res.data?.deposit;
      const creditedAmount =
        (deposit?.approvedAmount ?? deposit?.requestedAmount ?? 0).toFixed(2);
      setVerifyMessage(
        `Deposit verified on-chain and $${creditedAmount} has been credited to your Main Wallet.`
      );
      onSuccess("WalletConnect deposit verified and credited.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to verify deposit. Please try again.";
      setVerifyError(message);
      onError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendAndVerify = async () => {
    if (!address) {
      onError("Connect your wallet first.");
      return;
    }

    if (currentNetwork !== "bsc") {
      onError("Please switch to BNB Chain (BSC) first.");
      return;
    }

    const value = parseFloat(amount);
    if (!value || value <= 0) {
      onError("Enter a valid USDT amount.");
      return;
    }

    try {
      setVerifyMessage(null);
      setVerifyError(null);

      const hash = await writeContractAsync({
        address: USDT_ADDRESSES.bsc,
        abi: [
          {
            type: "function",
            stateMutability: "nonpayable",
            outputs: [],
            name: "transfer",
            inputs: [
              { name: "to", type: "address" },
              { name: "value", type: "uint256" },
            ],
          },
        ],
        functionName: "transfer",
        args: [PLATFORM_ADDRESS as `0x${string}`, parseUnits(amount, 18)],
        chainId: bsc.id,
      });

      setPendingHash(hash);
      onSuccess("Transaction submitted. Waiting for confirmation...");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send transaction.";
      setVerifyError(message);
      onError(message);
    }
  };

  // When pendingHash is set and receipt is confirmed, auto-verify on backend
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
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      {/* Connect Wallet Section */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
          <LuWallet size={32} className="text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          {isConnected ? "Wallet Connected" : "Connect Your Wallet"}
        </h3>
        <p className="text-zinc-400 text-sm mb-4">
          {isConnected 
            ? "Select network to view your USDT balance" 
            : "Connect your wallet to view balances and deposit"}
        </p>
        
        {/* RainbowKit Connect Button */}
        <div className="flex justify-center">
          <ConnectButton 
            showBalance={false}
            chainStatus="icon"
            accountStatus={{
              smallScreen: "avatar",
              largeScreen: "full",
            }}
          />
        </div>
      </div>

      {/* Show more options when connected */}
      {isConnected && (
        <>
          {/* Network Selection */}
          <div className="mb-6">
            <label className="block text-sm text-zinc-400 mb-3">Select Network</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleNetworkSwitch("eth")}
                disabled={isSwitching}
                className={`p-4 rounded-xl font-medium transition-all duration-300 flex flex-col items-center gap-2 ${
                  selectedNetwork === "eth" && currentNetwork === "eth"
                    ? "bg-blue-500/20 border-2 border-blue-500 text-blue-400"
                    : "bg-white/5 border-2 border-transparent text-zinc-400 hover:bg-white/10"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <FaEthereum size={18} className="text-blue-400" />
                </div>
                <span>Ethereum</span>
                {currentNetwork === "eth" && (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <LuCircleCheck size={12} /> Connected
                  </span>
                )}
              </button>
              <button
                onClick={() => handleNetworkSwitch("bsc")}
                disabled={isSwitching}
                className={`p-4 rounded-xl font-medium transition-all duration-300 flex flex-col items-center gap-2 ${
                  selectedNetwork === "bsc" && currentNetwork === "bsc"
                    ? "bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400"
                    : "bg-white/5 border-2 border-transparent text-zinc-400 hover:bg-white/10"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center overflow-hidden">
                  <img
                    src="/bnb.png"
                    alt="BNB"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                </div>
                <span>BNB Chain</span>
                {currentNetwork === "bsc" && (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <LuCircleCheck size={12} /> Connected
                  </span>
                )}
              </button>
            </div>
            {isSwitching && (
              <p className="text-center text-sm text-zinc-400 mt-2 flex items-center justify-center gap-2">
                <LuLoader className="animate-spin" size={14} />
                Switching network...
              </p>
            )}
          </div>

          {/* Token Display (USDT only) */}
          <div className="mb-6">
            <label className="block text-sm text-zinc-400 mb-3">Token</label>
            <div className="px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 font-medium flex items-center gap-2">
              <LuCircleDollarSign size={20} />
              <span>USDT</span>
              <span className="text-xs text-zinc-500 ml-auto">
                ({selectedNetwork === "bsc" ? "BEP20" : "ERC20"})
              </span>
            </div>
          </div>

          {/* Balances */}
          <div className="bg-black/30 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Native Balance</span>
              <span className="text-white font-medium">
                {formatBalance(nativeBalance?.formatted)} {nativeBalance?.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">USDT Balance</span>
              <span className="text-white font-medium">
                {formatBalance(usdtBalance?.formatted)} USDT
              </span>
            </div>
          </div>

          {/* Platform Address */}
          <div className="bg-black/30 rounded-xl p-4 mb-4">
            <p className="text-zinc-400 text-sm mb-2">Platform deposit address (BEP20):</p>
            <div className="flex items-center justify-between gap-3">
              <code className="text-sm text-zinc-300 break-all font-mono">
                {PLATFORM_ADDRESS}
              </code>
              <button
                onClick={copyAddress}
                className="shrink-0 p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
              >
                <LuCopy size={16} />
              </button>
            </div>
          </div>

          {/* Send & Verify in one step */}
          <div className="bg-black/30 rounded-xl p-4 mb-6 space-y-3">
            <p className="text-sm text-zinc-300 font-medium">
              Send with connected wallet (BSC testnet)
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount in USDT"
                className="w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleSendAndVerify}
                disabled={
                  isSending ||
                  isWaitingReceipt ||
                  !amount.trim() ||
                  currentNetwork !== "bsc"
                }
                className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {(isSending || isWaitingReceipt) ? (
                  <>
                    <LuLoader size={16} className="mr-2 animate-spin" />
                    {isWaitingReceipt ? "Waiting for confirmation..." : "Sending..."}
                  </>
                ) : (
                  "Send & verify"
                )}
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              Your wallet will open to confirm a USDT transfer from your address to the
              platform address above. After confirmation, we will verify it on-chain and
              credit your Main Wallet automatically.
            </p>
          </div>

          {/* On-chain Verification Status */}
          {(verifyMessage || verifyError || isVerifying) && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mb-6">
              <div className="flex items-start gap-3">
                <LuTriangleAlert className="text-yellow-400 shrink-0 mt-0.5" size={18} />
                <div className="flex-1 text-sm space-y-1">
                  {isVerifying && (
                    <p className="text-yellow-500/80 flex items-center gap-2">
                      <LuLoader size={14} className="animate-spin" />
                      Verifying your transaction on-chain...
                    </p>
                  )}
                  {verifyMessage && (
                    <p className="text-xs text-green-400">{verifyMessage}</p>
                  )}
                  {verifyError && (
                    <p className="text-xs text-red-400">{verifyError}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <LuCircleCheck size={20} className="text-green-400" />
              <span className="text-zinc-300 text-sm">
                Switch between Ethereum and BNB Chain
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <LuCircleCheck size={20} className="text-green-400" />
              <span className="text-zinc-300 text-sm">
                View your USDT balance instantly
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <LuArrowRightLeft size={20} className="text-blue-400" />
              <span className="text-zinc-300 text-sm">
                Direct transfers coming soon
              </span>
            </div>
          </div>
        </>
      )}

      {/* Not Connected State */}
      {!isConnected && (
        <div className="space-y-3 mt-6">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <LuCircleCheck size={20} className="text-green-400" />
            <span className="text-zinc-300 text-sm">
              Connect MetaMask, Trust Wallet, or other wallets
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <LuCircleCheck size={20} className="text-green-400" />
            <span className="text-zinc-300 text-sm">
              Support for Ethereum and BNB Chain
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <LuCircleCheck size={20} className="text-green-400" />
            <span className="text-zinc-300 text-sm">
              View your USDT balance instantly
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
