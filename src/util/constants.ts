export const DEFAULT_CONSTRUCTOR = ({}).constructor;

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;
export const MONTH = 30 * DAY;
export const YEAR = 365 * DAY;
export let SECONDS = (seconds: number) => seconds * SECOND;
export let MINUTES = (minutes: number) => minutes * MINUTE;
export let HOURS = (hours: number) => hours * HOUR;
export let DAYS = (days: number) => days * DAY;
export let WEEKS = (weeks: number) => weeks * WEEK;
export let MONTHS = (months: number) => months * MONTH;
export let YEARS = (years: number) => years * YEAR;