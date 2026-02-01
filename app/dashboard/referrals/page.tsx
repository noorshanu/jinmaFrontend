"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardNavbar from "@/components/DashboardNavbar";
import DashboardFooter from "@/components/DashboardFooter";
import ReferralStats from "@/components/referral/ReferralStats";
import ReferralLink from "@/components/referral/ReferralLink";
import HowItWorks from "@/components/referral/HowItWorks";
import BonusHistory from "@/components/referral/BonusHistory";
import DownlineList from "@/components/referral/DownlineList";
import { apiClient } from "@/lib/api";
import { LuRefreshCw } from "react-icons/lu";

interface ReferralStats {
  referralCode: string;
  referralEarnings: number;
  totalReferrals: number;
  activeReferrals: number;
  bonusPercent: number;
  referralUrl: string;
  recentBonuses: Array<{
    id: string;
    referee: { name: string; email: string } | null;
    bonusAmount: number;
    bonusPercent: number;
    basedOnAmount: number;
    level: number;
    createdAt: string;
  }>;
}

interface Downline {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  isTradingActive: boolean;
  referralEarnings: number;
  totalReferrals: number;
}

const defaultStats: ReferralStats = {
  referralCode: "",
  referralEarnings: 0,
  totalReferrals: 0,
  activeReferrals: 0,
  bonusPercent: 10,
  referralUrl: "",
  recentBonuses: [],
};

export default function ReferralsPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [downline, setDownline] = useState<Downline[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "bonuses" | "downline">("overview");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const [statsRes, downlineRes] = await Promise.all([
        apiClient.getReferralStats(),
        apiClient.getDownline(),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      } else {
        setStats(defaultStats);
      }

      if (downlineRes.success && downlineRes.data?.downline) {
        setDownline(downlineRes.data.downline);
      } else {
        setDownline([]);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to load referral data";
      setFetchError(msg);
      setStats(defaultStats);
      setDownline([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <DashboardNavbar />
        <div className="min-h-screen bg-grid pt-24 pb-8 px-4 flex items-center justify-center">
          <LuRefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardNavbar />
      <div className="min-h-screen bg-grid pt-24 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2">Referral Program</h1>
            <p className="text-zinc-400">
              Earn {(stats?.bonusPercent ?? 10)}% bonus when your referrals get trading activated by admin
            </p>
          </motion.div>

          {fetchError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between">
              <p className="text-red-400 text-sm">{fetchError}</p>
              <button
                type="button"
                onClick={fetchData}
                className="text-sm font-medium text-red-400 hover:text-red-300"
              >
                Retry
              </button>
            </div>
          )}

          {/* Stats Cards - always show (use defaults if no stats) */}
          <div className="mb-8">
            <ReferralStats
              referralEarnings={stats?.referralEarnings ?? 0}
              totalReferrals={stats?.totalReferrals ?? 0}
              activeReferrals={stats?.activeReferrals ?? 0}
              bonusPercent={stats?.bonusPercent ?? 10}
            />
          </div>

          {/* Signups with your code (downline count) */}
          <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-zinc-400 text-sm">
              <span className="text-white font-medium">{downline.length}</span> people signed up with your referral code.
              {downline.length > 0 && (stats?.totalReferrals ?? 0) === 0 && (
                <span className="block mt-1 text-zinc-500">
                  Bonus is paid when admin activates their trading. Ask your referrals to deposit and request activation.
                </span>
              )}
            </p>
          </div>

          {/* Referral Link Card */}
          <div className="mb-8">
            <ReferralLink
              referralCode={stats?.referralCode ?? ""}
              referralUrl={stats?.referralUrl}
              bonusPercent={stats?.bonusPercent ?? 10}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "overview"
                  ? "bg-blue-500 text-white"
                  : "bg-zinc-800/50 text-zinc-400 hover:text-white"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("bonuses")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "bonuses"
                  ? "bg-blue-500 text-white"
                  : "bg-zinc-800/50 text-zinc-400 hover:text-white"
              }`}
            >
              Bonus History
            </button>
            <button
              onClick={() => setActiveTab("downline")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "downline"
                  ? "bg-blue-500 text-white"
                  : "bg-zinc-800/50 text-zinc-400 hover:text-white"
              }`}
            >
              My Referrals
            </button>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <HowItWorks bonusPercent={stats?.bonusPercent ?? 10} />
            )}

            {activeTab === "bonuses" && (
              <BonusHistory bonuses={stats?.recentBonuses ?? []} />
            )}

            {activeTab === "downline" && (
              <DownlineList downline={downline} />
            )}
          </AnimatePresence>
        </div>
      </div>
      <DashboardFooter />
    </>
  );
}
