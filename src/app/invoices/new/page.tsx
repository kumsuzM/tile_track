"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Button, Card, Input, Select } from "@/components/ui";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { CreateInvoiceInput, InvoiceStatus } from "@/lib/types";
import type { Locale } from "@/i18n/config";

export default function NewInvoicePage() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [invoice, setInvoice] = useState<CreateInvoiceInput>({
    invoiceNumber: "",
    fob: 0,
    invoiceDate: new Date().toISOString().split("T")[0],
    client: "",
    status: "scheduled",
    deliveryLocation: "",
    estimatedDeliveryDate: "",
    actualDeliveryDate: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoice.invoiceNumber || !invoice.client || !invoice.deliveryLocation) {
      alert(t("validation.fillAllFields"));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoice),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/invoices/${data.invoiceNumber}`);
      }
    } catch (error) {
      console.error("Failed to create invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: "scheduled", label: t("status.scheduled") },
    { value: "in manufacturing", label: t("status.inManufacturing") },
    { value: "completed", label: t("status.completed") },
    { value: "booked", label: t("status.booked") },
    { value: "shipped", label: t("status.shipped") },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={20} />
                {t("common.back")}
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h2 className="text-xl font-semibold">
                {t("invoice.createNew")}
              </h2>
            </div>
            <LanguageSwitcher currentLocale={locale} />
          </div>
        </Card>

        {/* Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t("invoice.invoiceNumber")}
                value={invoice.invoiceNumber}
                onChange={(e) =>
                  setInvoice({ ...invoice, invoiceNumber: e.target.value })
                }
                placeholder="e.g., JY02025000000001"
                required
              />
              <Input
                type="date"
                label={t("invoice.date")}
                value={invoice.invoiceDate}
                onChange={(e) =>
                  setInvoice({ ...invoice, invoiceDate: e.target.value })
                }
                required
              />
            </div>

            <Input
              label={t("invoice.client")}
              value={invoice.client}
              onChange={(e) =>
                setInvoice({ ...invoice, client: e.target.value })
              }
              placeholder="e.g., Ali Bey"
              required
            />

            <Input
              label={t("invoice.deliveryLocation")}
              value={invoice.deliveryLocation}
              onChange={(e) =>
                setInvoice({ ...invoice, deliveryLocation: e.target.value })
              }
              placeholder="e.g., Ankara, Çankaya"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label={t("invoice.status")}
                value={invoice.status}
                onChange={(e) =>
                  setInvoice({ ...invoice, status: e.target.value as InvoiceStatus })
                }
                options={statusOptions}
              />
              <Input
                type="number"
                step="0.01"
                label={t("invoice.fob")}
                value={invoice.fob || ""}
                onChange={(e) =>
                  setInvoice({ ...invoice, fob: parseFloat(e.target.value) || 0 })
                }
                placeholder="e.g., 200.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label={t("invoice.estimatedDelivery")}
                value={invoice.estimatedDeliveryDate}
                onChange={(e) =>
                  setInvoice({ ...invoice, estimatedDeliveryDate: e.target.value })
                }
                required
              />
              <Input
                type="date"
                label={t("invoice.actualDelivery")}
                value={invoice.actualDeliveryDate || ""}
                onChange={(e) =>
                  setInvoice({
                    ...invoice,
                    actualDeliveryDate: e.target.value || null,
                  })
                }
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/")}
                className="flex-1"
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? t("common.loading") : t("common.save")}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
