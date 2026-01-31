"use client";

import { useState, useEffect } from "react";
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
    </>
  );
}
