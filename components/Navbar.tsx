/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState } from "react";
import { LuMenu, LuX } from "react-icons/lu";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

const links = [
  { id: "Home", label: "Home" },

];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("Home");
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [totalBalance, setTotalBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const router = useRouter();

  // Check login status and fetch balance
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        setIsLoggedIn(true);
        setBalanceLoading(true);
        try {
          const res = await apiClient.getWallet();
          if (res.success && res.data) {
            setTotalBalance(res.data.wallet.totalBalance);
          }
        } catch (err) {
          console.error("Failed to fetch balance:", err);
        } finally {
          setBalanceLoading(false);
        }
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id));
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0.01 }
    );
    links.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  };

  const formatBalance = (amount: number) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-black/80 backdrop-blur-md border-b border-white/5" : "bg-transparent"
    }`}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 md:h-20 items-center justify-between">
    
          <img src="/logo.png" alt="logo" onClick={() => go("Home")} className="w-50 h-14 cursor-pointer" />
   
          <nav className="hidden md:flex items-center gap-8">
            {links.map((l) =>
              l.id === "community" ? (
                <a 
                  key={l.id} 
                  href="https://x.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-zinc-300 hover:text-white transition-colors duration-300 relative group"
                >
                  {l.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-300 group-hover:w-full"></span>
                </a>
              ) : (
                <button
                  key={l.id}
                  onClick={() => go(l.id)}
                  className={`text-sm md:text-base transition-all duration-300 relative group ${
                    active === l.id ? "text-white" : "text-zinc-300 hover:text-white"
                  }`}
                >
                  {l.label}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-300 ${
                    active === l.id ? "w-full" : "w-0 group-hover:w-full"
                  }`}></span>
                </button>
              )
            )}

            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                {/* Balance Display */}
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                  <span className="text-emerald-400 text-sm">💰</span>
                  {balanceLoading ? (
                    <div className="w-16 h-4 bg-white/10 rounded animate-pulse"></div>
                  ) : (
                    <span className="text-white font-semibold text-sm">
                      ${formatBalance(totalBalance || 0)}
                    </span>
                  )}
                </div>
                
                {/* Dashboard Button */}
                <button 
                  onClick={() => router.push("/dashboard")} 
                  className="btn-primary rounded-xl px-4 py-2 md:px-6 md:py-3 font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
                >
                  Dashboard
                </button>
              </div>
            ) : (
              <button 
                onClick={() => router.push("/login")} 
                className="btn-primary rounded-xl px-4 py-2 md:px-6 md:py-3 font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
              >
                Login
              </button>
            )}
          </nav>

          <button 
            className="md:hidden text-zinc-300 hover:text-white transition-colors duration-300 p-2 rounded-lg hover:bg-white/5" 
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <LuX size={24} /> : <LuMenu size={24} />}
          </button>
        </div>

        {/* Enhanced Mobile Menu */}
        {open && (
          <div className="md:hidden mt-2 rounded-2xl border border-white/10 bg-black/90 backdrop-blur-xl px-6 py-4 flex flex-col gap-4 shadow-2xl">
            {links.map((l) =>
              l.id === "community" ? (
                <a 
                  key={l.id} 
                  href="https://x.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-zinc-300 hover:text-white transition-all duration-300 py-2 px-3 rounded-lg hover:bg-white/5 flex items-center justify-between group"
                >
                  <span>{l.label}</span>
                  <div className="w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
              ) : (
                <button 
                  key={l.id} 
                  onClick={() => go(l.id)} 
                  className={`text-zinc-300 text-left hover:text-white transition-all duration-300 py-2 px-3 rounded-lg hover:bg-white/5 flex items-center justify-between group ${
                    active === l.id ? "text-white bg-white/5" : ""
                  }`}
                >
                  <span>{l.label}</span>
                  <div className={`w-2 h-2 bg-blue-400 rounded-full transition-all duration-300 ${
                    active === l.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}></div>
                </button>
              )
            )}
            
            <div className="border-t border-white/10 pt-4 mt-2 space-y-3">
              {isLoggedIn ? (
                <>
                  {/* Mobile Balance Display */}
                  <div className="flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
                    <span className="text-zinc-400 text-sm">Total Balance</span>
                    {balanceLoading ? (
                      <div className="w-20 h-5 bg-white/10 rounded animate-pulse"></div>
                    ) : (
                      <span className="text-emerald-400 font-bold">
                        ${formatBalance(totalBalance || 0)}
                      </span>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => {
                      setOpen(false);
                      router.push("/dashboard");
                    }} 
                    className="btn-primary rounded-xl px-4 py-3 font-medium w-full transition-all duration-300 hover:scale-105"
                  >
                    Dashboard
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => {
                    setOpen(false);
                    router.push("/login");
                  }} 
                  className="btn-primary rounded-xl px-4 py-3 font-medium w-full transition-all duration-300 hover:scale-105"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`.clip-tri{clip-path:polygon(50% 0%,0% 100%,100% 100%)}`}</style>
    </header>
  );
}
