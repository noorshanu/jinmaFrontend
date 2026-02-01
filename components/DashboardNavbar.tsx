/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { 
  LuLayoutDashboard, 
  LuTicket, 
  LuTrendingUp, 
  LuUsers, 
  LuStar,
  LuMessageCircle,
  LuBell,
  LuSettings,
  LuLogOut,
  LuChevronDown
} from "react-icons/lu";
import NotificationDropdown from "@/components/NotificationDropdown";
import useChatUnread from "@/hooks/useChatUnread";

const navLinks = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LuLayoutDashboard },
  { href: "/dashboard/signals", labelKey: "nav.signals", icon: LuTicket },
  { href: "/dashboard/trade", labelKey: "nav.trade", icon: LuTrendingUp },
  { href: "/dashboard/referrals", labelKey: "nav.referrals", icon: LuUsers },
  { href: "/dashboard/grades", labelKey: "nav.grades", icon: LuStar },
];

// English fallbacks for SSR/hydration (server and client must match until mounted)
const navFallbacks: Record<string, string> = {
  "nav.dashboard": "Dashboard",
  "nav.signals": "Signals",
  "nav.trade": "Trade",
  "nav.chat": "Chat",
  "nav.referrals": "Referrals",
  "nav.grades": "Grades",
  "nav.notifications": "Notifications",
  "nav.settings": "Settings",
  "common.settings": "Settings",
  "common.wallet": "Wallet",
  "common.logout": "Logout",
};

// Read user from localStorage (only call on client)
function readUserFromStorage() {
  if (typeof window === "undefined") return { name: "User", email: "" };
  try {
    const stored = window.localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored) as {
        firstName?: string;
        lastName?: string;
        email?: string;
      };
      return {
        name: [parsed.firstName, parsed.lastName].filter(Boolean).join(" ") || "User",
        email: parsed.email || ""
      };
    }
  } catch (e) {
    console.error("Failed to parse stored user:", e);
  }
  return { name: "User", email: "" };
}

export default function DashboardNavbar() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  // Initialize with default values for SSR, update after mount
  const [userState, setUserState] = useState({ name: "User", email: "", loaded: false });
  const pathname = usePathname();
  const router = useRouter();
  const didLoad = useRef(false);
  const { total: chatUnreadTotal } = useChatUnread();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user data from localStorage after mount (client-side only)
  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    
    // Use queueMicrotask to avoid synchronous setState in effect
    queueMicrotask(() => {
      const userData = readUserFromStorage();
      setUserState({ ...userData, loaded: true });
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Get display values - show default on server, actual value after load
  const displayName = userState.loaded ? userState.name : "User";
  const displayEmail = userState.loaded ? userState.email : "";
  const initials = userState.loaded 
    ? (userState.name.split(" ").map(n => n[0]).join("") || "U")
    : "U";

  // Use fallback when not mounted or on server so server/client HTML match (avoid hydration error)
  const navLabel = (key: string) =>
    typeof window === "undefined" || !mounted
      ? (navFallbacks[key] ?? key)
      : t(key);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/80 backdrop-blur-xl border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="logo" className="w-50 h-14" />
          </Link>

          {/* Navigation Menu */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || 
                (link.href !== "/dashboard" && pathname?.startsWith(link.href));
              const Icon = link.icon;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-zinc-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon size={18} />
                  <span>{navLabel(link.labelKey)}</span>
                </Link>
              );
            })}
            {/* Notification bell + User avatar (combined, no username) */}
            <div className="flex items-center gap-2 ml-1">
              <NotificationDropdown />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdown(!profileDropdown)}
                  onMouseEnter={() => setProfileDropdown(true)}
                  className="relative w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-400 hover:ring-2 hover:ring-white/20 transition-all duration-300"
                  aria-label="Profile menu"
                >
                  <span className="text-white text-sm font-semibold uppercase">
                    {initials}
                  </span>
                  {/* Chevron overlay bottom-right (like image reference) */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center border border-zinc-600 transition-transform duration-200 ${
                      profileDropdown ? "rotate-180" : ""
                    }`}
                  >
                    <LuChevronDown className="w-2.5 h-2.5 text-white" />
                  </span>
                </button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {profileDropdown && (
                    <div
                      onMouseLeave={() => setProfileDropdown(false)}
                      className="absolute right-0 mt-2 w-48"
                    >
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl overflow-hidden"
                  >
                    <div className="p-3 border-b border-white/10">
                      <p className="text-white text-sm font-medium">{displayName}</p>
                      <p className="text-zinc-400 text-xs">
                        {displayEmail || "user@example.com"}
                      </p>
                    </div>
                    <div className="p-1">
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-all duration-300 text-sm"
                        onClick={() => setProfileDropdown(false)}
                      >
                        <LuSettings size={16} />
                        <span>{mounted ? t("common.settings") : navFallbacks["common.settings"]}</span>
                      </Link>
                      <Link
                        href="/dashboard/chat"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-all duration-300 text-sm relative"
                        onClick={() => setProfileDropdown(false)}
                      >
                        <LuMessageCircle size={16} />
                        <span>{navLabel("Chat")}</span>
                        {chatUnreadTotal > 0 && (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                            {chatUnreadTotal > 99 ? "99+" : chatUnreadTotal}
                          </span>
                        )}
                      </Link>
                      <Link
                        href="/dashboard/wallet"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-all duration-300 text-sm"
                        onClick={() => setProfileDropdown(false)}
                      >
                        <LuTrendingUp size={16} />
                        <span>{navLabel("common.wallet")}</span>
                      </Link>
                      <button
                        onClick={() => {
                          // Handle logout
                          if (typeof window !== "undefined") {
                            window.localStorage.removeItem("token");
                            window.localStorage.removeItem("user");
                          }
                          setProfileDropdown(false);
                          router.push("/login");
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 text-sm"
                      >
                        <LuLogOut size={16} />
                        <span>{navLabel("common.logout")}</span>
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden border-t border-white/10">
        <div className="flex items-center justify-around px-4 py-2 overflow-x-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || 
              (link.href !== "/dashboard" && pathname?.startsWith(link.href));
            const Icon = link.icon;
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs transition-all duration-300 ${
                  isActive
                    ? "text-blue-400"
                    : "text-zinc-400"
                }`}
              >
                <Icon size={20} />
                <span>{navLabel(link.labelKey)}</span>
              </Link>
            );
          })}
          <div className="flex items-center justify-center gap-2 py-2">
            <NotificationDropdown />
          </div>
        </div>
      </div>
    </nav>
  );
}
