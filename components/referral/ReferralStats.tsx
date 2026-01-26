"use client";

import { motion } from "framer-motion";
import { LuDollarSign, LuUsers, LuTrendingUp } from "react-icons/lu";

interface ReferralStatsProps {
  referralEarnings: number;
  totalReferrals: number;
  activeReferrals: number;
  bonusPercent: number;
}

export default function ReferralStats({
  referralEarnings,
  totalReferrals,
  activeReferrals,
  bonusPercent,
}: ReferralStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl border border-white/10 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <LuDollarSign className="w-6 h-6 text-blue-400" />
          </div>
          <span className="text-xs text-zinc-400">Total Earnings</span>
        </div>
        <h3 className="text-3xl font-bold text-white mb-1">
          ${referralEarnings.toFixed(2)}
        </h3>
        <p className="text-sm text-zinc-400">From {totalReferrals} referrals</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-2xl border border-white/10 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-500/20 rounded-xl">
            <LuUsers className="w-6 h-6 text-green-400" />
          </div>
          <span className="text-xs text-zinc-400">Total Referrals</span>
        </div>
        <h3 className="text-3xl font-bold text-white mb-1">{totalReferrals}</h3>
        <p className="text-sm text-zinc-400">{activeReferrals} active traders</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl border border-white/10 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <LuTrendingUp className="w-6 h-6 text-purple-400" />
          </div>
          <span className="text-xs text-zinc-400">Bonus Rate</span>
        </div>
        <h3 className="text-3xl font-bold text-white mb-1">{bonusPercent}%</h3>
        <p className="text-sm text-zinc-400">On trading activation</p>
      </motion.div>
    </div>
  );
}
