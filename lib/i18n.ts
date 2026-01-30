import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "../locales/en.json";
import ar from "../locales/ar.json";
import es from "../locales/es.json";

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  es: { translation: es },
};

export const supportedLanguages = [
  { code: "en", name: "English" },
  { code: "ar", name: "العربية" },
  { code: "es", name: "Español" },
] as const;

export type Locale = (typeof supportedLanguages)[number]["code"];

export function initI18n() {
  if (i18n.isInitialized) return;
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: "en",
      supportedLngs: ["en", "ar", "es"],
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
        lookupLocalStorage: "i18nextLng",
      },
    });
}

// Initialize on client so translations work before useEffect runs
if (typeof window !== "undefined") {
  initI18n();
}

export default i18n;
