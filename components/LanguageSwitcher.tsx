"use client";

import { useTranslation } from "react-i18next";
import { supportedLanguages, type Locale } from "@/lib/i18n";
import { LuGlobe } from "react-icons/lu";
import { useState, useRef, useEffect } from "react";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = supportedLanguages.find((l) => l.code === i18n.language) ?? supportedLanguages[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
        aria-label="Change language"
      >
        <LuGlobe className="w-4 h-4" />
        <span>{current.name}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 min-w-[140px] rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur py-1 shadow-xl z-50">
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                i18n.changeLanguage(lang.code as Locale);
                if (typeof document !== "undefined") {
                  document.documentElement.lang = lang.code;
                  document.documentElement.dir = lang.code === "ar" ? "rtl" : "ltr";
                }
                setOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                i18n.language === lang.code
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-zinc-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
