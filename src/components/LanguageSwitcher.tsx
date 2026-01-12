"use client";

import { locales, localeNames, type Locale } from "@/i18n/config";
import { useLocaleContext } from "@/lib/providers";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleContext();

  return (
    <div className="flex items-center gap-2">
      <Globe size={16} className="text-gray-400" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="border border-gray-600 rounded-md px-2 py-1 text-sm bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {localeNames[loc]}
          </option>
        ))}
      </select>
    </div>
  );
}
