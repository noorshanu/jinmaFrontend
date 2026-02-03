"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { LuBell, LuCheck, LuChevronRight } from "react-icons/lu";
import { apiClient, type NotificationItem, isRateLimitError } from "@/lib/api";

const DROPDOWN_Z = 9999;
const GAP = 8;
const SAFE_INSET = 12;

const DROPDOWN_LIMIT = 10;
const POLL_INTERVAL_MS = 60000;
const POLL_INTERVAL_BACKOFF_MS = 90000;

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { timeZone: "UTC" }) + " UTC";
  } catch {
    return "";
  }
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [position, setPosition] = useState({ top: 0, right: SAFE_INSET });
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const useBackoffRef = useRef(false);

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger || typeof window === "undefined") return;
    const rect = trigger.getBoundingClientRect();
    const top = rect.bottom + GAP;
    const right = Math.max(SAFE_INSET, window.innerWidth - rect.right);
    setPosition({ top, right });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  const fetchNotifications = async () => {
    if (typeof window === "undefined") return;
    setLoading(true);
    try {
      const res = await apiClient.getNotifications(1, DROPDOWN_LIMIT);
      if (res.success && res.data) {
        useBackoffRef.current = false;
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (e) {
      if (isRateLimitError(e)) useBackoffRef.current = true;
      // Keep previous notifications and unreadCount on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    let timeoutId: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = useBackoffRef.current ? POLL_INTERVAL_BACKOFF_MS : POLL_INTERVAL_MS;
      timeoutId = setTimeout(() => {
        fetchNotifications();
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = triggerRef.current?.contains(target);
      const inPanel = panelRef.current?.contains(target);
      if (open && !inTrigger && !inPanel) setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside as unknown as (e: TouchEvent) => void);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside as unknown as (e: TouchEvent) => void);
    };
  }, [open]);

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
    try {
      await apiClient.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const dropdownPanel = open && typeof document !== "undefined" && (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="fixed w-[360px] max-w-[calc(100vw-2rem)] bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl overflow-hidden"
        style={{
          zIndex: DROPDOWN_Z,
          top: position.top,
          right: position.right,
          left: "auto",
          maxHeight: "min(320px, 60vh)",
          marginLeft: position.right > 0 ? undefined : SAFE_INSET,
        }}
      >
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="overflow-y-auto overscroll-contain touch-pan-y" style={{ maxHeight: "min(280px, 50vh)" }}>
          {loading ? (
            <div className="p-6 text-center text-zinc-400 text-sm">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-zinc-400 text-sm">
              No notifications yet
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {notifications.map((n) => (
                <li key={n._id}>
                  <div
                    role={!n.read ? "button" : undefined}
                    tabIndex={!n.read ? 0 : undefined}
                    onClick={() => !n.read && handleMarkRead(n._id)}
                    onKeyDown={(e) => !n.read && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), handleMarkRead(n._id))}
                    className={`flex gap-3 p-3 hover:bg-white/5 transition-colors cursor-default ${
                      !n.read ? "bg-blue-500/5 cursor-pointer" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {n.title}
                      </p>
                      <p className="text-zinc-400 text-xs mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-zinc-500 text-xs mt-1">
                        {formatTime(n.createdAt)}
                      </p>
                    </div>
                    {!n.read && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleMarkRead(n._id); }}
                        disabled={markingId === n._id}
                        className="shrink-0 p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/20 disabled:opacity-50"
                        title="Mark as read"
                      >
                        <LuCheck size={16} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-2 border-t border-white/10">
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1 py-2 text-sm text-blue-400 hover:text-blue-300"
          >
            View all notifications
            <LuChevronRight size={16} />
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <>
      <div className="relative" ref={triggerRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="relative p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-all duration-300"
          aria-label="Notifications"
          aria-expanded={open}
        >
          <LuBell size={22} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-medium">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>
      {typeof document !== "undefined" && createPortal(dropdownPanel, document.body)}
    </>
  );
}
