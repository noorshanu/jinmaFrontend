"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { LuMessageCircle } from "react-icons/lu";
import TradingNotActivatedNotice from "@/components/TradingNotActivatedNotice";
import { apiClient } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isTradingActive, setIsTradingActive] = useState<boolean | null>(null);

  useEffect(() => {
    apiClient
      .getUserProfile()
      .then((res) => {
        if (res.success && res.data) {
          setIsTradingActive(res.data.isTradingActive ?? false);
        } else {
          setIsTradingActive(null);
        }
      })
      .catch(() => setIsTradingActive(null));
  }, []);

  return (
    <>
      {isTradingActive === false && (
        <div className="w-full px-4 pt-4 pb-0 md:px-6 md:pt-4 mt-18 container mx-auto">
          <TradingNotActivatedNotice isTradingActive={false} className="w-full" />
        </div>
      )}
    <div className="mt-18 sm:mt-0"> 

    {children}
    </div>
      {/* Floating Chat button - right side */}
      <Link
        href="/dashboard/chat"
        className="fixed right-6 bottom-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
        title="Chat"
        aria-label="Open Chat"
      >
        <LuMessageCircle className="h-6 w-6" />
      </Link>
    </>
  );
}
