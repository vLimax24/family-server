import { UrgencyLevel, StatusConfig } from "@/lib/types";

export function calculateDaysSince(timestamp: number | null): number | null {
  if (timestamp === null) return null;
  return Math.floor((Date.now() - timestamp * 1000) / (1000 * 60 * 60 * 24));
}

export function getUrgencyLevel(daysSince: number | null, thresholds: { high: number; medium: number }): UrgencyLevel {
  if (daysSince === null) return 'low';
  if (daysSince > thresholds.high) return 'high';
  if (daysSince > thresholds.medium) return 'medium';
  return 'low';
}

export function getLastActionText(
  daysSince: number | null,
  labels: { never: string; today: string; yesterday: string; daysAgo: (days: number) => string }
): string {
  if (daysSince === null) return labels.never;
  if (daysSince === 0) return labels.today;
  if (daysSince === 1) return labels.yesterday;
  return labels.daysAgo(daysSince);
}

// utils/styleConfig.ts - DRY: Status-abhängige Styles
const STATUS_CONFIGS: Record<UrgencyLevel, StatusConfig> = {
  high: {
    level: 'high',
    label: 'Dringend',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    iconBgColor: 'bg-red-50',
    iconBorderColor: 'border-red-200',
    iconColor: 'text-red-600',
    buttonColor: 'bg-red-600',
    buttonHoverColor: 'hover:bg-red-700',
    buttonShadowColor: 'shadow-red-600/30',
    dotColor: 'bg-red-500',
  },
  medium: {
    level: 'medium',
    label: 'Mittel',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    iconBgColor: 'bg-amber-50',
    iconBorderColor: 'border-amber-200',
    iconColor: 'text-amber-600',
    buttonColor: 'bg-amber-600',
    buttonHoverColor: 'hover:bg-amber-700',
    buttonShadowColor: 'shadow-amber-600/30',
    dotColor: 'bg-amber-500',
  },
  low: {
    level: 'low',
    label: 'Niedrig',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    iconBgColor: 'bg-emerald-50',
    iconBorderColor: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    buttonColor: 'bg-emerald-600',
    buttonHoverColor: 'hover:bg-emerald-700',
    buttonShadowColor: 'shadow-emerald-600/30',
    dotColor: 'bg-emerald-500',
  },
};

export function getStatusConfig(level: UrgencyLevel): StatusConfig {
  return STATUS_CONFIGS[level];
}