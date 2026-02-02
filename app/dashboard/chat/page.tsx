"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import DashboardNavbar from "@/components/DashboardNavbar";
import DashboardFooter from "@/components/DashboardFooter";
import { apiClient, ChatMessage, isRateLimitError } from "@/lib/api";
import { setChatLastSeenGroup, setChatLastSeenPrivate, CHAT_LAST_SEEN_UPDATED } from "@/hooks/useChatUnread";
import { LuRefreshCw, LuSend, LuMessageCircle, LuImage, LuUser, LuUsers, LuHeadphones, LuReply, LuX } from "react-icons/lu";

const POLL_INTERVAL_MS = 10000;
const POLL_INTERVAL_BACKOFF_MS = 30000;
const DRAFT_DEBOUNCE_MS = 400;
const DRAFT_KEY_GROUP = "chatDraftGroup";
const DRAFT_KEY_PRIVATE = "chatDraftPrivate";
type Tab = "group" | "private";

function getDraftKey(tab: Tab): string {
  return tab === "group" ? DRAFT_KEY_GROUP : DRAFT_KEY_PRIVATE;
}

function getInitials(sender: ChatMessage["sender"]) {
  if (!sender) return "A";
  const first = sender.firstName?.trim().charAt(0) || "";
  const last = sender.lastName?.trim().charAt(0) || "";
  if (first || last) return (first + last).toUpperCase();
  return sender.email?.charAt(0)?.toUpperCase() || "U";
}

function isAdminSender(m: ChatMessage) {
  return m.sender?.role === "ADMIN" || m.sender?.role === "admin";
}

