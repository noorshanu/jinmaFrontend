"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LuCopy, LuCheck, LuShieldCheck } from "react-icons/lu";

interface ExchangeStyleDepositProps {
  depositAddress: string;
  depositNetwork: string;
}

export default function ExchangeStyleDeposit({
  depositAddress,
  depositNetwork,
}: ExchangeStyleDepositProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(depositAddress)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 mb-6"
    >
      <div className="flex items-center gap-2 text-emerald-400 mb-2">
        <LuShieldCheck className="w-5 h-5" />
        <h2 className="text-lg font-semibold text-white">Your unique deposit address</h2>
      </div>
      <p className="text-amber-200/90 text-sm mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
        <strong>Warning:</strong> Send only USDT on <strong>BEP20 (BSC)</strong> to this address. Sending on a different network (e.g. ERC20, other chains) or to a wrong address will result in <strong>permanent loss of funds</strong>. Double-check the network and address before sending.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="shrink-0 w-40 h-40 rounded-xl bg-white p-2">
          <img
            src={qrUrl}
            alt="Deposit address QR"
            className="w-full h-full object-contain"
            width={160}
            height={160}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">{depositNetwork}</p>
          <p className="text-white font-mono text-sm break-all mb-3">{depositAddress}</p>
          <button
            type="button"
            onClick={copyAddress}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm transition-colors"
          >
            {copied ? (
              <>
                <LuCheck className="w-4 h-4 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <LuCopy className="w-4 h-4" />
                Copy address
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
