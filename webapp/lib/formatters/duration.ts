/**
 * Duration formatting utilities.
 *
 * Provides human friendly strings such as "3m 20s" or "1h 05m".
 * Uses Intl.NumberFormat to respect locale-specific units.
 */

type DurationFormatOptions = {
  /**
   * Include seconds even when minutes/hours are present.
   * Defaults to true.
   */
  includeSeconds?: boolean;
};

function getUnitFormatter(locale: string, unit: Intl.NumberFormatOptions["unit"]) {
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit,
    unitDisplay: "narrow",
    maximumFractionDigits: 0,
  });
}

/**
 * Format a duration expressed in seconds into a compact, locale-aware string.
 */
export function formatDuration(
  totalSeconds: number | null | undefined,
  locale = "en",
  options: DurationFormatOptions = {},
): string {
  if (totalSeconds == null || Number.isNaN(totalSeconds)) {
    return "—";
  }

  const includeSeconds = options.includeSeconds ?? true;
  const clampedSeconds = Math.max(0, Math.round(totalSeconds));

  const hours = Math.floor(clampedSeconds / 3600);
  const minutes = Math.floor((clampedSeconds % 3600) / 60);
  const seconds = clampedSeconds % 60;

  const hourFormatter = getUnitFormatter(locale, "hour");
  const minuteFormatter = getUnitFormatter(locale, "minute");
  const secondFormatter = getUnitFormatter(locale, "second");

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(hourFormatter.format(hours));
  }

  if (minutes > 0 || (hours > 0 && includeSeconds)) {
    parts.push(minuteFormatter.format(minutes));
  }

  if ((includeSeconds && seconds > 0 && hours === 0) || (hours === 0 && minutes === 0)) {
    parts.push(secondFormatter.format(seconds));
  }

  if (parts.length === 0) {
    return secondFormatter.format(0);
  }

  return parts.join(" ");
}
