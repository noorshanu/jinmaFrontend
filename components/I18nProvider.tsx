"use client";

import { useEffect } from "react";
import i18n, { initI18n } from "@/lib/i18n";

function setDocDirection(lng: string) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
}

export default function I18nProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    initI18n();
    setDocDirection(i18n.language || "en");
    const onLangChange = (lng: string) => setDocDirection(lng || "en");
    i18n.on("languageChanged", onLangChange);
    return () => i18n.off("languageChanged", onLangChange);
  }, []);

  return <>{children}</>;
}
