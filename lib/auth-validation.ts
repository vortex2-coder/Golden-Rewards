import { parsePhoneNumber } from "libphonenumber-js/max";
import type { CountryCode } from "libphonenumber-js";

export const usernamePattern = /^[a-zA-Z0-9_]{3,30}$/;

export function isValidPersonName(value: string) {
  return /^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u.test(value);
}

export function getValidPhoneNumber(nationalNumber: string, countryCode: string) {
  if (!nationalNumber || nationalNumber.startsWith("+")) return null;

  try {
    const parsed = parsePhoneNumber(nationalNumber, countryCode as CountryCode);
    if (!parsed.isValid() || parsed.country !== countryCode) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getPasswordError(password: string) {
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[a-z]/.test(password)) return "Add at least one lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Add at least one uppercase letter.";
  if (!/\d/.test(password)) return "Add at least one number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Add at least one symbol.";
  return null;
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function safeNextPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}
