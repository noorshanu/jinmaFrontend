"use client";

import Link from "next/link";
import { LuHeart } from "react-icons/lu";

const DashboardFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-black/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-zinc-500 text-sm flex items-center gap-1">
            © {currentYear} MarketProject. Made with{" "}
            <LuHeart size={14} className="text-red-400" /> All rights reserved.
          </p>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard/settings"
              className="text-zinc-500 hover:text-white text-sm transition-colors"
            >
              Settings
            </Link>
            <Link
              href="#"
              className="text-zinc-500 hover:text-white text-sm transition-colors"
            >
              Support
            </Link>
            <Link
              href="#"
              className="text-zinc-500 hover:text-white text-sm transition-colors"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;
