"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface Invoice {
  invoice_number: string;
  invoice_date: string;
  client: string;
  status: string;
  delivery_location: string;
  fob: number;
  total_revenue: number;
  total_expense: number;
  profit: number;
  profit_margin: number;
}

async function fetchInvoices(): Promise<Invoice[]> {
  const res = await fetch("/api/invoices");
  if (!res.ok) {
    throw new Error("Failed to fetch invoices");
  }
  return res.json();
}

export default function HomePage() {
  const t = useTranslations();
  const {
    data: invoices = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["invoices"],
    queryFn: fetchInvoices,
  });

  const totalRevenue = invoices.reduce(
    (sum, inv) => sum + inv.total_revenue,
    0,
  );
  const totalProfit = invoices.reduce((sum, inv) => sum + inv.profit, 0);
  const activeOrders = invoices.filter(
    (inv) => inv.status !== "shipped" && inv.status !== "completed",
  ).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "shipped":
        return "bg-green-900 text-green-300";
      case "completed":
        return "bg-blue-900 text-blue-300";
      case "booked":
        return "bg-yellow-900 text-yellow-300";
      case "in manufacturing":
        return "bg-orange-900 text-orange-300";
      case "scheduled":
        return "bg-gray-700 text-gray-300";
      default:
        return "bg-gray-700 text-gray-300";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <p className="text-gray-400">{t("common.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <p className="text-red-400">{t("common.error")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-100">
          {t("dashboard.title")}
        </h1>

        {/* Stats Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-400">
              {t("dashboard.activeOrders")}{" "}
            </h2>
            <p className="text-3xl font-bold mt-2 text-gray-100">{activeOrders}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-400">
              {t("dashboard.totalRevenue")}
            </h2>
            <p className="text-3xl font-bold mt-2 text-green-400">
              ${totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-400">
              {t("dashboard.totalProfit")}
            </h2>
            <p
              className={`text-3xl font-bold mt-2 ${totalProfit >= 0 ? "text-blue-400" : "text-red-400"}`}
            >
              ${totalProfit.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="mt-8 bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-100">
              {t("nav.invoices")}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t("invoice.invoiceNumber")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t("invoice.date")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t("invoice.client")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t("invoice.status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t("invoice.deliveryLocation")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t("calculation.revenue")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t("calculation.expense")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t("calculation.profit")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {invoices.map((invoice) => (
                  <tr key={invoice.invoice_number} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/invoices/${invoice.invoice_number}`}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        {invoice.invoice_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {invoice.invoice_date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                      {invoice.client}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          invoice.status,
                        )}`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {invoice.delivery_location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-100">
                      ${invoice.total_revenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-400">
                      ${invoice.total_expense.toFixed(2)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                        invoice.profit >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      ${invoice.profit.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
