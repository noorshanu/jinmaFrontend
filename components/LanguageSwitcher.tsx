"use client";

import { useTranslation } from "react-i18next";
import { supportedLanguages, type Locale } from "@/lib/i18n";
import { LuChevronDown } from "react-icons/lu";
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

  const changeLang = (lang: (typeof supportedLanguages)[number]) => {
    i18n.changeLanguage(lang.code as Locale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang.code;
      document.documentElement.dir = lang.code === "ar" ? "rtl" : "ltr";
    }
    setOpen(false);
  };

  return (
    <div
      className="relative"
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
        aria-label="Change language"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="text-lg leading-none" role="img" aria-hidden>
          {current.flag}
        </span>
        <span>{current.name}</span>
        <LuChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          className="absolute left-1 bottom-full mb-1 min-w-[160px] rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur py-1 shadow-xl z-50"
          role="menu"
        >
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              role="menuitem"
              onClick={() => changeLang(lang)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                i18n.language === lang.code
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-zinc-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-xl leading-none" role="img" aria-hidden>
                {lang.flag}
              </span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
