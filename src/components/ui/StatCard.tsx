"use client";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  className?: string;
  valueClassName?: string;
}

export function StatCard({
  label,
  value,
  className,
  valueClassName,
}: StatCardProps) {
  return (
    <div className={cn("bg-white rounded-lg shadow-sm p-6", className)}>
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className={cn("text-3xl font-bold text-gray-900", valueClassName)}>
        {value}
      </div>
    </div>
  );
}
