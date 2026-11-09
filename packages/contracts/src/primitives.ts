import { z } from "zod";

export const idSchema = z.int().min(1);
export const isoDateTimeSchema = z.iso.datetime();
export const isoDateSchema = z.iso.date();
export const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const volumeMlSchema = z.int().min(1).max(5000);

export const timezoneSchema = z.string().refine(isTimezone, { message: "unknown IANA timezone" });

function isTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
