import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { InvoiceStatus, OrderProductWithDetails } from "./types";

// Tailwind class name utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

// Format date
export function formatDate(
  dateString: string | null,
  locale = "en-US"
): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Calculate product revenue
export function calculateProductRevenue(
  product: OrderProductWithDetails
): number {
  return product.sellPricePerUnit * product.unitsPerCrate * product.numberOfCrates;
}

// Calculate product expense (cost)
export function calculateProductExpense(
  product: OrderProductWithDetails
): number {
  return product.buyPricePerUnit * product.unitsPerCrate * product.numberOfCrates;
}

// Calculate product profit
export function calculateProductProfit(
  product: OrderProductWithDetails
): number {
  return calculateProductRevenue(product) - calculateProductExpense(product);
}

// Get status color classes
export function getStatusColor(status: InvoiceStatus): string {
  const colors: Record<InvoiceStatus, string> = {
    scheduled: "bg-blue-100 text-blue-800",
    "in manufacturing": "bg-yellow-100 text-yellow-800",
    completed: "bg-purple-100 text-purple-800",
    booked: "bg-orange-100 text-orange-800",
    shipped: "bg-green-100 text-green-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

// Parse numeric string to number (handles locale)
export function parseNumber(value: string): number {
  return parseFloat(value.replace(/,/g, "")) || 0;
}

// Generate invoice number (format: JY + year + sequence)
export function generateInvoiceNumber(year: number, sequence: number): string {
  const paddedSequence = String(sequence).padStart(10, "0");
  return `JY0${year}${paddedSequence}`;
}
