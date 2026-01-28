"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { LuCopy, LuCheck, LuExternalLink } from "react-icons/lu";

interface ReferralLinkProps {
  referralUrl?: string;
  referralCode?: string;
  bonusPercent: number;
}

export default function ReferralLink({ referralUrl, referralCode, bonusPercent }: ReferralLinkProps) {
  const [copied, setCopied] = useState(false);

  // Generate domain-centric referral URL
  const generatedReferralUrl = useMemo(() => {
    // If referralCode is provided, generate URL dynamically
    if (referralCode) {
      if (typeof window === 'undefined') {
        // SSR fallback
        return '';
      }

      const { host } = window.location;
      
      // Use http for localhost, https for production
      const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
      const urlProtocol = isLocalhost ? 'http' : 'https';
      
      // Build the URL
      return `${urlProtocol}://${host}/register?ref=${referralCode}`;
    }
    
    // Fallback to provided referralUrl if no referralCode
    return referralUrl || '';
  }, [referralCode, referralUrl]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
    >
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <LuExternalLink className="w-5 h-5" />
        Your Referral Link
      </h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={generatedReferralUrl}
            readOnly
            className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <button
          onClick={() => copyToClipboard(generatedReferralUrl)}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <LuCheck className="w-5 h-5" />
              Copied!
            </>
          ) : (
            <>
              <LuCopy className="w-5 h-5" />
              Copy
            </>
          )}
        </button>
      </div>
      <p className="text-zinc-400 text-sm mt-3">
        Share this link with friends. When they sign up, deposit, and activate trading, you&apos;ll earn {bonusPercent}% of their trading account balance!
      </p>
    </motion.div>
  );
}
