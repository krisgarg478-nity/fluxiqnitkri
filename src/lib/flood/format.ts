import { format, parseISO } from "date-fns";
import type { RiskLevel } from "./types";

export function formatHour(iso: string) {
  try {
    return format(parseISO(iso), "HH:mm");
  } catch {
    return iso.slice(11, 16);
  }
}

export function formatDay(iso: string) {
  try {
    return format(parseISO(iso.length === 10 ? `${iso}T12:00:00` : iso), "EEE d");
  } catch {
    return iso;
  }
}

export function formatWhen(iso: string) {
  try {
    return format(parseISO(iso), "d MMM, HH:mm");
  } catch {
    return iso;
  }
}

export function riskTone(level: RiskLevel): string {
  switch (level) {
    case "CRITICAL":
      return "text-risk-critical";
    case "HIGH":
      return "text-risk-high";
    case "MODERATE":
      return "text-risk-moderate";
    default:
      return "text-risk-low";
  }
}

export function riskDot(level: RiskLevel): string {
  switch (level) {
    case "CRITICAL":
      return "bg-risk-critical";
    case "HIGH":
      return "bg-risk-high";
    case "MODERATE":
      return "bg-risk-moderate";
    default:
      return "bg-risk-low";
  }
}

export function mm(n: number, digits = 1) {
  return `${n.toFixed(digits)} mm`;
}
