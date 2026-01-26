"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import DashboardNavbar from "@/components/DashboardNavbar";
import { apiClient } from "@/lib/api";
import { 
  LuWallet, 
  LuRocket, 
  LuTicket, 
  LuTrendingUp, 
  LuUsers, 
  LuStar,
  LuCircleDollarSign,
  LuClock,
  LuBan,
  LuInbox
} from "react-icons/lu";
import DashboardFooter from "@/components/DashboardFooter";

interface Wallet {
  mainBalance: number;
  movementBalance: number;
  totalBalance: number;
  totalDeposited: number;
}

interface Activity {
  id: string;
  type: string;
  amount: string;
  time: string;
  status: "profit" | "deposit" | "transfer" | "withdrawal";
}

export default function DashboardPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch wallet balances
        const walletRes = await apiClient.getWallet();
        if (walletRes.success && walletRes.data) {
          setWallet(walletRes.data.wallet);
        }

        // Fetch recent deposits for activity
        const depositsRes = await apiClient.getDepositHistory(1, 3);
        if (depositsRes.success && depositsRes.data) {
          const activities: Activity[] = depositsRes.data.deposits.map((d) => ({
            id: d.id,
            type: d.status === "approved" ? "Deposit Approved" : d.status === "pending" ? "Deposit Pending" : "Deposit Rejected",
            amount: d.status === "approved" ? `+$${(d.approvedAmount || d.requestedAmount).toFixed(2)}` : `$${d.requestedAmount.toFixed(2)}`,
            time: formatTimeAgo(d.createdAt),
            status: d.status === "approved" ? "deposit" : d.status === "pending" ? "transfer" : "withdrawal"
          }));
          setRecentActivity(activities);
        }
      } catch (err) {
        console.error("Failed to fetch wallet data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const formatBalance = (amount: number) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getActivityIcon = (status: string) => {
    switch (status) {
      case "profit":
        return <LuTrendingUp size={20} className="text-green-400" />;
      case "deposit":
        return <LuCircleDollarSign size={20} className="text-blue-400" />;
      case "transfer":
        return <LuClock size={20} className="text-yellow-400" />;
      default:
        return <LuBan size={20} className="text-red-400" />;
    }
  };

  return (
    <>
      <DashboardNavbar />
      <div className="min-h-screen bg-grid pt-36 sm:pt-24 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Dashboard
              </span>
            </h1>
            <p className="text-zinc-400">Manage your accounts and track your activity</p>
          </motion.div>

          {/* Account Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Main Account */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Main Wallet</h2>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <LuWallet size={24} className="text-blue-400" />
                </div>
              </div>
              <div className="mb-4">
                <p className="text-zinc-400 text-sm mb-1">Balance</p>
                {loading ? (
                  <div className="h-9 w-32 bg-white/10 rounded animate-pulse"></div>
                ) : (
                  <p className="text-3xl font-bold text-white">
                    ${formatBalance(wallet?.mainBalance || 0)}
                  </p>
                )}
                <p className="text-zinc-500 text-xs mt-1">USD</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/dashboard/deposit"
                  className="flex-1 btn-primary rounded-xl px-4 py-2 text-center text-sm font-medium transition-all duration-300 hover:scale-105"
                >
                  Deposit
                </Link>
                <Link
                  href="/dashboard/withdraw"
                  className="flex-1 rounded-xl px-4 py-2 text-center text-sm font-medium border border-white/10 text-zinc-200 hover:bg-white/5 transition-all duration-300"
                >
                  Withdraw
                </Link>
              </div>
            </motion.div>

            {/* Movement Account */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Movement Wallet</h2>
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <LuRocket size={24} className="text-purple-400" />
                </div>
              </div>
              <div className="mb-4">
                <p className="text-zinc-400 text-sm mb-1">Balance</p>
                {loading ? (
                  <div className="h-9 w-32 bg-white/10 rounded animate-pulse"></div>
                ) : (
                  <p className="text-3xl font-bold text-white">
                    ${formatBalance(wallet?.movementBalance || 0)}
                  </p>
                )}
                <p className="text-zinc-500 text-xs mt-1">USD</p>
              </div>
              <Link
                href="/dashboard/wallet"
                className="w-full btn-primary rounded-xl px-4 py-2 text-center text-sm font-medium transition-all duration-300 hover:scale-105 block"
              >
                Transfer Funds
              </Link>
            </motion.div>
          </div>

          {/* Total Balance Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 mb-8 text-center"
          >
            <p className="text-zinc-400 text-sm mb-1">Total Balance</p>
            {loading ? (
              <div className="h-10 w-40 bg-white/10 rounded animate-pulse mx-auto"></div>
            ) : (
              <p className="text-4xl font-bold text-white">
                ${formatBalance(wallet?.totalBalance || 0)}
              </p>
            )}
            <p className="text-blue-400 text-xs mt-1">USD</p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl mb-8"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/dashboard/signals"
                className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105"
              >
                <LuTicket size={28} className="text-amber-400 mb-2" />
                <span className="text-sm text-zinc-300 font-medium">Signals</span>
              </Link>
              <Link
                href="/dashboard/trade"
                className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105"
              >
                <LuTrendingUp size={28} className="text-green-400 mb-2" />
                <span className="text-sm text-zinc-300 font-medium">Trade</span>
              </Link>
              <Link
                href="/dashboard/referrals"
                className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105"
              >
                <LuUsers size={28} className="text-blue-400 mb-2" />
                <span className="text-sm text-zinc-300 font-medium">Referrals</span>
              </Link>
              <Link
                href="/dashboard/grades"
                className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105"
              >
                <LuStar size={28} className="text-yellow-400 mb-2" />
                <span className="text-sm text-zinc-300 font-medium">Grades</span>
              </Link>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
              <Link href="/dashboard/wallet" className="text-blue-400 text-sm hover:text-blue-300">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                // Loading skeleton
                [1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse"></div>
                      <div>
                        <div className="h-4 w-24 bg-white/10 rounded animate-pulse mb-1"></div>
                        <div className="h-3 w-16 bg-white/10 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-4 w-16 bg-white/10 rounded animate-pulse"></div>
                  </div>
                ))
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <LuInbox size={48} className="text-zinc-500 mx-auto mb-4" />
                  <p className="text-zinc-400">No recent activity</p>
                  <p className="text-zinc-500 text-sm mt-1">Make a deposit to get started</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.status === "profit"
                            ? "bg-green-500/20"
                            : activity.status === "deposit"
                            ? "bg-blue-500/20"
                            : activity.status === "transfer"
                            ? "bg-yellow-500/20"
                            : "bg-red-500/20"
                        }`}
                      >
                        {getActivityIcon(activity.status)}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{activity.type}</p>
                        <p className="text-zinc-400 text-xs">{activity.time}</p>
                      </div>
                    </div>
                    <p
                      className={`font-semibold ${
                        activity.status === "profit" || activity.status === "deposit"
                          ? "text-green-400"
                          : activity.status === "transfer"
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {activity.amount}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
      <DashboardFooter />
    </>
  );
}