export default function ChatPage() {
  const [tab, setTab] = useState<Tab>("group");
  const [groupConvId, setGroupConvId] = useState<string | null>(null);
  const [groupChatEnabled, setGroupChatEnabled] = useState<boolean>(true);
  const [privateConvId, setPrivateConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollToBottomNextRef = useRef(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const currentConvId = tab === "group" ? groupConvId : privateConvId;
  const LOAD_OLDER_LIMIT = 50;

  // Update last-seen when viewing this tab so unread badge resets; notify so badge refreshes immediately
  useEffect(() => {
    const now = new Date().toISOString();
    if (tab === "group") setChatLastSeenGroup(now);
    else setChatLastSeenPrivate(now);
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(CHAT_LAST_SEEN_UPDATED));
  }, [tab, messages]);

  const fetchGroupConversation = useCallback(async () => {
    try {
      const res = await apiClient.getGroupConversation();
      if (res.success && res.data) {
        setGroupConvId(res.data.id);
        if (typeof res.data.groupChatEnabled === "boolean") setGroupChatEnabled(res.data.groupChatEnabled);
        return res.data.id;
      }
    } catch (e) {
      if (isRateLimitError(e)) {
        setRateLimited(true);
        return null;
      }
      setError(e instanceof Error ? e.message : "Failed to load group chat");
    }
    return null;
  }, []);

  const fetchPrivateConversation = useCallback(async () => {
    try {
      const res = await apiClient.getChatConversation();
      if (res.success && res.data) {
        setPrivateConvId(res.data.id);
        return res.data.id;
      }
    } catch (e) {
      if (isRateLimitError(e)) {
        setRateLimited(true);
        return null;
      }
      setError(e instanceof Error ? e.message : "Failed to load support chat");
    }
    return null;
  }, []);

  const fetchMessages = useCallback(async (convId: string, appendOlder = false) => {
    if (!convId) return;
    if (appendOlder) setLoadingOlder(true);
    try {
      const before = appendOlder && messages.length > 0 ? messages[0].createdAt : undefined;
      const limit = appendOlder ? LOAD_OLDER_LIMIT : 100;
      const res = await apiClient.getChatMessages(convId, { before, limit });
      if (res.success && res.data?.messages) {
        setRateLimited(false);
        if (appendOlder) {
          if (res.data.messages.length < limit) setHasMoreOlder(false);
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newOnes = res.data!.messages.filter((m) => !existingIds.has(m.id));
            return [...newOnes, ...prev];
          });
        } else {
          setMessages(res.data.messages);
          setHasMoreOlder(res.data.messages.length >= limit);
        }
      }
    } catch (e) {
      if (isRateLimitError(e)) {
        setRateLimited(true);
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to load messages");
    } finally {
      if (appendOlder) setLoadingOlder(false);
    }
  }, [messages]);

  useEffect(() => {
    let mounted = true;
    scrollToBottomNextRef.current = true;
    const init = async () => {
      setLoading(true);
      setError(null);
      const groupId = await fetchGroupConversation();
      const privateId = await fetchPrivateConversation();
      if (mounted) {
        setLoading(false);
        if (tab === "group" && groupId) await fetchMessages(groupId);
        if (tab === "private" && privateId) await fetchMessages(privateId);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [fetchGroupConversation, fetchPrivateConversation]);

  useEffect(() => {
    setHasMoreOlder(true);
    scrollToBottomNextRef.current = true;
    if (tab === "group") {
      fetchGroupConversation().then((id) => {
        if (id) fetchMessages(id);
      });
    } else if (privateConvId) {
      fetchMessages(privateConvId);
    }
  }, [tab]);

  useEffect(() => {
    if (!currentConvId) return;
    const intervalMs = rateLimited ? POLL_INTERVAL_BACKOFF_MS : POLL_INTERVAL_MS;
    const interval = setInterval(() => {
      fetchMessages(currentConvId);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [currentConvId, fetchMessages, rateLimited]);

  useEffect(() => {
    if (scrollToBottomNextRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      scrollToBottomNextRef.current = false;
    }
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollToBottom(false);
  }, []);

  const checkScrollPosition = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const threshold = 80;
    const nearBottom = scrollHeight - scrollTop - clientHeight <= threshold;
    setShowScrollToBottom(!nearBottom);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    checkScrollPosition();
    el.addEventListener("scroll", checkScrollPosition, { passive: true });
    const ro = new ResizeObserver(checkScrollPosition);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScrollPosition);
      ro.disconnect();
    };
  }, [checkScrollPosition, tab, messages.length]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setError(null);
  };

  useEffect(() => {
    if (tab === "group" && groupConvId) fetchMessages(groupConvId);
    else if (tab === "private" && privateConvId) fetchMessages(privateConvId);
  }, [tab, groupConvId, privateConvId, fetchMessages]);

  const handleSend = async () => {
    let text = content.trim();
    if (!currentConvId || sending) return;
    if (replyToMessage) {
      const quoted = replyToMessage.content?.slice(0, 80) || "(attachment)";
      text = `> ${quoted}${quoted.length >= 80 ? "…" : ""}\n\n${text}`;
      setReplyToMessage(null);
    }
    if (!text) return;
    setSending(true);
    setError(null);
    try {
      const res = await apiClient.sendChatMessage(currentConvId, text);
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data!]);
        setContent("");
        if (typeof window !== "undefined") localStorage.setItem(getDraftKey(tab), "");
        scrollToBottomNextRef.current = true;
      }
    } catch (e) {
      if (isRateLimitError(e)) return;
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentConvId || uploading || sending) return;
    if (!file.type.startsWith("image/")) {
      setError("Only images are allowed (JPEG, PNG, WebP).");
      e.target.value = "";
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const uploadRes = await apiClient.uploadChatImage(file);
      if (!uploadRes.success || !uploadRes.data) {
        setError(uploadRes.message || "Upload failed");
        e.target.value = "";
        return;
      }
      const sendRes = await apiClient.sendChatMessage(currentConvId, content.trim() || "", {
        type: "image",
        attachment: {
          url: uploadRes.data.url,
          publicId: uploadRes.data.publicId,
          mimeType: uploadRes.data.mimeType,
          originalName: uploadRes.data.originalName,
        },
      });
      if (sendRes.success && sendRes.data) {
        setMessages((prev) => [...prev, sendRes.data!]);
        setContent("");
        scrollToBottomNextRef.current = true;
      }
    } catch (e) {
      if (isRateLimitError(e)) return;
      setError(e instanceof Error ? e.message : "Upload or send failed");
    } finally {
      setUploading(false);
      if (e.target) (e.target as HTMLInputElement).value = "";
    }
  };

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  if (loading) {
    return (
      <>
        <DashboardNavbar />
        <div className="min-h-screen bg-grid pt-24 pb-8 px-4 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <LuRefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-zinc-400 text-sm">Loading chat...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardNavbar />
      <div className="min-h-screen bg-grid pt-24 pb-8 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-2">
              <LuMessageCircle className="w-8 h-8 text-blue-400" />
              Chat
            </h1>
            <p className="text-zinc-400 text-sm">
              {tab === "group"
                ? "Group chat with all users. Only admins can message you privately."
                : "Private support. Only you and admins see this thread."}
            </p>
          </motion.div>

          {/* Tabs: Group | Private */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => handleTabChange("group")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                tab === "group"
                  ? "bg-blue-500/20 border border-blue-500/40 text-blue-300"
                  : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <LuUsers className="w-4 h-4" />
              Group Chat
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("private")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                tab === "private"
                  ? "bg-blue-500/20 border border-blue-500/40 text-blue-300"
                  : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <LuHeadphones className="w-4 h-4" />
              Private Support
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden flex flex-col shadow-xl"
            style={{ minHeight: "480px" }}
          >
            <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                {tab === "group" ? (
                  <LuUsers className="w-5 h-5 text-blue-400" />
                ) : (
                  <LuUser className="w-5 h-5 text-blue-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-white">
                  {tab === "group" ? "Group Chat" : "Admin Support"}
                </p>
                <p className="text-xs text-zinc-500">
                  {tab === "group"
                    ? "All users and admin can see messages"
                    : "Only you and admins see this thread"}
                </p>
              </div>
            </div>

            {rateLimited && (
              <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-amber-200 text-sm">
                <LuRefreshCw className="w-4 h-4 shrink-0" />
                <span>Updates paused – too many requests. Resuming shortly.</span>
              </div>
            )}

            <div className="relative flex-1 flex flex-col min-h-[320px] max-h-[55vh]">
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4"
              >
              {sortedMessages.length > 0 && hasMoreOlder && (
                <div className="flex justify-center pb-2">
                  <button
                    type="button"
                    onClick={() => currentConvId && fetchMessages(currentConvId, true)}
                    disabled={loadingOlder}
                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 disabled:opacity-50"
                    title="Load older messages"
                  >
                    {loadingOlder ? (
                      <span className="inline-block w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                    <span>{loadingOlder ? "Loading…" : "Load older"}</span>
                  </button>
                </div>
              )}
              {sortedMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <LuMessageCircle className="w-8 h-8 text-zinc-500" />
                  </div>
                  <p className="text-zinc-400 font-medium">No messages yet</p>
                  <p className="text-zinc-500 text-sm mt-1">
                    {tab === "group" ? "Say hello in the group." : "Send a message to get support."}
                  </p>
                </div>
              )}
              {sortedMessages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 group/item ${isAdminSender(m) ? "flex-row" : "flex-row-reverse"}`}
                >
                  <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold bg-white/10 border border-white/10 text-zinc-300">
                    {getInitials(m.sender)}
                  </div>
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 relative ${
                      isAdminSender(m)
                        ? "bg-blue-500/20 border border-blue-500/30 text-left rounded-tl-md"
                        : "bg-white/10 border border-white/20 text-right rounded-tr-md"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setReplyToMessage(m)}
                      className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover/item:opacity-100 hover:bg-white/10 text-zinc-400 hover:text-white transition-opacity"
                      title="Reply"
                      aria-label="Reply to this message"
                    >
                      <LuReply className="w-3.5 h-3.5" />
                    </button>
                    <p className="text-xs text-zinc-400 mb-1.5 flex items-center gap-2 flex-wrap pr-6">
                      <span>
                        {m.sender
                          ? `${m.sender.firstName || ""} ${m.sender.lastName || ""}`.trim() || m.sender.email
                          : "Unknown"}
                      </span>
                      {isAdminSender(m) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/30 text-amber-300 text-[10px] font-semibold uppercase tracking-wide">
                          Admin
                        </span>
                      )}
                    </p>
                    {m.type === "text" && <p className="text-white text-sm whitespace-pre-wrap">{m.content || ""}</p>}
                    {m.type === "image" && m.attachment?.url && (
                      <a
                        href={m.attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-2"
                      >
                        <img
                          src={m.attachment.url}
                          alt="Attachment"
                          className="rounded-lg max-w-full max-h-64 object-contain"
                        />
                      </a>
                    )}
                    {m.type === "video" && m.attachment?.url && (
                      <div className="mt-2">
                        <video
                          src={m.attachment.url}
                          controls
                          className="rounded-lg max-w-full max-h-64"
                        />
                      </div>
                    )}
                    {m.type === "file" && m.attachment?.url && (
                      <a
                        href={m.attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-blue-400 text-sm hover:underline"
                      >
                        {m.attachment.originalName || "Download file"}
                      </a>
                    )}
                    {m.type === "cls_signal" && m.signal && (
                      <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <p className="text-amber-300 font-medium text-sm">CLS Signal</p>
                        <p className="text-white text-sm mt-1">{m.signal.title}</p>
                        <p className="text-zinc-400 text-xs mt-1">
                          Commit {m.signal.commitPercent}% • Outcome: {m.signal.outcomeType} • Expires:{" "}
                          {new Date(m.signal.expiresAt).toLocaleString()}
                        </p>
                        {m.signal.status === "ACTIVE" && (
                          <Link
                            href="/dashboard/signals"
                            className="mt-2 inline-block px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-sm font-medium hover:bg-amber-500/30"
                          >
                            Use signal
                          </Link>
                        )}
                      </div>
                    )}
                    {(m.content && m.type !== "text") && <p className="text-white text-sm mt-2">{m.content}</p>}
                    <p className="text-xs text-zinc-500 mt-2">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
              </div>
              {showScrollToBottom && (
                <button
                  type="button"
                  onClick={scrollToBottom}
                  className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium shadow-lg hover:bg-blue-600 z-10"
                  aria-label="Scroll to new messages"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  New messages
                </button>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-white/5 flex flex-col gap-2">
              {tab === "group" && !groupChatEnabled && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-200">
                  Group chat is currently disabled by admin. You can still read messages. Use <strong>Private Support</strong> to message admin.
                </div>
              )}
              {replyToMessage && (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm">
                  <span className="text-zinc-400 truncate flex-1">
                    Replying to: {replyToMessage.content?.slice(0, 50) || "(attachment)"}
                    {(replyToMessage.content?.length ?? 0) > 50 ? "…" : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyToMessage(null)}
                    className="shrink-0 p-1 rounded text-zinc-400 hover:text-white"
                    aria-label="Cancel reply"
                  >
                    <LuX className="w-4 h-4" />
                  </button>
                </div>
              )}
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-blue-400">
                  <LuRefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  Uploading image…
                </div>
              )}
              <div className="flex gap-2 items-end">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || sending || (tab === "group" && !groupChatEnabled)}
                  className="shrink-0 p-2.5 rounded-xl border border-white/20 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
                  title="Send image"
                  aria-label="Attach image"
                >
                  <LuImage className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder={tab === "group" && !groupChatEnabled ? "Group chat is disabled" : "Type a message..."}
                  className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  disabled={sending || (tab === "group" && !groupChatEnabled)}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || (!content.trim() && !uploading) || (tab === "group" && !groupChatEnabled)}
                  className="shrink-0 rounded-xl bg-blue-500 px-4 py-3 text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  {sending ? (
                    <LuRefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <LuSend className="w-5 h-5" />
                  )}
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <DashboardFooter />
    </>
  );
}
