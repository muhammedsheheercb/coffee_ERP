import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ─── Tailwind class merge ────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency format ────────────────────────────────
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Date format ────────────────────────────────────
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-SA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateInput(date: Date | string): string {
  return new Date(date).toISOString().split("T")[0] ?? "";
}

// ─── Month name ─────────────────────────────────────
export function getMonthName(month: number): string {
  return new Intl.DateTimeFormat("en-SA", { month: "short" }).format(
    new Date(2024, month - 1, 1)
  );
}

// ─── Unique number generator ─────────────────────────
export function generateUniqueNumber(prefix: string): string {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${ts}${rand}`;
}

// ─── Truncate text ───────────────────────────────────
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

// ─── Safe JSON parse ─────────────────────────────────
export function safeJson<T>(val: string, fallback: T): T {
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}