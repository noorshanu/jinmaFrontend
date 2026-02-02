"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { LuMessageCircle } from "react-icons/lu";
import TradingNotActivatedNotice from "@/components/TradingNotActivatedNotice";
import { apiClient } from "@/lib/api";
import { useChatUnread } from "@/hooks/useChatUnread";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import DashboardErrorBoundary from "@/components/DashboardErrorBoundary";

const FLOAT_GAP = 24; // px from viewport edge
const FLOAT_Z = 9999;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isTradingActive, setIsTradingActive] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const { total: chatUnreadTotal } = useChatUnread();
  const isChatPage = pathname === "/dashboard/chat";

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const floatingUI =
    mounted && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 pointer-events-none z-[9999]">
            {/* Language: fixed left bottom */}
            <div
              className="pointer-events-auto"
              style={{
                position: "fixed",
                left: FLOAT_GAP,
                bottom: FLOAT_GAP,
                zIndex: FLOAT_Z,
              }}
            >
              <LanguageSwitcher />
            </div>
            {/* Chat: fixed right bottom (hidden when chat page is open) */}
            {!isChatPage && (
              <Link
                href="/dashboard/chat"
                className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 relative"
                style={{
                  position: "fixed",
                  right: FLOAT_GAP,
                  bottom: FLOAT_GAP,
                  zIndex: FLOAT_Z,
                }}
                title="Chat"
                aria-label={chatUnreadTotal > 0 ? `Chat (${chatUnreadTotal} unread)` : "Open Chat"}
              >
                <LuMessageCircle className="h-6 w-6" />
                {chatUnreadTotal > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-zinc-900 animate-pulse">
                    {chatUnreadTotal > 99 ? "99+" : chatUnreadTotal}
                  </span>
                )}
              </Link>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {isTradingActive === false && (
        <div className="w-full px-4 pt-4 pb-0 md:px-6 md:pt-4 mt-18 container mx-auto">
          <TradingNotActivatedNotice isTradingActive={false} className="w-full" />
        </div>
      )}
      <DashboardErrorBoundary>
        <div className="mt-18 sm:mt-0">{children}</div>
      </DashboardErrorBoundary>
      {floatingUI}
    </>
  );
}
