"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import DashboardNavbar from "@/components/DashboardNavbar";
import DashboardFooter from "@/components/DashboardFooter";
import { apiClient, ChatMessage } from "@/lib/api";
import { LuRefreshCw, LuSend, LuMessageCircle, LuImage, LuUser } from "react-icons/lu";

const POLL_INTERVAL_MS = 6000;

function getInitials(sender: ChatMessage["sender"]) {
  if (!sender) return "A";
  const first = sender.firstName?.trim().charAt(0) || "";
  const last = sender.lastName?.trim().charAt(0) || "";
  if (first || last) return (first + last).toUpperCase();
  return sender.email?.charAt(0)?.toUpperCase() || "U";
}

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchConversation = useCallback(async () => {
    try {
      const res = await apiClient.getChatConversation();
      if (res.success && res.data) {
        setConversationId(res.data.id);
        return res.data.id;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load chat");
    }
    return null;
  }, []);

  const fetchMessages = useCallback(
    async (convId: string) => {
      if (!convId) return;
      try {
        const res = await apiClient.getChatMessages(convId, { limit: 100 });
        if (res.success && res.data?.messages) {
          setMessages(res.data.messages);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load messages");
      }
    },
    []
  );

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      setError(null);
      const convId = await fetchConversation();
      if (mounted && convId) {
        await fetchMessages(convId);
      }
      if (mounted) setLoading(false);
    };
    init();
    return () => {
      mounted = false;
    };
  }, [fetchConversation, fetchMessages]);

  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(() => {
      fetchMessages(conversationId);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = content.trim();
    if (!conversationId || sending) return;
    if (!text) return;
    setSending(true);
    setError(null);
    try {
      const res = await apiClient.sendChatMessage(conversationId, text);
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data!]);
        setContent("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId || uploading || sending) return;
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
      const sendRes = await apiClient.sendChatMessage(conversationId, content.trim() || "", {
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
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload or send failed");
    } finally {
      setUploading(false);
      if (e.target) (e.target as HTMLInputElement).value = "";
    }
  };

  const isAdmin = (m: ChatMessage) =>
    m.sender?.role === "ADMIN" || m.sender?.role === "admin" || m.sender?.email?.toLowerCase().includes("admin");

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
              Chat with Admin
            </h1>
            <p className="text-zinc-400 text-sm">
              1:1 support. Only you and admins can see this thread. You can send text and images.
            </p>
          </motion.div>

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
            {/* Header strip */}
            <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <LuUser className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-white">Admin Support</p>
                <p className="text-xs text-zinc-500">Replies usually within a few hours</p>
              </div>
            </div>

            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[320px] max-h-[55vh]"
            >
              {sortedMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <LuMessageCircle className="w-8 h-8 text-zinc-500" />
                  </div>
                  <p className="text-zinc-400 font-medium">No messages yet</p>
                  <p className="text-zinc-500 text-sm mt-1">Say hello or send an image to get started.</p>
                </div>
              )}
              {sortedMessages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${isAdmin(m) ? "flex-row" : "flex-row-reverse"}`}
                >
                  <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold bg-white/10 border border-white/10 text-zinc-300">
                    {getInitials(m.sender)}
                  </div>
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                      isAdmin(m)
                        ? "bg-blue-500/20 border border-blue-500/30 text-left rounded-tl-md"
                        : "bg-white/10 border border-white/20 text-right rounded-tr-md"
                    }`}
                  >
                    <p className="text-xs text-zinc-400 mb-1.5">
                      {m.sender
                        ? `${m.sender.firstName || ""} ${m.sender.lastName || ""}`.trim() || m.sender.email
                        : "Admin"}
                      {isAdmin(m) && <span className="ml-1 text-blue-400">(Admin)</span>}
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

            <div className="p-4 border-t border-white/10 bg-white/5 flex flex-col gap-2">
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
                  disabled={uploading || sending}
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
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || (!content.trim() && !uploading)}
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
