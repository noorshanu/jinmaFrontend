"use client";

import { motion } from "framer-motion";
import { LuDollarSign } from "react-icons/lu";

interface Bonus {
  id: string;
  referee: { name: string; email: string } | null;
  bonusAmount: number;
  bonusPercent: number;
  basedOnAmount: number;
  level: number;
  createdAt: string;
}

interface BonusHistoryProps {
  bonuses: Bonus[];
}

export default function BonusHistory({ bonuses }: BonusHistoryProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <motion.div
      key="bonuses"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
    >
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-semibold text-white">Recent Bonuses</h2>
      </div>
      {!bonuses.length ? (
        <div className="p-12 text-center">
          <LuDollarSign size={40} className="mb-4 block mx-auto text-zinc-600" />
          <p className="text-zinc-400">No bonuses yet</p>
          <p className="text-zinc-500 text-sm mt-2">
            Start referring friends to earn bonuses!
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/10">
          {bonuses.map((bonus) => (
            <div key={bonus.id} className="p-6 hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium">
                      {bonus.referee?.name || "Unknown User"}
                    </h3>
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                      Level {bonus.level}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-sm">{bonus.referee?.email}</p>
                  <p className="text-zinc-500 text-xs mt-1">
                    {formatDate(bonus.createdAt)} • Based on $
                    {bonus.basedOnAmount.toFixed(2)} • {bonus.bonusPercent}% bonus
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-400">
                    +${bonus.bonusAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
