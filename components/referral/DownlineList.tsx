"use client";

import { motion } from "framer-motion";
import { LuUsers, LuCircleCheck, LuCircleX, LuCalendar } from "react-icons/lu";

interface Downline {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  isTradingActive: boolean;
  referralEarnings: number;
  totalReferrals: number;
}

interface DownlineListProps {
  downline: Downline[];
}

export default function DownlineList({ downline }: DownlineListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }) + " UTC";
  };

  return (
    <motion.div
      key="downline"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
    >
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-semibold text-white">My Referrals</h2>
      </div>
      {!downline.length ? (
        <div className="p-12 text-center">
          <LuUsers size={40} className="mb-4 block mx-auto text-zinc-600" />
          <p className="text-zinc-400">No referrals yet</p>
          <p className="text-zinc-500 text-sm mt-2">
            Share your referral link to get started!
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/10">
          {downline.map((user) => (
            <div key={user.id} className="p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium">{user.name.split(' ')[0]}</h3>
                    {user.isTradingActive ? (
                      <LuCircleCheck className="w-4 h-4 text-green-400" title="Trading Active" />
                    ) : (
                      <LuCircleX className="w-4 h-4 text-yellow-400" title="Trading Inactive" />
                    )}
                  </div>
                  <p className="text-zinc-500 text-xs flex items-center gap-1 mt-0.5">
                    <LuCalendar className="w-3 h-3" />
                    Joined {formatDate(user.joinedAt)}
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
