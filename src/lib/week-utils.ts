/**
 * Week/month/quarter date utilities for rollup calculations.
 * All dates are Arizona-timezone aware via getArizonaToday().
 */

import { getArizonaToday } from "@/lib/arizona-date";

/** Parse ISO week string like "2026-W17" into Monday and Sunday dates (YYYY-MM-DD). */
export function parseISOWeek(weekStr: string): { monday: string; sunday: string } {
  const match = weekStr.match(/^(\d{4})-W(\d{2})$/);
  if (!match) throw new Error(`Invalid week format: ${weekStr}. Expected YYYY-Wnn`);
  const year = parseInt(match[1]);
  const week = parseInt(match[2]);

  // Jan 4 is always in week 1 per ISO 8601
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7; // Mon=1..Sun=7
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return {
    monday: monday.toISOString().split("T")[0],
    sunday: sunday.toISOString().split("T")[0],
  };
}

/** Get current ISO week string like "2026-W17" from Arizona today. */
export function getCurrentISOWeek(): string {
  const today = getArizonaToday();
  const d = new Date(today + "T12:00:00Z");
  // ISO week: Thursday determines the week's year
  const dayOfWeek = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek); // nearest Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** Parse month string "2026-04" into first and last day. */
export function parseMonth(monthStr: string): { firstDay: string; lastDay: string } {
  const match = monthStr.match(/^(\d{4})-(\d{2})$/);
  if (!match) throw new Error(`Invalid month format: ${monthStr}. Expected YYYY-MM`);
  const year = parseInt(match[1]);
  const month = parseInt(match[2]);
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDate = new Date(Date.UTC(year, month, 0)); // last day of month
  const lastDay = lastDate.toISOString().split("T")[0];
  return { firstDay, lastDay };
}

/** Get current month as "YYYY-MM". */
export function getCurrentMonth(): string {
  const today = getArizonaToday();
  return today.substring(0, 7);
}

/** Parse quarter "2026-Q2" into first and last day. */
export function parseQuarter(quarterStr: string): { firstDay: string; lastDay: string; months: string[] } {
  const match = quarterStr.match(/^(\d{4})-Q([1-4])$/);
  if (!match) throw new Error(`Invalid quarter format: ${quarterStr}. Expected YYYY-Qn`);
  const year = parseInt(match[1]);
  const q = parseInt(match[2]);
  const startMonth = (q - 1) * 3 + 1;
  const endMonth = startMonth + 2;
  const firstDay = `${year}-${String(startMonth).padStart(2, "0")}-01`;
  const lastDate = new Date(Date.UTC(year, endMonth, 0));
  const lastDay = lastDate.toISOString().split("T")[0];
  const months = [
    `${year}-${String(startMonth).padStart(2, "0")}`,
    `${year}-${String(startMonth + 1).padStart(2, "0")}`,
    `${year}-${String(startMonth + 2).padStart(2, "0")}`,
  ];
  return { firstDay, lastDay, months };
}

/** Get current quarter string. */
export function getCurrentQuarter(): string {
  const today = getArizonaToday();
  const month = parseInt(today.substring(5, 7));
  const q = Math.ceil(month / 3);
  return `${today.substring(0, 4)}-Q${q}`;
}

/** Format date as "Apr 20" style. */
export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** Get the Monday of the week containing a given date. */
export function getWeekMonday(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  const day = d.getUTCDay() || 7; // Mon=1..Sun=7
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d.toISOString().split("T")[0];
}
