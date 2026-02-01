"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";

const STORAGE_LAST_SEEN_GROUP = "chatLastSeenGroup";
const STORAGE_LAST_SEEN_PRIVATE = "chatLastSeenPrivate";
const POLL_INTERVAL_MS = 15000;

/** Dispatch this after updating lastSeen so badge refreshes immediately */
export const CHAT_LAST_SEEN_UPDATED = "chatLastSeenUpdated";

export function getChatLastSeenFromStorage(): {
  lastSeenGroup?: string;
  lastSeenPrivate?: string;
} {
  if (typeof window === "undefined") return {};
  return {
    lastSeenGroup: localStorage.getItem(STORAGE_LAST_SEEN_GROUP) || undefined,
    lastSeenPrivate: localStorage.getItem(STORAGE_LAST_SEEN_PRIVATE) || undefined,
  };
}

export function setChatLastSeenGroup(iso: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_LAST_SEEN_GROUP, iso);
}

export function setChatLastSeenPrivate(iso: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_LAST_SEEN_PRIVATE, iso);
}

export function useChatUnread(): {
  total: number;
  unreadGroup: number;
  unreadPrivate: number;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [total, setTotal] = useState(0);
  const [unreadGroup, setUnreadGroup] = useState(0);
  const [unreadPrivate, setUnreadPrivate] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnread = useCallback(async () => {
    try {
      const { lastSeenGroup, lastSeenPrivate } = getChatLastSeenFromStorage();
      const res = await apiClient.getChatUnread({ lastSeenGroup, lastSeenPrivate });
      if (res.success && res.data) {
        setTotal(res.data.total);
        setUnreadGroup(res.data.unreadGroup);
        setUnreadPrivate(res.data.unreadPrivate);
      }
    } catch {
      setTotal(0);
      setUnreadGroup(0);
      setUnreadPrivate(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, POLL_INTERVAL_MS);
    const onUpdated = () => { fetchUnread(); };
    window.addEventListener(CHAT_LAST_SEEN_UPDATED, onUpdated);
    return () => {
      clearInterval(interval);
      window.removeEventListener(CHAT_LAST_SEEN_UPDATED, onUpdated);
    };
  }, [fetchUnread]);

  return { total, unreadGroup, unreadPrivate, loading, refresh: fetchUnread };
}

export default useChatUnread;
