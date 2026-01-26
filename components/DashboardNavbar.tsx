/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LuLayoutDashboard, 
  LuTicket, 
  LuTrendingUp, 
  LuUsers, 
  LuStar,
  LuSettings,
  LuLogOut,
  LuChevronDown
} from "react-icons/lu";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LuLayoutDashboard },
  { href: "/dashboard/coupons", label: "Coupons", icon: LuTicket },
  { href: "/dashboard/trade", label: "Trade", icon: LuTrendingUp },
  { href: "/dashboard/referrals", label: "Referrals", icon: LuUsers },
  { href: "/dashboard/grades", label: "Grades", icon: LuStar },
];

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
  const [scrolled, setScrolled] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  // Initialize with default values for SSR, update after mount
  const [userState, setUserState] = useState({ name: "User", email: "", loaded: false });
  const pathname = usePathname();
  const router = useRouter();
  const didLoad = useRef(false);

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
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Profile Section */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdown(!profileDropdown)}
              onMouseEnter={() => setProfileDropdown(true)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-all duration-300"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {initials}
                </span>
              </div>
              <span className="text-white font-medium text-sm hidden sm:block">
                {displayName}
              </span>
              <LuChevronDown
                className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${
                  profileDropdown ? "rotate-180" : ""
                }`}
              />
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
                        <span>Settings</span>
                      </Link>
                      <Link
                        href="/dashboard/wallet"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-all duration-300 text-sm"
                        onClick={() => setProfileDropdown(false)}
                      >
                        <LuTrendingUp size={16} />
                        <span>Wallet</span>
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
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
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
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
