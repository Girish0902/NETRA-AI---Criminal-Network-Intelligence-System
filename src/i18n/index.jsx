import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import en from "./locales/en.json";
import hi from "./locales/hi.json";
import kn from "./locales/kn.json";

const RESOURCES = { en, hi, kn };

const STORAGE_KEY = "NETRA-language";

const SUPPORTED_LOCALES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "kn", label: "ಕನ್ನಡ" },
];

function normalizeLocale(value) {
  const raw = String(value ?? "").toLowerCase();

  if (/à²|ಕ|कन्नड़/.test(raw)) {
    return "kn";
  }

  if (/हिन्दी|हिंदी|कन्नड|hindi/.test(raw)) {
    return "hi";
  }

  if (/^en\b|english/.test(raw)) {
    return "en";
  }

  if (raw === "en" || raw === "hi" || raw === "kn") {
    return raw;
  }

  return null;
}

function readInitialLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    const candidate = normalizeLocale(stored);

    if (candidate) {
      return candidate;
    }

    const settings = JSON.parse(
      localStorage.getItem("NETRA-settings") || "{}",
    );

    const fromSettings = normalizeLocale(
      settings.language,
    );

    if (fromSettings) {
      return fromSettings;
    }

    return "en";
  } catch {
    return "en";
  }
}

const LanguageContext = createContext({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
  locales: SUPPORTED_LOCALES,
});

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(readInitialLocale);

  const setLocale = useCallback((value) => {
    const next = normalizeLocale(value) || "en";

    setLocaleState(next);

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable — ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.language = locale;
  }, [locale]);

  useEffect(() => {
    const handleLanguageChange = (event) => {
      setLocale(event.detail);
    };

    window.addEventListener(
      "NETRA-language-change",
      handleLanguageChange,
    );

    return () => {
      window.removeEventListener(
        "NETRA-language-change",
        handleLanguageChange,
      );
    };
  }, [setLocale]);

  const t = useCallback(
    (key, variables) => {
      const dictionary = RESOURCES[locale] ?? en;

      const lookup = (dict) =>
        key.split(".").reduce(
          (value, part) =>
            value != null ? value[part] : undefined,
          dict,
        );

      let resolved = lookup(dictionary);

      if (typeof resolved !== "string" && locale !== "en") {
        resolved = lookup(en);
      }

      if (typeof resolved !== "string") {
        return key;
      }

      if (!variables) {
        return resolved;
      }

      return resolved.replace(
        /\{\{(\w+)\}\}/g,
        (match, name) =>
          variables[name] != null
            ? String(variables[name])
            : match,
      );
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, locales: SUPPORTED_LOCALES }),
    [locale, setLocale, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n() {
  return useContext(LanguageContext);
}