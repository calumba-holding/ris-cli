// Utility functions

import pkg from "exponential-backoff";
const { backOff } = pkg;

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function backoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  return backOff(fn, {
    maxDelay: 10000,
    numOfAttempts: maxRetries,
    startingDelay: baseDelay,
  });
}

/**
 * Format date to ISO string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Get current ISO date string
 */
export function getCurrentDate(): string {
  return new Date().toISOString();
}

/**
 * Parse command line flags for output format
 */
export function parseOutputFormat(value: unknown): "json" | "text" {
  // commander boolean flag: --json => true
  if (value === true) return "json";
  if (value === "json") return "json";
  return "text";
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, length: number = 100): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}

/**
 * Format output based on type
 */
export function formatOutput(data: any, format: "json" | "text"): string {
  if (format === "json") {
    return JSON.stringify(data, null, 2);
  }

  if (Array.isArray(data)) {
    return data.map((item) => formatObject(item)).join("\n---\n");
  }

  return formatObject(data);
}

/**
 * Format single object for text output
 */
function formatObject(obj: Record<string, any>): string {
  return Object.entries(obj)
    .map(([key, value]) => {
      const formattedValue =
        typeof value === "object" ? JSON.stringify(value) : String(value);
      return `${key}: ${formattedValue}`;
    })
    .join("\n");
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe filename from string
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "_")
    .substring(0, 200);
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
