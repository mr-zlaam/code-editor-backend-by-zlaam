// Define supported time units as a union type

import type { TTIMESTRING, TTIMEUNIT } from "../../type/types";

// Type guard to check if a string is a valid TTIMESTRING
function isTTIMESTRING(str: string): str is TTIMESTRING {
  const [valueStr, unit] = str.split(" ");
  const value = parseInt(valueStr, 10);

  if (isNaN(value)) return false;

  // Check against all possible time units
  const validUnits: TTIMEUNIT[] = [
    "second",
    "seconds",
    "minute",
    "minutes",
    "hour",
    "hours",
    "day",
    "days",
    "week",
    "weeks",
    "month",
    "months",
    "year",
    "years",
  ];

  return validUnits.includes(unit as TTIMEUNIT);
}

export function getFutureTimestamp(TTIMESTRING: TTIMESTRING): Date {
  if (!isTTIMESTRING(TTIMESTRING)) {
    throw new Error(
      `Invalid time string format. Expected format like "1 hour", got "${TTIMESTRING as TTIMESTRING}"`,
    );
  }

  const now = new Date();
  const [valueStr, unit] = TTIMESTRING.split(" ");
  const value = parseInt(valueStr, 10);

  // Calculate milliseconds to add
  const millisecondsToAdd = calculateMilliseconds(value, unit as TTIMEUNIT);
  return new Date(now.getTime() + millisecondsToAdd);
}

// Helper function to calculate milliseconds
function calculateMilliseconds(value: number, unit: TTIMEUNIT): number {
  const unitMap: Record<TTIMEUNIT, number> = {
    second: 1000,
    seconds: 1000,
    minute: 60 * 1000,
    minutes: 60 * 1000,
    hour: 60 * 60 * 1000,
    hours: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    months: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
    years: 365 * 24 * 60 * 60 * 1000,
  };

  return value * unitMap[unit];
}

// Alternative version that returns an ISO string
export function getFutureTimestampISO(TTIMESTRING: TTIMESTRING): string {
  return getFutureTimestamp(TTIMESTRING).toISOString();
}

// Utility to create valid time strings with type safety
export function createTTIMESTRING(value: number, unit: TTIMEUNIT): TTIMESTRING {
  return `${value} ${unit}`;
}

// Get all supported time units
export const TIME_UNITS: TTIMEUNIT[] = [
  "second",
  "seconds",
  "minute",
  "minutes",
  "hour",
  "hours",
  "day",
  "days",
  "week",
  "weeks",
  "month",
  "months",
  "year",
  "years",
];

// Validate a time string without throwing
export function isValidTTIMESTRING(str: string): str is TTIMESTRING {
  return isTTIMESTRING(str);
}

// Parse a time string into value and unit
export function parseTTIMESTRING(TTIMESTRING: TTIMESTRING): {
  value: number;
  unit: TTIMEUNIT;
} {
  if (!isTTIMESTRING(TTIMESTRING)) {
    throw new Error("Invalid time string");
  }
  const [valueStr, unit] = TTIMESTRING.split(" ");
  return {
    value: parseInt(valueStr, 10),
    unit: unit as TTIMEUNIT,
  };
}
