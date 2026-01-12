"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const t = useTranslations();

  return (
    <header className="bg-gray-800 shadow-sm border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-gray-100">
              {t("common.appName")}
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/"
                className="text-gray-400 hover:text-gray-100 text-sm font-medium"
              >
                {t("nav.dashboard")}
              </Link>
              <Link
                href="/invoices/new"
                className="text-gray-400 hover:text-gray-100 text-sm font-medium"
              >
                {t("dashboard.newInvoice")}
              </Link>
              <Link
                href="/products"
                className="text-gray-400 hover:text-gray-100 text-sm font-medium"
              >
                {t("nav.products")}
              </Link>
            </nav>
          </div>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
