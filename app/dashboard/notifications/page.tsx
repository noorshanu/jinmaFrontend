"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardNavbar from "@/components/DashboardNavbar";
import { apiClient, type NotificationItem } from "@/lib/api";
import { LuBell, LuCheck, LuCheckCheck } from "react-icons/lu";

const PAGE_SIZE = 20;

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const utcDateStr = d.toLocaleDateString("en-US", { timeZone: "UTC" });
    const todayUTC = now.toLocaleDateString("en-US", { timeZone: "UTC" });
    const yesterdayUTC = new Date(now.getTime() - 864e5).toLocaleDateString("en-US", { timeZone: "UTC" });
    const timeUTC = d.toLocaleTimeString("en-US", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" });
    if (utcDateStr === todayUTC) return `Today ${timeUTC} UTC`;
    if (utcDateStr === yesterdayUTC) return `Yesterday ${timeUTC} UTC`;
    return d.toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) + " UTC";
  } catch {
    return iso;
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasMore = page < pages;

  const fetchNotifications = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await apiClient.getNotifications(pageNum, PAGE_SIZE);
      if (res.success && res.data) {
        if (pageNum === 1) {
          setNotifications(res.data.notifications);
        } else {
          setNotifications((prev) => [...prev, ...res.data!.notifications]);
        }
        setTotal(res.data.total);
        setUnreadCount(res.data.unreadCount);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  const loadMore = () => {
    if (loading || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchNotifications(next);
  };

  const handleMarkRead = async (id: string) => {
    setMarkingId(id);
    try {
      await apiClient.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await apiClient.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <>
      <DashboardNavbar />
      <div className="min-h-screen bg-grid pt-24 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Notifications</h1>
              <p className="text-zinc-400 text-sm">
                Trading activated, withdrawals, referral bonuses, and more
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                <LuCheckCheck size={18} />
                {markingAll ? "Marking..." : "Mark all read"}
              </button>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
          >
            {loading && notifications.length === 0 ? (
              <div className="p-12 text-center text-zinc-400">
                <LuBell size={40} className="mx-auto mb-3 opacity-50" />
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-zinc-400">
                <LuBell size={40} className="mx-auto mb-3 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm mt-1">
                  You&apos;ll see updates here when your trading is activated, withdrawals are processed, referral bonuses are credited, etc.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {notifications.map((n) => (
                  <li
                    key={n._id}
                    className={`p-4 ${!n.read ? "bg-blue-500/5" : ""}`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium">{n.title}</p>
                        <p className="text-zinc-400 text-sm mt-1">{n.message}</p>
                        <p className="text-zinc-500 text-xs mt-2">
                          {formatDate(n.createdAt)}
                        </p>
                      </div>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(n._id)}
                          disabled={markingId === n._id}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-blue-400 hover:bg-blue-500/20 text-xs font-medium disabled:opacity-50"
                        >
                          <LuCheck size={14} />
                          {markingId === n._id ? "..." : "Mark read"}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {hasMore && notifications.length > 0 && (
              <div className="p-3 border-t border-white/10 text-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loading}
                  className="px-4 py-2 text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
                >
                  {loading ? "Loading..." : `Load more (${notifications.length} of ${total})`}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
