"use client";

import { motion } from "framer-motion";
import { LuDollarSign } from "react-icons/lu";

interface HowItWorksProps {
  bonusPercent: number;
}

export default function HowItWorks({ bonusPercent }: HowItWorksProps) {
  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 backdrop-blur-xl rounded-2xl border border-white/10 p-8"
    >
      <h2 className="text-2xl font-semibold text-white mb-6">How It Works</h2>
      <div className="space-y-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
            <span className="text-blue-400 font-bold">1</span>
          </div>
          <div>
            <h3 className="text-white font-medium mb-1">Share Your Link</h3>
            <p className="text-zinc-400 text-sm">
              Copy your unique referral link and share it with friends, family, or on social media.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
            <span className="text-green-400 font-bold">2</span>
          </div>
          <div>
            <h3 className="text-white font-medium mb-1">They Sign Up & Deposit</h3>
            <p className="text-zinc-400 text-sm">
              Your referral creates an account, makes a deposit, and transfers funds to their movement wallet.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
            <span className="text-purple-400 font-bold">3</span>
          </div>
          <div>
            <h3 className="text-white font-medium mb-1">Admin Activates Trading</h3>
            <p className="text-zinc-400 text-sm">
              Once the admin verifies and activates their trading account, you automatically receive your bonus!
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <LuDollarSign className="text-yellow-400" />
          </div>
          <div>
            <h3 className="text-white font-medium mb-1">Earn {bonusPercent}% Bonus</h3>
            <p className="text-zinc-400 text-sm">
              You&apos;ll receive {bonusPercent}% of their movement wallet balance directly to your main wallet. The more they deposit, the more you earn!
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
