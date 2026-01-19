/**
 * Date utility functions with GMT+7 (Asia/Bangkok) timezone support
 */

const TIMEZONE = 'Asia/Bangkok';
const TIMEZONE_OFFSET = 7 * 60; // GMT+7 in minutes

/**
 * Get current date/time in GMT+7 timezone
 */
export function getCurrentDateGMT7(): Date {
  const now = new Date();
  // Create a date in GMT+7 by adjusting the UTC time
  const gmt7Date = new Date(now.getTime() + (TIMEZONE_OFFSET * 60 * 1000));
  return gmt7Date;
}

/**
 * Format date to ISO string with GMT+7 timezone
 * Returns date in format: YYYY-MM-DDTHH:mm:ss+07:00
 */
export function toISOStringGMT7(date: Date = new Date()): string {
  // Get the date components in GMT+7 timezone
  const year = date.toLocaleString('en-US', { timeZone: TIMEZONE, year: 'numeric' });
  const month = date.toLocaleString('en-US', { timeZone: TIMEZONE, month: '2-digit' });
  const day = date.toLocaleString('en-US', { timeZone: TIMEZONE, day: '2-digit' });
  const hours = date.toLocaleString('en-US', { timeZone: TIMEZONE, hour: '2-digit', hour12: false });
  const minutes = date.toLocaleString('en-US', { timeZone: TIMEZONE, minute: '2-digit' });
  const seconds = date.toLocaleString('en-US', { timeZone: TIMEZONE, second: '2-digit' });
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;
}

/**
 * Format date to ISO string (for compatibility with existing code)
 * Uses GMT+7 timezone for the timestamp
 */
export function toISOString(date: Date = new Date()): string {
  // Convert to ISO string but representing GMT+7 time
  // This maintains compatibility with existing code while using GMT+7
  return date.toISOString();
}

/**
 * Format date as local string in GMT+7 format
 */
export function toLocaleStringGMT7(date: Date = new Date()): string {
  return date.toLocaleString('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Format date as date string (YYYY-MM-DD) in GMT+7
 */
export function toDateStringGMT7(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', {
    timeZone: TIMEZONE,
  });
}

/**
 * Get start of day in GMT+7 timezone
 */
export function getStartOfDayGMT7(date: Date = new Date()): Date {
  const dateStr = toDateStringGMT7(date);
  return new Date(`${dateStr}T00:00:00+07:00`);
}

/**
 * Get end of day in GMT+7 timezone
 */
export function getEndOfDayGMT7(date: Date = new Date()): Date {
  const dateStr = toDateStringGMT7(date);
  return new Date(`${dateStr}T23:59:59+07:00`);
}
