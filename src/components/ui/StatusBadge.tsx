"use client";

import { cn, getStatusColor } from "@/lib/utils";
import type { InvoiceStatus } from "@/lib/types";
import { useTranslations } from "next-intl";

interface StatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const t = useTranslations("status");

  const statusLabels: Record<InvoiceStatus, string> = {
    scheduled: t("scheduled"),
    "in manufacturing": t("inManufacturing"),
    completed: t("completed"),
    booked: t("booked"),
    shipped: t("shipped"),
  };

  return (
    <span
      className={cn(
        "inline-block px-3 py-1 rounded-full text-xs font-medium",
        getStatusColor(status),
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
