"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardNavbar from "@/components/DashboardNavbar";
// import WalletConnectDeposit from "@/components/deposit/WalletConnectDeposit"; // backup: connect wallet + submit tx hash
import ExchangeStyleDeposit from "@/components/deposit/ExchangeStyleDeposit";
import { apiClient } from "@/lib/api";
import { LuCircleDollarSign, LuExternalLink } from "react-icons/lu";

interface DepositHistoryItem {
  id: string;
  depositType: string;
  token: string;
  requestedAmount: number;
  approvedAmount: number | null;
  status: string;
  transactionUrl: string | null;
  transactionHash: string | null;
  createdAt: string;
  processedAt: string | null;
}

export default function DepositPage() {
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [depositNetwork, setDepositNetwork] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [depositHistory, setDepositHistory] = useState<DepositHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueAmount, setIssueAmount] = useState("");
  const [issueTxUrl, setIssueTxUrl] = useState("");
  const [issueScreenshotFile, setIssueScreenshotFile] = useState<File | null>(null);
  const [issueNote, setIssueNote] = useState("");
  const [submittingIssue, setSubmittingIssue] = useState(false);

  const fetchDepositAddress = () => {
    setLoading(true);
    setError("");
    apiClient
      .getWallet()
      .then((res) => {
        if (res.data?.wallet?.depositAddress) {
          setDepositAddress(res.data.wallet.depositAddress);
          setDepositNetwork(res.data.wallet.depositNetwork ?? "BEP20 (BSC)");
        } else {
          setDepositAddress(null);
          setDepositNetwork(null);
        }
      })
      .catch(() => {
        setDepositAddress(null);
        setDepositNetwork(null);
        setError("Could not load your deposit address. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  const fetchDepositHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true);
    try {
      const res = await apiClient.getDepositHistory(page, 10);
      if (res.success && res.data) {
        setDepositHistory(res.data.deposits);
        setHistoryPagination(res.data.pagination);
        setHistoryPage(page);
      }
    } catch {
      setDepositHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepositAddress();
  }, []);

  useEffect(() => {
    fetchDepositHistory(1);
  }, [fetchDepositHistory]);

  const handleSubmitIssue = async () => {
    const amountValue = parseFloat(issueAmount);
    if (!amountValue || amountValue <= 0) {
      setError("Please enter the deposit amount you sent.");
      return;
    }
    if (!issueNote.trim()) {
      setError("Please enter a short note about the issue.");
      return;
    }
    setSubmittingIssue(true);
    setError("");
    try {
      const res = await apiClient.createDepositIssue({
        amount: amountValue,
        depositTxUrl: issueTxUrl.trim() || undefined,
        screenshotFile: issueScreenshotFile || undefined,
        note: issueNote.trim(),
      });
      if (res.success) {
        setSuccess("Issue submitted. Our team will review your deposit.");
        setShowIssueModal(false);
        setIssueAmount("");
        setIssueTxUrl("");
        setIssueScreenshotFile(null);
        setIssueNote("");
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(res.message || "Failed to submit issue. Please try again.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit issue. Please try again.");
    } finally {
      setSubmittingIssue(false);
    }
  };

  // Backup: used when WalletConnect deposit is enabled
  // const handleSuccess = (message: string) => {
  //   setError("");
  //   setSuccess(message);
  //   setTimeout(() => setSuccess(""), 5000);
  // };
  // const handleError = (message: string) => {
  //   setSuccess("");
  //   setError(message);
  // };

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

          {/* Exchange-style only: unique deposit address + QR */}
          {loading ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-zinc-500"
            >
              Loading your deposit address…
            </motion.p>
          ) : depositAddress && depositNetwork ? (
            <ExchangeStyleDeposit
              depositAddress={depositAddress}
              depositNetwork={depositNetwork}
            />
          ) : null}

          {/* Deposit History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
          >
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Deposit History</h2>
                  <p className="text-zinc-400 text-sm">Your recent deposits (manual, WalletConnect, or auto-credited)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIssueModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500"
                >
                  Raise deposit issue
                </button>
              </div>
            </div>
            {historyLoading ? (
              <div className="p-8 text-center text-zinc-400">Loading…</div>
            ) : depositHistory.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">No deposits yet</div>
            ) : (
              <ul className="divide-y divide-white/10">
                {depositHistory.map((d) => (
                  <li key={d.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <LuCircleDollarSign className="text-emerald-400" size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium">
                          ${(d.approvedAmount ?? d.requestedAmount).toFixed(2)} {d.token}
                        </p>
                        <p className="text-zinc-500 text-xs capitalize">
                          {d.depositType} · {d.status}
                        </p>
                        <p className="text-zinc-500 text-xs">
                          {new Date(d.processedAt || d.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {d.transactionUrl && (
                      <a
                        href={d.transactionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                        title="View on BSCScan"
                      >
                        <LuExternalLink size={18} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {historyPagination.pages > 1 && (
              <div className="p-3 border-t border-white/10 flex justify-center gap-2">
                <button
                  type="button"
                  disabled={historyPage <= 1}
                  onClick={() => fetchDepositHistory(historyPage - 1)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-sm text-white disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-zinc-400 text-sm">
                  {historyPage} / {historyPagination.pages}
                </span>
                <button
                  type="button"
                  disabled={historyPage >= historyPagination.pages}
                  onClick={() => fetchDepositHistory(historyPage + 1)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-sm text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </motion.div>

          {!depositAddress && !loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6"
            >
              <p className="text-amber-200/90 mb-2">Deposit is not available yet</p>
              <p className="text-zinc-400 text-sm mb-4">
                Your unique deposit address is being set up. Please try again in a moment or contact support if this continues.
              </p>
              <button
                type="button"
                onClick={fetchDepositAddress}
                className="px-4 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-colors"
              >
                Try again
              </button>
            </motion.div>
          ) : null}

          {/* --- BACKUP: WalletConnect deposit (connect wallet + submit tx hash). Uncomment import + block + handleSuccess/handleError to restore. --- */}
          {/* {depositAddress && (
            <p className="text-zinc-500 text-sm mb-4">Or submit a transaction hash (WalletConnect) below.</p>
          )}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <WalletConnectDeposit onSuccess={handleSuccess} onError={handleError} />
          </motion.div> */}
        </div>
      </div>

      {/* Deposit Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Raise deposit issue</h2>
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Tell us what went wrong with your deposit. Share the amount you sent, optionally the transaction URL, and attach a screenshot so admin can review.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Deposit amount (USD) *
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={issueAmount}
                  onChange={(e) => setIssueAmount(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g. 200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Deposit transaction URL (optional)
                </label>
                <input
                  type="url"
                  value={issueTxUrl}
                  onChange={(e) => setIssueTxUrl(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Link to BSCScan or exchange transaction"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Screenshot (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setIssueScreenshotFile(file);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {issueScreenshotFile && (
                  <p className="mt-1 text-xs text-zinc-400">
                    Selected: {issueScreenshotFile.name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Short note about the issue *
                </label>
                <textarea
                  value={issueNote}
                  onChange={(e) => setIssueNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Example: I deposited $200 USDT 30 minutes ago but balance has not updated."
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                disabled={submittingIssue}
                className="flex-1 rounded-xl border border-white/10 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitIssue}
                disabled={submittingIssue}
                className="flex-1 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {submittingIssue ? "Submitting..." : "Submit issue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
