// src/utils/misc.ts
import { pathToFileURL } from "url";
import path from "path";

/**
 * Get a readable error message from unknown input.
 */
export function getErrorMessage(e: unknown): string {
  if (!e) return String(e);
  if (e instanceof Error) return e.message;
  try {
    return String(e);
  } catch {
    return "unknown";
  }
}

/**
 * Try to dynamically import a local module without throwing if it's missing.
 * Useful for optional modules (like a local firebase wrapper).
 */
export async function tryImportLocal(modulePath: string): Promise<any | null> {
  try {
    // ensure correct file resolution
    const absPath = path.isAbsolute(modulePath)
      ? modulePath
      : path.resolve(process.cwd(), modulePath);

    return await import(pathToFileURL(absPath).href);
  } catch {
    return null;
  }
}

/**
 * Convert all primitive values inside an object to strings
 * (simple shallow conversion — expand as needed).
 */
export function coerceExtraDataToStrings(obj: any): Record<string, string> {
  if (!obj || typeof obj !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    try {
      if (v === null || v === undefined) out[k] = "";
      else if (typeof v === "object") out[k] = JSON.stringify(v);
      else out[k] = String(v);
    } catch {
      out[k] = "";
    }
  }
  return out;
}
