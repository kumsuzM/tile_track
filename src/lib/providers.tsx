"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { useState, useEffect, createContext, useContext } from "react";
import type { Locale } from "@/i18n/config";
import en from "../../messages/en.json";
import tr from "../../messages/tr.json";

const messages = { en, tr };

type LocaleContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextType | null>(null);

export function useLocaleContext() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocaleContext must be used within Providers");
  }
  return context;
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("locale="));
  const locale = cookie?.split("=")[1];
  return locale === "tr" ? "tr" : "en";
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(getInitialLocale());
  }, []);

  const setLocale = (newLocale: Locale) => {
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
    setLocaleState(newLocale);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleContext.Provider value={{ locale, setLocale }}>
        <NextIntlClientProvider
          locale={locale}
          messages={messages[locale]}
          timeZone="Europe/Istanbul"
        >
          {children}
        </NextIntlClientProvider>
      </LocaleContext.Provider>
    </QueryClientProvider>
  );
}
