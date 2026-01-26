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

export default function ReferralsPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [downline, setDownline] = useState<Downline[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "bonuses" | "downline">("overview");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, downlineRes] = await Promise.all([
        apiClient.getReferralStats(),
        apiClient.getDownline(),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      if (downlineRes.success && downlineRes.data) {
        setDownline(downlineRes.data.downline);
      }
    } catch (error: any) {
      console.error("Error fetching referral data:", error);
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
              Earn {stats?.bonusPercent}% bonus when your referrals activate trading
            </p>
          </motion.div>

          {/* Stats Cards */}
          {stats && (
            <div className="mb-8">
              <ReferralStats
                referralEarnings={stats.referralEarnings}
                totalReferrals={stats.totalReferrals}
                activeReferrals={stats.activeReferrals}
                bonusPercent={stats.bonusPercent}
              />
            </div>
          )}

          {/* Referral Link Card */}
          {stats && (
            <div className="mb-8">
              <ReferralLink
                referralCode={stats.referralCode}
                bonusPercent={stats.bonusPercent}
              />
            </div>
          )}

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
            {activeTab === "overview" && stats && (
              <HowItWorks bonusPercent={stats.bonusPercent} />
            )}

            {activeTab === "bonuses" && stats && (
              <BonusHistory bonuses={stats.recentBonuses} />
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
