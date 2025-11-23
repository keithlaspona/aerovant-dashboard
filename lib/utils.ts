import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { AirQualityLevel } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAirQualityLevel(mq135: number): AirQualityLevel {
  if (mq135 < 50) return "Good"
  if (mq135 < 100) return "Moderate"
  if (mq135 < 150) return "Unhealthy"
  if (mq135 < 200) return "Very Unhealthy"
  return "Hazardous"
}

export function getAirQualityStatus(classification: string | number): "Stable" | "Critical" {
  if (typeof classification === "number") {
    return classification === 1 ? "Stable" : "Critical"
  }
  return classification === "Stable" ? "Stable" : "Critical"
}

export function getAirQualityColor(level: AirQualityLevel): string {
  const colors = {
    Good: "air-quality-good",
    Moderate: "air-quality-moderate",
    Unhealthy: "air-quality-unhealthy",
    "Very Unhealthy": "air-quality-very-unhealthy",
    Hazardous: "air-quality-hazardous",
  }
  return colors[level]
}

export function getStatusColor(status: "Stable" | "Critical"): string {
  return status === "Stable"
    ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
    : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
}

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function getReportTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    smoke: "Smoke",
    odor: "Unusual Odor",
    dust: "Dust/Particulates",
    other: "Other",
  }
  return labels[type] || type
}

export function getReportStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
    investigating: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    resolved: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    dismissed: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  }
  return colors[status] || colors["pending"]
}
